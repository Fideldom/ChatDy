using ChatApp.Models;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Hubs;

[Authorize]
public class CallHub : Hub
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPrivacyService _privacy;

    public CallHub(
        UserManager<ApplicationUser> userManager,
        IPrivacyService privacy)
    {
        _userManager = userManager;
        _privacy = privacy;
    }

    // ID DO UTILIZADOR AUTENTICADO
    private string UserId =>
        Context.UserIdentifier
        ?? Context.User?.FindFirst("sub")?.Value
        ?? Context.User?.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value
        ?? string.Empty;

    // GRUPO DO UTILIZADOR
    public static string UserGroup(
        string userId)
    {
        return $"call-user:{userId}";
    }

    // GRUPO DA CHAMADA
    public static string CallGroup(
        string roomId)
    {
        return $"call:{roomId}";
    }

    // CONECTAR
    public override async Task OnConnectedAsync()
    {
        if (!string.IsNullOrWhiteSpace(
            UserId))
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                UserGroup(UserId));

            Console.WriteLine(
                $"[CallHub] Conectado: " +
                $"{UserId} | " +
                $"{Context.ConnectionId}"
            );
        }

        await base.OnConnectedAsync();
    }

    // DESCONECTAR
    public override async Task OnDisconnectedAsync(
        Exception? exception)
    {
        if (!string.IsNullOrWhiteSpace(
            UserId))
        {
            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                UserGroup(UserId));

            Console.WriteLine(
                $"[CallHub] Desconectado: {UserId}"
            );
        }

        await base.OnDisconnectedAsync(
            exception);
    }

    // INICIAR CHAMADA
    public async Task CallUser(
        string receiverId,
        string callId,
        string type)
    {
        if (string.IsNullOrWhiteSpace(
            receiverId))
        {
            throw new HubException(
                "Utilizador destinatário inválido.");
        }

        if (string.IsNullOrWhiteSpace(
            callId))
        {
            throw new HubException(
                "ID da chamada inválido.");
        }

        if (type != "audio" &&
            type != "video")
        {
            throw new HubException(
                "Tipo de chamada inválido.");
        }

        if (string.IsNullOrWhiteSpace(
            UserId))
        {
            throw new HubException(
                "Utilizador não autenticado.");
        }

        // VERIFICAR PRIVACIDADE DE CHAMADAS
        var canCall =
            await _privacy.CanCallAsync(
                UserId,
                receiverId);

        if (!canCall)
        {
            throw new HubException(
                "Este utilizador não permite receber chamadas de si.");
        }

        var caller =
            await _userManager.FindByIdAsync(
                UserId);

        if (caller == null)
        {
            throw new HubException(
                "Utilizador da chamada não encontrado.");
        }

        var callerName =
            string.IsNullOrWhiteSpace(
                caller.FullName)
                ? "Utilizador"
                : caller.FullName;

        var callerPhoto =
            string.IsNullOrWhiteSpace(
                caller.ProfilePhotoUrl)
                ? "/images/default-avatar.png"
                : caller.ProfilePhotoUrl;

        Console.WriteLine(
            $"[CallHub] {callerName} -> " +
            $"{receiverId} | {type}"
        );

        await Clients
            .Group(UserGroup(receiverId))
            .SendAsync(
                "IncomingCall",
                callId,
                UserId,
                callerName,
                callerPhoto,
                type);
    }

    // RESPONDER À CHAMADA
    public async Task AnswerCall(
        string callerId,
        string callId,
        bool accepted)
    {
        if (string.IsNullOrWhiteSpace(
            callerId))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(
            callId))
        {
            return;
        }

        await Clients
            .Group(UserGroup(callerId))
            .SendAsync(
                "CallAnswered",
                callId,
                accepted);
    }

    // TERMINAR CHAMADA
    public async Task EndCall(
        string otherUserId,
        string callId)
    {
        if (string.IsNullOrWhiteSpace(
            otherUserId))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(
            callId))
        {
            return;
        }

        await Clients
            .Group(UserGroup(otherUserId))
            .SendAsync(
                "CallEnded",
                callId);
    }

    // ENTRAR NA SALA WEBRTC
    public async Task JoinRoom(
        string roomId)
    {
        if (string.IsNullOrWhiteSpace(
            roomId))
        {
            throw new HubException(
                "Sala inválida.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            CallGroup(roomId));

        Console.WriteLine(
            $"[CallHub] {UserId} " +
            $"entrou na sala {roomId}"
        );

        await Clients
            .OthersInGroup(
                CallGroup(roomId))
            .SendAsync(
                "PeerJoined",
                UserId,
                Context.ConnectionId);
    }

    // SAIR DA SALA WEBRTC
    public async Task LeaveRoom(
        string roomId)
    {
        if (string.IsNullOrWhiteSpace(
            roomId))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            CallGroup(roomId));

        await Clients
            .OthersInGroup(
                CallGroup(roomId))
            .SendAsync(
                "PeerLeft",
                UserId,
                Context.ConnectionId);
    }

    // SIGNAL WEBRTC
    public async Task SendSignal(
        string targetConnectionId,
        string signalType,
        string payload)
    {
        if (string.IsNullOrWhiteSpace(
            targetConnectionId))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(
            signalType))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(
            payload))
        {
            return;
        }

        await Clients
            .Client(targetConnectionId)
            .SendAsync(
                "ReceiveSignal",
                Context.ConnectionId,
                UserId,
                signalType,
                payload);
    }
}
