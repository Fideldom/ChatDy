using ChatApp.Data;
using ChatApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Hubs;

// Hub responsável por: mensagens em tempo real, indicador "a escrever...", presença online/offline.
// Cada utilizador entra automaticamente num grupo próprio (UserGroup) para receber eventos
// direcionados (mensagens, notificações) independentemente de quantas ligações/tabs tiver abertas.
[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _db;

    public ChatHub(ApplicationDbContext db)
    {
        _db = db;
    }

    public static string UserGroup(string userId) => $"user:{userId}";

    private string UserId => Context.UserIdentifier ?? Context.User!.FindFirst("sub")?.Value ?? string.Empty;

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(UserId));

        var user = await _db.Users.FindAsync(UserId);
        if (user != null)
        {
            user.IsOnline = true;
            await _db.SaveChangesAsync();
            await NotifyFriendsPresenceAsync(UserId, true);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var user = await _db.Users.FindAsync(UserId);
        if (user != null)
        {
            user.IsOnline = false;
            user.LastSeenAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await NotifyFriendsPresenceAsync(UserId, false);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // Indicador de "a escrever..." para o amigo com quem se está a conversar
    public async Task Typing(string receiverId, bool isTyping)
    {
        await Clients.Group(UserGroup(receiverId)).SendAsync("UserTyping", UserId, isTyping);
    }

    // Confirmação de leitura de mensagem (usada pelo MessagesController após marcar como lida)
    public async Task NotifyMessageRead(string senderId, int messageId)
    {
        await Clients.Group(UserGroup(senderId)).SendAsync("MessageRead", messageId);
    }

    private async Task NotifyFriendsPresenceAsync(string userId, bool isOnline)
    {
        var friendIds = await Task.Run(() => _db.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == userId || f.AddresseeId == userId))
            .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
            .ToList());

        foreach (var friendId in friendIds)
        {
            await Clients.Group(UserGroup(friendId)).SendAsync("FriendPresenceChanged", userId, isOnline);
        }
    }
}
