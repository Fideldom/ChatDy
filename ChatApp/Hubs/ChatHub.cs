using System.Collections.Concurrent;
using ChatApp.Data;
using ChatApp.Models;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _db;
    private readonly IPrivacyService _privacy;

    private static readonly ConcurrentDictionary<string, int>
        OnlineUsers = new();

    private static readonly ConcurrentDictionary<string, string>
        ConnectionUsers = new();

    public ChatHub(
        ApplicationDbContext db,
        IPrivacyService privacy)
    {
        _db = db;
        _privacy = privacy;
    }

    public static string UserGroup(string userId)
    {
        return $"user:{userId}";
    }

    private string UserId =>
        Context.UserIdentifier
        ?? Context.User?.FindFirst("sub")?.Value
        ?? Context.User?.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value
        ?? string.Empty;

    // ============================================================
    // CONEXÃO
    // ============================================================

    public override async Task OnConnectedAsync()
    {
        var userId = UserId;

        if (string.IsNullOrWhiteSpace(userId))
        {
            await base.OnConnectedAsync();
            return;
        }

        ConnectionUsers[Context.ConnectionId] = userId;

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            UserGroup(userId));

        var connectionCount =
            OnlineUsers.AddOrUpdate(
                userId,
                1,
                (_, count) => count + 1);

        Console.WriteLine(
            $"[ChatHub] ONLINE: {userId} | " +
            $"Connection: {Context.ConnectionId} | " +
            $"Connections: {connectionCount}");

        // Só alteramos o estado quando a primeira conexão
        // deste utilizador é estabelecida.
        if (connectionCount == 1)
        {
            var user =
                await _db.Users
                    .FirstOrDefaultAsync(
                        u => u.Id == userId);

            if (user != null)
            {
                user.IsOnline = true;
                user.LastSeenAt = null;

                await _db.SaveChangesAsync();

                await NotifyFriendsPresenceAsync(
                    userId,
                    true);
            }
        }

        await base.OnConnectedAsync();
    }

    // ============================================================
    // DESCONEXÃO
    // ============================================================

    public override async Task OnDisconnectedAsync(
        Exception? exception)
    {
        var connectionId =
            Context.ConnectionId;

        if (!ConnectionUsers.TryRemove(
                connectionId,
                out var userId))
        {
            await base.OnDisconnectedAsync(exception);
            return;
        }

        await Groups.RemoveFromGroupAsync(
            connectionId,
            UserGroup(userId));

        var connectionCount =
            OnlineUsers.AddOrUpdate(
                userId,
                0,
                (_, count) =>
                    Math.Max(0, count - 1));

        // Ainda existem outras conexões abertas.
        if (connectionCount > 0)
        {
            Console.WriteLine(
                $"[ChatHub] Conexão encerrada: {userId} | " +
                $"Restantes: {connectionCount}");

            await base.OnDisconnectedAsync(exception);
            return;
        }

        OnlineUsers.TryRemove(
            userId,
            out _);

        var user =
            await _db.Users
                .FirstOrDefaultAsync(
                    u => u.Id == userId);

        if (user != null)
        {
            user.IsOnline = false;
            user.LastSeenAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            await NotifyFriendsPresenceAsync(
                userId,
                false);
        }

        Console.WriteLine(
            $"[ChatHub] OFFLINE: {userId}");

        if (exception != null)
        {
            Console.WriteLine(
                $"[ChatHub] Desconexão com erro: " +
                $"{exception.Message}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    // ============================================================
    // DIGITAÇÃO
    // ============================================================

    public async Task Typing(
        string receiverId,
        bool isTyping)
    {
        if (string.IsNullOrWhiteSpace(receiverId))
            return;

        if (string.IsNullOrWhiteSpace(UserId))
            return;

        var canSend =
            await _privacy.CanSendMessageAsync(
                UserId,
                receiverId);

        if (!canSend)
            return;

        await Clients
            .Group(UserGroup(receiverId))
            .SendAsync(
                "UserTyping",
                UserId,
                isTyping);
    }

    // ============================================================
    // MENSAGEM LIDA
    // ============================================================

    public async Task NotifyMessageRead(
        string senderId,
        int messageId)
    {
        if (string.IsNullOrWhiteSpace(senderId))
            return;

        await Clients
            .Group(UserGroup(senderId))
            .SendAsync(
                "MessageRead",
                messageId);
    }

    // ============================================================
    // PRESENÇA
    // ============================================================

    private async Task NotifyFriendsPresenceAsync(
        string userId,
        bool isOnline)
    {
        var friendIds =
            await _db.Friendships
                .AsNoTracking()
                .Where(f =>
                    f.Status == FriendshipStatus.Accepted &&
                    (
                        f.RequesterId == userId ||
                        f.AddresseeId == userId
                    ))
                .Select(f =>
                    f.RequesterId == userId
                        ? f.AddresseeId
                        : f.RequesterId)
                .ToListAsync();

        foreach (var friendId in friendIds)
        {
            // target = utilizador que mudou de estado
            // viewer = amigo que vai receber o evento
            var canViewOnline =
                await _privacy.CanViewOnlineStatusAsync(
                    userId,
                    friendId);

            // Se não pode ver, não enviamos a presença.
            if (!canViewOnline)
                continue;

            await Clients
                .Group(UserGroup(friendId))
                .SendAsync(
                    "FriendPresenceChanged",
                    userId,
                    isOnline);
        }
    }

    // ============================================================
    // MÉTODO UTILIZADO QUANDO A PRIVACIDADE MUDA
    // ============================================================

    public async Task NotifyCurrentPresenceToFriendsAsync(
        string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return;

        var user =
            await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    u => u.Id == userId);

        if (user == null)
            return;

        await NotifyFriendsPresenceAsync(
            userId,
            user.IsOnline);
    }
}
