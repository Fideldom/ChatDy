using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Hubs;

// Hub de sinalização WebRTC: não transporta áudio/vídeo (isso vai peer-to-peer),
// apenas troca as mensagens de sinalização (offer/answer/ICE) entre os participantes,
// tanto para chamadas 1-para-1 como para salas de reunião (grupo).
[Authorize]
public class CallHub : Hub
{
    private string UserId => Context.UserIdentifier ?? Context.User!.FindFirst("sub")?.Value ?? string.Empty;

    public static string CallGroup(string roomId) => $"call:{roomId}";

    // ---- Chamada direta 1-para-1 ----
    public async Task CallUser(string receiverId, string callId, string type)
    {
        await Clients.Group(ChatHub.UserGroup(receiverId))
            .SendAsync("IncomingCall", callId, UserId, type);
    }

    public async Task AnswerCall(string callerId, string callId, bool accepted)
    {
        await Clients.Group(ChatHub.UserGroup(callerId))
            .SendAsync("CallAnswered", callId, accepted);
    }

    public async Task EndCall(string otherUserId, string callId)
    {
        await Clients.Group(ChatHub.UserGroup(otherUserId)).SendAsync("CallEnded", callId);
    }

    // ---- Salas (reuniões em grupo ou chamada 1-para-1 já aceite) ----
    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, CallGroup(roomId));
        await Clients.OthersInGroup(CallGroup(roomId)).SendAsync("PeerJoined", UserId, Context.ConnectionId);
    }

    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, CallGroup(roomId));
        await Clients.OthersInGroup(CallGroup(roomId)).SendAsync("PeerLeft", UserId, Context.ConnectionId);
    }

    // WebRTC signaling: offer / answer / ICE candidates, roteado ao peer específico via connectionId
    public async Task SendSignal(string targetConnectionId, string signalType, string payload)
    {
        await Clients.Client(targetConnectionId).SendAsync("ReceiveSignal", Context.ConnectionId, UserId, signalType, payload);
    }
}
