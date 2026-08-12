using ChatApp.Data;
using ChatApp.DTOs;
using ChatApp.Hubs;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

// Envio/leitura de mensagens de texto, áudio e ficheiros. O envio "confirma-se" via REST
// (persistência garantida) e depois é reencaminhado em tempo real via SignalR.
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IFileStorageService _fileStorage;
    private readonly IHubContext<ChatHub> _hub;
    private readonly INotificationService _notifications;

    public MessagesController(ApplicationDbContext db, UserManager<ApplicationUser> userManager,
        IFileStorageService fileStorage, IHubContext<ChatHub> hub, INotificationService notifications)
    {
        _db = db;
        _userManager = userManager;
        _fileStorage = fileStorage;
        _hub = hub;
        _notifications = notifications;
    }

    private string CurrentUserId => _userManager.GetUserId(User)!;

    // Histórico de conversa 1-para-1, paginado
    [HttpGet("conversation/{friendId}")]
    public async Task<IActionResult> GetConversation(string friendId, [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        var userId = CurrentUserId;

        var query = _db.Messages
            .Where(m => !m.IsDeleted &&
                ((m.SenderId == userId && m.ReceiverId == friendId) ||
                 (m.SenderId == friendId && m.ReceiverId == userId)))
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        var messages = await query.Select(m => new MessageViewDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            ReceiverId = m.ReceiverId,
            Type = m.Type,
            Content = m.Content,
            AttachmentUrl = m.AttachmentUrl,
            AttachmentName = m.AttachmentName,
            SentAt = m.SentAt,
            IsRead = m.IsRead
        }).ToListAsync();

        messages.Reverse();
        return Ok(messages);
    }

    // Mensagem de texto
    [HttpPost("text")]
    public async Task<IActionResult> SendText(SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest("Mensagem vazia.");

        var message = new Message
        {
            SenderId = CurrentUserId,
            ReceiverId = dto.ReceiverId,
            Type = MessageType.Text,
            Content = dto.Content
        };

        return await PersistAndBroadcastAsync(message);
    }

    // Mensagem com áudio ou ficheiro (multipart/form-data)
    [HttpPost("attachment")]
    public async Task<IActionResult> SendAttachment([FromForm] string receiverId, [FromForm] MessageType type, IFormFile file)
    {
        var subFolder = type == MessageType.Audio ? "audio" : (type == MessageType.Image ? "images" : "files");
        var (url, name, size) = await _fileStorage.SaveFileAsync(file, subFolder);

        var message = new Message
        {
            SenderId = CurrentUserId,
            ReceiverId = receiverId,
            Type = type,
            AttachmentUrl = url,
            AttachmentName = name,
            AttachmentSize = size
        };

        return await PersistAndBroadcastAsync(message);
    }

    [HttpPost("{messageId:int}/read")]
    public async Task<IActionResult> MarkAsRead(int messageId)
    {
        var userId = CurrentUserId;
        var message = await _db.Messages.FirstOrDefaultAsync(m => m.Id == messageId && m.ReceiverId == userId);
        if (message == null) return NotFound();

        message.IsRead = true;
        message.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _hub.Clients.Group(ChatHub.UserGroup(message.SenderId)).SendAsync("MessageRead", message.Id);
        return Ok();
    }

    private async Task<IActionResult> PersistAndBroadcastAsync(Message message)
    {
        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var dto = new MessageViewDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            ReceiverId = message.ReceiverId,
            Type = message.Type,
            Content = message.Content,
            AttachmentUrl = message.AttachmentUrl,
            AttachmentName = message.AttachmentName,
            SentAt = message.SentAt,
            IsRead = message.IsRead
        };

        await _hub.Clients.Group(ChatHub.UserGroup(message.ReceiverId)).SendAsync("ReceiveMessage", dto);
        await _hub.Clients.Group(ChatHub.UserGroup(message.SenderId)).SendAsync("ReceiveMessage", dto);

        var sender = await _db.Users.FindAsync(message.SenderId);
        await _notifications.CreateAsync(message.ReceiverId, NotificationType.NewMessage,
            $"Nova mensagem de {sender?.FullName}",
            message.Type == MessageType.Text ? message.Content : $"[{message.Type}]",
            message.SenderId);

        return Ok(dto);
    }
}
