using ChatApp.Data;
using ChatApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public NotificationsController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    private string CurrentUserId =>
        _userManager.GetUserId(User)!;


    // ============================================================
    // TODAS AS NOTIFICAÇÕES
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool onlyUnread = false)
    {
        var userId = CurrentUserId;

        var query = _db.Notifications
            .Where(n => n.UserId == userId);

        if (onlyUnread)
        {
            query = query.Where(n => !n.IsRead);
        }

        var result = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new
            {
                n.Id,

                Type = n.Type.ToString(),

                n.Title,

                n.Content,

                n.RelatedEntityId,

                n.IsRead,

                n.CreatedAt
            })
            .ToListAsync();

        return Ok(result);
    }


    // ============================================================
    // CONTADOR DE NOTIFICAÇÕES
    // ============================================================

    [HttpGet("count")]
    public async Task<IActionResult> GetNotificationCount()
    {
        var userId = CurrentUserId;

        var count = await _db.Notifications
            .CountAsync(n =>
                n.UserId == userId &&
                !n.IsRead &&
                n.Type != NotificationType.NewMessage &&
                n.Type != NotificationType.MeetingInvite);

        return Ok(new
        {
            count
        });
    }


    // ============================================================
    // CONTADOR DE MENSAGENS
    // ============================================================

    [HttpGet("messages-count")]
    public async Task<IActionResult> GetMessagesCount()
    {
        var userId = CurrentUserId;

        var count = await _db.Messages
            .CountAsync(m =>
                m.ReceiverId == userId &&
                !m.IsRead &&
                !m.IsDeleted);

        return Ok(new
        {
            count
        });
    }


    // ============================================================
    // CONTADOR DE REUNIÕES
    // ============================================================

    [HttpGet("meetings-count")]
    public async Task<IActionResult> GetMeetingsCount()
    {
        var userId = CurrentUserId;

        var count = await _db.Notifications
            .CountAsync(n =>
                n.UserId == userId &&
                !n.IsRead &&
                n.Type == NotificationType.MeetingInvite);

        return Ok(new
        {
            count
        });
    }


    // ============================================================
    // MARCAR NOTIFICAÇÃO COMO LIDA
    // ============================================================

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = CurrentUserId;

        var notification =
            await _db.Notifications
                .FirstOrDefaultAsync(n =>
                    n.Id == id &&
                    n.UserId == userId);

        if (notification == null)
        {
            return NotFound();
        }

        notification.IsRead = true;

        await _db.SaveChangesAsync();

        return Ok();
    }


    // ============================================================
    // MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
    // ============================================================

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = CurrentUserId;

        var unread =
            await _db.Notifications
                .Where(n =>
                    n.UserId == userId &&
                    !n.IsRead &&
                    n.Type != NotificationType.NewMessage &&
                    n.Type != NotificationType.MeetingInvite)
                .ToListAsync();

        foreach (var notification in unread)
        {
            notification.IsRead = true;
        }

        await _db.SaveChangesAsync();

        return Ok();
    }


    // ============================================================
    // MARCAR MENSAGENS COMO LIDAS
    // ============================================================

    [HttpPost("messages/read")]
    public async Task<IActionResult> MarkMessagesAsRead()
    {
        var userId = CurrentUserId;

        var messages =
            await _db.Messages
                .Where(m =>
                    m.ReceiverId == userId &&
                    !m.IsRead &&
                    !m.IsDeleted)
                .ToListAsync();

        foreach (var message in messages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return Ok();
    }


    // ============================================================
    // MARCAR REUNIÕES COMO LIDAS
    // ============================================================

    [HttpPost("meetings/read")]
    public async Task<IActionResult> MarkMeetingsAsRead()
    {
        var userId = CurrentUserId;

        var notifications =
            await _db.Notifications
                .Where(n =>
                    n.UserId == userId &&
                    !n.IsRead &&
                    n.Type == NotificationType.MeetingInvite)
                .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _db.SaveChangesAsync();

        return Ok();
    }

    // MARCAR Mensagens como lidas pra cada conversa!
    [HttpPost("messages/{friendId}/read")]
    public async Task<IActionResult> MarkConversationMessagesAsRead(
    string friendId)
    {
        var userId = CurrentUserId;

        var messages = await _db.Messages
            .Where(m =>
                m.SenderId == friendId &&
                m.ReceiverId == userId &&
                !m.IsRead &&
                !m.IsDeleted)
            .ToListAsync();

        foreach (var message in messages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            count = messages.Count
        });
    }
}
