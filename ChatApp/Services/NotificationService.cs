using ChatApp.Data;
using ChatApp.Hubs;
using ChatApp.Models;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Services;

// Cria notificações persistentes e envia em tempo real via SignalR (grupo por utilizador).
public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<ChatHub> _hub;

    public NotificationService(ApplicationDbContext db, IHubContext<ChatHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task<Notification> CreateAsync(string userId, NotificationType type, string title, string? content = null, string? relatedEntityId = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Content = content,
            RelatedEntityId = relatedEntityId
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        await _hub.Clients.Group(ChatHub.UserGroup(userId))
            .SendAsync("ReceiveNotification", new
            {
                notification.Id,
                Type = notification.Type.ToString(),
                notification.Title,
                notification.Content,
                notification.RelatedEntityId,
                notification.CreatedAt
            });

        return notification;
    }
}
