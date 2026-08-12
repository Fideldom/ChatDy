using ChatApp.Models;

namespace ChatApp.Services;

public interface INotificationService
{
    Task<Notification> CreateAsync(string userId, NotificationType type, string title, string? content = null, string? relatedEntityId = null);
}
