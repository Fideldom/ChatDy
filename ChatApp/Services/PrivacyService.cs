using ChatApp.Data;
using ChatApp.Models;
using ChatApp.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Services;

public class PrivacyService : IPrivacyService
{
    private readonly ApplicationDbContext _db;

    public PrivacyService(ApplicationDbContext db)
    {
        _db = db;
    }

    // OBTER CONFIGURAÇÕES

    public async Task<UserSettings> GetSettingsAsync(
        string userId)
    {
        var settings = await _db.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings != null)
            return settings;

        settings = new UserSettings
        {
            Id = Guid.NewGuid(),
            UserId = userId,

            Language = "pt",
            TimeZone = "Africa/Luanda",
            TimeFormat = "24h",

            ProfileVisibility = "everyone",
            OnlineStatusVisibility = "everyone",
            LastSeenVisibility = "everyone",
            MessagePrivacy = "everyone",
            CallPrivacy = "everyone",
            FriendRequestPrivacy = "everyone",

            Discoverable = true,

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.UserSettings.Add(settings);

        await _db.SaveChangesAsync();

        return settings;
    }

    // VERIFICAR AMIZADE
    public async Task<bool> AreFriendsAsync(
        string userId1,
        string userId2)
    {
        if (string.IsNullOrWhiteSpace(userId1) ||
            string.IsNullOrWhiteSpace(userId2))
        {
            return false;
        }

        if (userId1 == userId2)
            return true;

        return await _db.Friendships
            .AsNoTracking()
            .AnyAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                (
                    (
                        f.RequesterId == userId1 &&
                        f.AddresseeId == userId2
                    )
                    ||
                    (
                        f.RequesterId == userId2 &&
                        f.AddresseeId == userId1
                    )
                ));
    }

    // VISUALIZAR PERFIL

    public async Task<bool> CanViewProfileAsync(
        string targetUserId,
        string viewerUserId)
    {
        if (string.IsNullOrWhiteSpace(targetUserId) ||
            string.IsNullOrWhiteSpace(viewerUserId))
        {
            return false;
        }

        if (targetUserId == viewerUserId)
            return true;

        var settings =
            await GetSettingsAsync(targetUserId);

        return Normalize(
            settings.ProfileVisibility) switch
        {
            "everyone" => true,

            "friends" =>
                await AreFriendsAsync(
                    targetUserId,
                    viewerUserId),

            "nobody" => false,

            _ => true
        };
    }

    // VISUALIZAR ESTADO ONLINE
    public async Task<bool> CanViewOnlineStatusAsync(
        string targetUserId,
        string viewerUserId)
    {
        if (string.IsNullOrWhiteSpace(targetUserId) ||
            string.IsNullOrWhiteSpace(viewerUserId))
        {
            return false;
        }

        if (targetUserId == viewerUserId)
            return true;

        var settings =
            await GetSettingsAsync(targetUserId);

        return Normalize(
            settings.OnlineStatusVisibility) switch
        {
            "everyone" => true,

            "friends" =>
                await AreFriendsAsync(
                    targetUserId,
                    viewerUserId),

            "nobody" => false,

            _ => true
        };
    }

    // VISUALIZAR ÚLTIMO ACESSO
    public async Task<bool> CanViewLastSeenAsync(
        string targetUserId,
        string viewerUserId)
    {
        if (string.IsNullOrWhiteSpace(targetUserId) ||
            string.IsNullOrWhiteSpace(viewerUserId))
        {
            return false;
        }

        if (targetUserId == viewerUserId)
            return true;

        var settings =
            await GetSettingsAsync(targetUserId);

        return Normalize(
            settings.LastSeenVisibility) switch
        {
            "everyone" => true,

            "friends" =>
                await AreFriendsAsync(
                    targetUserId,
                    viewerUserId),

            "nobody" => false,

            _ => true
        };
    }

    // ENVIAR MENSAGEM
    public async Task<bool> CanSendMessageAsync(
        string senderId,
        string receiverId)
    {
        if (string.IsNullOrWhiteSpace(senderId) ||
            string.IsNullOrWhiteSpace(receiverId))
        {
            return false;
        }

        if (senderId == receiverId)
            return false;

        var settings =
            await GetSettingsAsync(receiverId);

        return Normalize(
            settings.MessagePrivacy) switch
        {
            "everyone" => true,

            "friends" =>
                await AreFriendsAsync(
                    senderId,
                    receiverId),

            "nobody" => false,

            _ => true
        };
    }

    // REALIZAR CHAMADA
    public async Task<bool> CanCallAsync(
        string callerId,
        string receiverId)
    {
        if (string.IsNullOrWhiteSpace(callerId) ||
            string.IsNullOrWhiteSpace(receiverId))
        {
            return false;
        }

        if (callerId == receiverId)
            return false;

        var settings =
            await GetSettingsAsync(receiverId);

        return Normalize(
            settings.CallPrivacy) switch
        {
            "everyone" => true,

            "friends" =>
                await AreFriendsAsync(
                    callerId,
                    receiverId),

            "nobody" => false,

            _ => true
        };
    }

    // ENVIAR PEDIDO DE AMIZADE
    public async Task<bool> CanSendFriendRequestAsync(
        string senderId,
        string receiverId)
    {
        if (string.IsNullOrWhiteSpace(senderId) ||
            string.IsNullOrWhiteSpace(receiverId))
        {
            return false;
        }

        if (senderId == receiverId)
            return false;

        var settings =
            await GetSettingsAsync(receiverId);

        return Normalize(
            settings.FriendRequestPrivacy) switch
        {
            "everyone" => true,

            "friends" =>
                await AreFriendsAsync(
                    senderId,
                    receiverId),

            "nobody" => false,

            _ => true
        };
    }

    // UTILIZADOR PODE SER ENCONTRADO NA PESQUISA
    public async Task<bool> IsDiscoverableAsync(
        string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var settings =
            await GetSettingsAsync(userId);

        return settings.Discoverable;
    }

    // NORMALIZAR VALORES
    private static string Normalize(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "everyone";

        return value
            .Trim()
            .ToLowerInvariant();
    }
}
