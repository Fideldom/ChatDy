using ChatApp.Data;
using ChatApp.DTOs.Channels;
using ChatApp.Models;
using ChatApp.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Services;

public class ChannelService : IChannelService
{
    private readonly ApplicationDbContext _context;

    public ChannelService(ApplicationDbContext context)
    {
        _context = context;
    }

    // CRIAR CANAL
    public async Task<ChannelResponseDto> CreateChannelAsync(string userId, CreateChannelDto dto)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuário não autenticado.");
        }

        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("O nome do canal é obrigatório.");
        }

        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new Exception("Usuário não encontrado.");
        }

        var channel = new Channel
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),

            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),

            PhotoUrl = string.IsNullOrWhiteSpace(dto.PhotoUrl) ? null : dto.PhotoUrl.Trim(),

            IsPrivate = dto.IsPrivate,

            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };

        // O criador do canal é automaticamente OWNER
        var ownerMember = new ChannelMember
        {
            Id = Guid.NewGuid(),
            ChannelId = channel.Id,
            UserId = userId,
            Role = ChannelRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        _context.Channels.Add(channel);
        _context.ChannelMembers.Add(ownerMember);

        await _context.SaveChangesAsync();

        return new ChannelResponseDto
        {
            Id = channel.Id,
            Name = channel.Name,
            Description = channel.Description,
            PhotoUrl = channel.PhotoUrl,
            IsPrivate = channel.IsPrivate,

            OwnerId = user.Id,
            OwnerName = user.FullName,
            OwnerPhotoUrl = user.ProfilePhotoUrl,

            MemberCount = 1,
            CreatedAt = channel.CreatedAt,

            IsMember = true,
            IsOwner = true,

            Role = ChannelRole.Owner
        };
    }

    // MEUS CANAIS
    public async Task<IReadOnlyList<ChannelResponseDto>>
        GetMyChannelsAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuário não autenticado.");
        }

        return await _context.ChannelMembers
            .AsNoTracking()

            .Where(m => m.UserId == userId)

            .OrderByDescending(m => m.JoinedAt)

            .Select(m => new ChannelResponseDto
            {
                Id = m.Channel.Id,
                Name = m.Channel.Name,
                Description = m.Channel.Description,
                PhotoUrl = m.Channel.PhotoUrl,
                IsPrivate = m.Channel.IsPrivate,

                OwnerId = m.Channel.OwnerId,
                OwnerName = m.Channel.Owner.FullName,
                OwnerPhotoUrl = m.Channel.Owner.ProfilePhotoUrl,

                MemberCount = m.Channel.Members.Count,
                CreatedAt = m.Channel.CreatedAt,

                IsMember = true,
                IsOwner = m.Channel.OwnerId == userId,

                Role = m.Role
            })

            .ToListAsync();
    }

    // DESCOBRIR CANAIS
    public async Task<IReadOnlyList<ChannelResponseDto>>
        GetDiscoverChannelsAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuário não autenticado.");
        }

        return await _context.Channels.AsNoTracking()

            .Where(c => !c.IsPrivate && !c.Members.Any(m => m.UserId == userId))

            .OrderByDescending(c => c.CreatedAt)

            .Select(c => new ChannelResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                PhotoUrl = c.PhotoUrl,
                IsPrivate = c.IsPrivate,

                OwnerId = c.OwnerId,
                OwnerName = c.Owner.FullName,
                OwnerPhotoUrl = c.Owner.ProfilePhotoUrl,

                MemberCount = c.Members.Count,
                CreatedAt = c.CreatedAt,

                IsMember = false,
                IsOwner = false,

                // Como o usuário ainda não é membro, não possui uma Role no canal.
                Role = ChannelRole.Member

            })

            .ToListAsync();
    }

    // ABRIR CANAL
    public async Task<ChannelResponseDto?> GetChannelAsync(Guid channelId, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuário não autenticado.");
        }

        var channel = await _context.Channels

            .AsNoTracking()
            .Where(c => c.Id == channelId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.PhotoUrl,
                c.IsPrivate,
                c.OwnerId,
                c.CreatedAt,

                OwnerName = c.Owner.FullName,
                OwnerPhotoUrl = c.Owner.ProfilePhotoUrl,

                MemberCount = c.Members.Count,
                IsMember = c.Members.Any(m => m.UserId == userId),

                // Papel do usuário dentro do canal
                Role = c.Members
                    .Where(m => m.UserId == userId)
                    .Select(m => (ChannelRole?)m.Role)
                    .FirstOrDefault()
            })

            .FirstOrDefaultAsync();

        if (channel == null)
        {
            return null;
        }

        // Canal privado só pode ser acessado por membros
        if (channel.IsPrivate && !channel.IsMember)
        {
            return null;
        }

        return new ChannelResponseDto
        {
            Id = channel.Id,
            Name = channel.Name,
            Description = channel.Description,
            PhotoUrl = channel.PhotoUrl,
            IsPrivate = channel.IsPrivate,
            OwnerId = channel.OwnerId,
            OwnerName = channel.OwnerName,
            OwnerPhotoUrl = channel.OwnerPhotoUrl,
            MemberCount = channel.MemberCount,
            CreatedAt = channel.CreatedAt,
            IsMember = channel.IsMember,
            IsOwner = channel.OwnerId == userId,

            // Se for membro, usa a Role. Se não for membro, retorna Member como padrão.
            Role = channel.Role ?? ChannelRole.Member
        };
    }

    // LISTAR MEMBROS
    public async Task<IReadOnlyList<ChannelMemberResponseDto>>
        GetChannelMembersAsync(
            Guid channelId,
            string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuário não autenticado.");
        }

        // VERIFICAR SE O CANAL EXISTE
        var channelExists = await _context.Channels
            .AnyAsync(c => c.Id == channelId);

        if (!channelExists)
        {
            throw new KeyNotFoundException("Canal não encontrado.");
        }

        // VERIFICAR SE O USUÁRIO É MEMBRO
        var isMember = await _context.ChannelMembers.AnyAsync(m =>
                m.ChannelId == channelId && m.UserId == userId);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("Você não é membro deste canal.");
        }

        // BUSCAR MEMBROS
        return await _context.ChannelMembers.AsNoTracking()
            .Where(m => m.ChannelId == channelId)
            .OrderBy(m => m.Role)
            .ThenBy(m => m.JoinedAt)
            .Select(m => new ChannelMemberResponseDto
            {
                UserId = m.UserId,

                // Nome que será mostrado na interface
                Name = m.User.FullName ?? m.User.UserName ?? "Usuário",

                // Foto do perfil
                PhotoUrl = m.User.ProfilePhotoUrl,

                // Converter enum para texto
                Role = m.Role.ToString(),

                JoinedAt = m.JoinedAt
            })
            .ToListAsync();
    }
}