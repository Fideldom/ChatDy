using ChatApp.Data;
using ChatApp.DTOs;
using ChatApp.Hubs;
using ChatApp.Models;
using ChatApp.Services;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

// MENSAGENS
// Responsável por:
// - Conversas
// - Mensagens de texto
// - Imagens
// - Áudio
// - Ficheiros
// - Leitura de mensagens
// - SignalR
// - Privacidade de mensagens

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
    private readonly IPrivacyService _privacy;

    public MessagesController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        IFileStorageService fileStorage,
        IHubContext<ChatHub> hub,
        INotificationService notifications,
        IPrivacyService privacy)
    {
        _db = db;
        _userManager = userManager;
        _fileStorage = fileStorage;
        _hub = hub;
        _notifications = notifications;
        _privacy = privacy;
    }

    private string CurrentUserId =>
        _userManager.GetUserId(User)!;

    // OBTER CONVERSA
    [HttpGet("conversation/{friendId}")]
    public async Task<IActionResult> GetConversation(
        string friendId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var userId = CurrentUserId;

        if (string.IsNullOrWhiteSpace(friendId))
            return BadRequest(
                "Utilizador inválido.");

        if (page < 1)
            page = 1;

        if (pageSize < 1)
            pageSize = 30;

        if (pageSize > 100)
            pageSize = 100;

        // Só é possível visualizar a conversa se
        // o destinatário permitir mensagens.
        var canSend =
            await _privacy.CanSendMessageAsync(
                userId,
                friendId);

        var isFriend =
            await _privacy.AreFriendsAsync(
                userId,
                friendId);

        var targetSettings =
            await _privacy.GetSettingsAsync(
                friendId);

        // O próprio utilizador ou uma amizade existente
        // pode consultar a conversa existente.
        //
        // Se MessagePrivacy = nobody, não bloqueamos
        // o histórico já existente.
        // A regra de envio será aplicada no POST.
        if (!canSend &&
            !isFriend &&
            targetSettings != null &&
            targetSettings.MessagePrivacy != "everyone")
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Não tem permissão para aceder a esta conversa.");
        }

        var query = _db.Messages
            .Where(m =>
                !m.IsDeleted &&
                (
                    (
                        m.SenderId == userId &&
                        m.ReceiverId == friendId
                    )
                    ||
                    (
                        m.SenderId == friendId &&
                        m.ReceiverId == userId
                    )
                ))
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        var messages =
            await query
                .Select(m => new MessageViewDto
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
                })
                .ToListAsync();

        messages.Reverse();

        return Ok(messages);
    }

    // ENVIAR MENSAGEM DE TEXTO
    [HttpPost("text")]
    public async Task<IActionResult> SendText(
        SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ReceiverId))
            return BadRequest(
                "Destinatário inválido.");

        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(
                "Mensagem vazia.");

        var userId = CurrentUserId;

        var receiver =
            await _userManager.FindByIdAsync(
                dto.ReceiverId);

        if (receiver == null)
            return NotFound(
                "Destinatário não encontrado.");

        var canSend =
            await _privacy.CanSendMessageAsync(
                userId,
                dto.ReceiverId);

        if (!canSend)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Este utilizador não permite receber mensagens de si.");
        }

        var message = new Message
        {
            SenderId = userId,
            ReceiverId = dto.ReceiverId,
            Type = MessageType.Text,
            Content = dto.Content
        };

        return await PersistAndBroadcastAsync(
            message);
    }

    // ENVIAR ANEXO
    [HttpPost("attachment")]
    public async Task<IActionResult> SendAttachment(
        [FromForm] string receiverId,
        [FromForm] MessageType type,
        IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(receiverId))
            return BadRequest(
                "Destinatário inválido.");

        if (file == null || file.Length == 0)
            return BadRequest(
                "Ficheiro inválido.");

        var userId = CurrentUserId;

        var receiver =
            await _userManager.FindByIdAsync(
                receiverId);

        if (receiver == null)
            return NotFound(
                "Destinatário não encontrado.");

        var canSend =
            await _privacy.CanSendMessageAsync(
                userId,
                receiverId);

        if (!canSend)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Este utilizador não permite receber mensagens de si.");
        }

        var subFolder =
            type == MessageType.Audio
                ? "audio"
                : type == MessageType.Image
                    ? "images"
                    : "files";

        var (url, name, size) =
            await _fileStorage.SaveFileAsync(
                file,
                subFolder);

        var message = new Message
        {
            SenderId = userId,
            ReceiverId = receiverId,
            Type = type,
            AttachmentUrl = url,
            AttachmentName = name,
            AttachmentSize = size
        };

        return await PersistAndBroadcastAsync(
            message);
    }

    // MARCAR COMO LIDA
    [HttpPost("{messageId:int}/read")]
    public async Task<IActionResult> MarkAsRead(
        int messageId)
    {
        var userId = CurrentUserId;

        var message =
            await _db.Messages.FirstOrDefaultAsync(
                m =>
                    m.Id == messageId &&
                    m.ReceiverId == userId);

        if (message == null)
            return NotFound();

        message.IsRead = true;
        message.ReadAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _hub.Clients
            .Group(ChatHub.UserGroup(
                message.SenderId))
            .SendAsync(
                "MessageRead",
                message.Id);

        return Ok();
    }

    // PERSISTIR + ENVIAR VIA SIGNALR
    private async Task<IActionResult> PersistAndBroadcastAsync(
        Message message)
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

        // Destinatário
        await _hub.Clients
            .Group(ChatHub.UserGroup(
                message.ReceiverId))
            .SendAsync(
                "ReceiveMessage",
                dto);

        // Remetente
        await _hub.Clients
            .Group(ChatHub.UserGroup(
                message.SenderId))
            .SendAsync(
                "ReceiveMessage",
                dto);

        var sender =
            await _db.Users.FindAsync(
                message.SenderId);

        await _notifications.CreateAsync(
            message.ReceiverId,
            NotificationType.NewMessage,
            $"Nova mensagem de {sender?.FullName}",
            message.Type == MessageType.Text
                ? message.Content
                : $"[{message.Type}]",
            message.SenderId);

        return Ok(dto);
    }
}
