using ChatApp.Data;
using ChatApp.DTOs.Channels;
using ChatApp.Models;
using ChatApp.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Services;

public class ChannelInviteService : IChannelInviteService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public ChannelInviteService(
        ApplicationDbContext context,
        INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    // =====================================================
    // ENVIAR CONVITE
    // =====================================================

    public async Task InviteUserAsync(
        string userId,
        Guid channelId,
        InviteUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException(
                "Usuário não autenticado.");
        }

        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        if (string.IsNullOrWhiteSpace(dto.UserId))
        {
            throw new ArgumentException(
                "O usuário convidado é obrigatório.");
        }

        // =================================================
        // CANAL
        // =================================================

        var channel = await _context.Channels
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == channelId);

        if (channel == null)
        {
            throw new KeyNotFoundException(
                "Canal não encontrado.");
        }

        // =================================================
        // QUEM ESTÁ A CONVIDAR
        // =================================================

        var inviter = channel.Members
            .FirstOrDefault(m => m.UserId == userId);

        if (inviter == null)
        {
            throw new UnauthorizedAccessException(
                "Você não é membro deste canal.");
        }

        if (inviter.Role != ChannelRole.Owner &&
            inviter.Role != ChannelRole.Admin)
        {
            throw new UnauthorizedAccessException(
                "Apenas administradores e o proprietário podem convidar membros.");
        }

        // =================================================
        // USUÁRIO CONVIDADO
        // =================================================

        var invitedUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == dto.UserId);

        if (invitedUser == null)
        {
            throw new KeyNotFoundException(
                "Usuário não encontrado.");
        }

        // =================================================
        // NÃO CONVIDAR A SI MESMO
        // =================================================

        if (dto.UserId == userId)
        {
            throw new ArgumentException(
                "Você não pode convidar a si próprio.");
        }

        // =================================================
        // VERIFICAR MEMBRO
        // =================================================

        var alreadyMember = await _context.ChannelMembers
            .AnyAsync(m =>
                m.ChannelId == channelId &&
                m.UserId == dto.UserId);

        if (alreadyMember)
        {
            throw new ArgumentException(
                "Este usuário já é membro do canal.");
        }

        // =================================================
        // VERIFICAR CONVITE PENDENTE
        // =================================================

        var pendingInvite = await _context.ChannelInvites
            .AnyAsync(i =>
                i.ChannelId == channelId &&
                i.InvitedUserId == dto.UserId &&
                i.Status == ChannelInviteStatus.Pending);

        if (pendingInvite)
        {
            throw new ArgumentException(
                "Este usuário já possui um convite pendente.");
        }

        // =================================================
        // CRIAR CONVITE
        // =================================================

        var invite = new ChannelInvite
        {
            Id = Guid.NewGuid(),
            ChannelId = channelId,
            InvitedUserId = dto.UserId,
            InvitedById = userId,
            Status = ChannelInviteStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.ChannelInvites.Add(invite);

        await _context.SaveChangesAsync();

        // =================================================
        // NOTIFICAÇÃO
        // =================================================

        await _notificationService.CreateAsync(
            dto.UserId,
            NotificationType.ChannelInvite,
            $"Convite para o canal {channel.Name}",
            $"{invitedUser.FullName} recebeu um convite para participar do canal.",
            invite.Id.ToString()
        );
    }

    // =====================================================
    // ACEITAR CONVITE
    // =====================================================

    public async Task AcceptInviteAsync(
        string userId,
        Guid inviteId)
    {
        var invite = await _context.ChannelInvites
            .FirstOrDefaultAsync(i =>
                i.Id == inviteId &&
                i.InvitedUserId == userId);

        if (invite == null)
        {
            throw new KeyNotFoundException(
                "Convite não encontrado.");
        }

        if (invite.Status != ChannelInviteStatus.Pending)
        {
            throw new ArgumentException(
                "Este convite já foi respondido.");
        }

        var alreadyMember = await _context.ChannelMembers
            .AnyAsync(m =>
                m.ChannelId == invite.ChannelId &&
                m.UserId == userId);

        if (!alreadyMember)
        {
            var member = new ChannelMember
            {
                Id = Guid.NewGuid(),
                ChannelId = invite.ChannelId,
                UserId = userId,
                Role = ChannelRole.Member,
                JoinedAt = DateTime.UtcNow
            };

            _context.ChannelMembers.Add(member);
        }

        invite.Status = ChannelInviteStatus.Accepted;
        invite.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    // =====================================================
    // RECUSAR CONVITE
    // =====================================================

    public async Task RejectInviteAsync(
        string userId,
        Guid inviteId)
    {
        var invite = await _context.ChannelInvites
            .FirstOrDefaultAsync(i =>
                i.Id == inviteId &&
                i.InvitedUserId == userId);

        if (invite == null)
        {
            throw new KeyNotFoundException(
                "Convite não encontrado.");
        }

        if (invite.Status != ChannelInviteStatus.Pending)
        {
            throw new ArgumentException(
                "Este convite já foi respondido.");
        }

        invite.Status = ChannelInviteStatus.Rejected;
        invite.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    // =====================================================
    // LISTAR MEMBROS DO CANAL
    // =====================================================

    public async Task<IReadOnlyList<ChannelMemberResponseDto>> GetMembersAsync(
        string userId,
        Guid channelId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException(
                "Usuário não autenticado.");
        }

        // =================================================
        // VERIFICAR SE O CANAL EXISTE
        // =================================================

        var channelExists = await _context.Channels
            .AnyAsync(c => c.Id == channelId);

        if (!channelExists)
        {
            throw new KeyNotFoundException(
                "Canal não encontrado.");
        }

        // =================================================
        // VERIFICAR SE O USUÁRIO PODE VER OS MEMBROS
        // =================================================

        var isMember = await _context.ChannelMembers
            .AnyAsync(m =>
                m.ChannelId == channelId &&
                m.UserId == userId);

        if (!isMember)
        {
            throw new UnauthorizedAccessException(
                "Você não é membro deste canal.");
        }

        // =================================================
        // BUSCAR MEMBROS
        // =================================================

        var members = await _context.ChannelMembers
            .Where(m => m.ChannelId == channelId)
            .Include(m => m.User)
            .OrderByDescending(m => m.Role == ChannelRole.Owner)
            .ThenByDescending(m => m.Role == ChannelRole.Admin)
            .ThenBy(m => m.User!.FullName)
            .Select(m => new ChannelMemberResponseDto
            {
                UserId = m.UserId,

                Name = m.User != null
                    ? m.User.FullName
                    : "Usuário",

                PhotoUrl = m.User != null
                    ? m.User.ProfilePhotoUrl
                    : null,

                Role = m.Role.ToString(),

                JoinedAt = m.JoinedAt
            })
            .ToListAsync();

        return members;
    }
}
