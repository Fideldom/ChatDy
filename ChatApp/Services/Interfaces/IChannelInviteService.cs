using ChatApp.DTOs.Channels;

namespace ChatApp.Services.Interfaces;

public interface IChannelInviteService
{
    // =====================================================
    // CONVIDAR USUÁRIO
    // =====================================================

    Task InviteUserAsync(
        string userId,
        Guid channelId,
        InviteUserDto dto);

    // =====================================================
    // ACEITAR CONVITE
    // =====================================================

    Task AcceptInviteAsync(
        string userId,
        Guid inviteId);

    // =====================================================
    // RECUSAR CONVITE
    // =====================================================

    Task RejectInviteAsync(
        string userId,
        Guid inviteId);

    // =====================================================
    // LISTAR MEMBROS
    // =====================================================

    Task<IReadOnlyList<ChannelMemberResponseDto>> GetMembersAsync(
        string userId,
        Guid channelId);
}
