using ChatApp.Data;
using ChatApp.Hubs;
using ChatApp.Models;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<ChatHub> _hub;

    public NotificationService(
        ApplicationDbContext db,
        IHubContext<ChatHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task<Notification> CreateAsync(
        string userId,
        NotificationType type,
        string title,
        string? content = null,
        string? relatedEntityId = null)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException(
                "O usuário da notificação é obrigatório.",
                nameof(userId));
        }

        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Content = content,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);

        await _db.SaveChangesAsync();

        // Enviar em tempo real para o usuário
        await _hub.Clients
            .Group(ChatHub.UserGroup(userId))
            .SendAsync(
                "ReceiveNotification",
                new
                {
                    notification.Id,

                    Type = notification.Type.ToString(),

                    notification.Title,

                    notification.Content,

                    notification.RelatedEntityId,

                    notification.IsRead,

                    notification.CreatedAt
                });

        return notification;
    }
}