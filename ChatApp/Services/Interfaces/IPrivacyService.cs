using ChatApp.Models;

namespace ChatApp.Services.Interfaces;

public interface IPrivacyService
{
    Task<UserSettings> GetSettingsAsync(string userId);

    Task<bool> AreFriendsAsync(string userId1, string userId2);

    Task<bool> CanViewProfileAsync(
        string targetUserId,
        string viewerUserId);

    Task<bool> CanViewOnlineStatusAsync(
        string targetUserId,
        string viewerUserId);

    Task<bool> CanViewLastSeenAsync(
        string targetUserId,
        string viewerUserId);

    Task<bool> CanSendMessageAsync(
        string senderId,
        string receiverId);

    Task<bool> CanCallAsync(
        string callerId,
        string receiverId);

    Task<bool> CanSendFriendRequestAsync(
        string senderId,
        string receiverId);

    Task<bool> IsDiscoverableAsync(string userId);
}
