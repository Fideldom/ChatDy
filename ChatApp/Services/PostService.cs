using ChatApp.Data;
using ChatApp.DTOs.Channels;
using ChatApp.Models;
using ChatApp.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Services;

public class PostService : IPostService
{
    private readonly ApplicationDbContext _context;

    public PostService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PostResponseDto> CreatePostAsync(string userId, CreatePostDto dto)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("Usuário não autenticado.");

        if (dto == null)
            throw new ArgumentNullException(nameof(dto));

        if (dto.ChannelId == Guid.Empty)
            throw new ArgumentException("Canal inválido.");

        if (string.IsNullOrWhiteSpace(dto.Content) &&
            string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            throw new ArgumentException("A publicação precisa ter texto ou imagem.");
        }

        var channel = await _context.Channels
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == dto.ChannelId);

        if (channel == null)
            throw new KeyNotFoundException("Canal não encontrado.");

        // Verificar membro
        var member = channel.Members.FirstOrDefault(m => m.UserId == userId);

        if (member == null)
        {
            throw new UnauthorizedAccessException("Você não é membro deste canal.");
        }

        // SOMENTE OWNER E ADMIN PODEM PUBLICAR
        if (member.Role != ChannelRole.Admin &&
            member.Role != ChannelRole.Owner)
        {
            throw new UnauthorizedAccessException("Apenas administradores e o proprietário podem publicar neste canal.");
        }

        var post = new Post
        {
            Id = Guid.NewGuid(),
            ChannelId = dto.ChannelId,
            AuthorId = userId,
            Content = dto.Content?.Trim() ?? string.Empty,
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _context.Posts.Add(post);

        await _context.SaveChangesAsync();

        return await BuildPostResponseAsync(post.Id, userId);
    }

    public async Task<IReadOnlyList<PostResponseDto>> GetChannelPostsAsync(
        Guid channelId,
        string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("Usuário não autenticado.");

        var channel = await _context.Channels
            .AsNoTracking()
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == channelId);

        if (channel == null)
            throw new KeyNotFoundException("Canal não encontrado.");

        var isMember = channel.Members.Any(m => m.UserId == userId);

        if (!isMember)
            throw new UnauthorizedAccessException("Você não é membro deste canal.");

        var posts = await _context.Posts
            .AsNoTracking()
            .Where(p => p.ChannelId == channelId && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PostResponseDto
            {
                Id = p.Id,
                ChannelId = p.ChannelId,
                AuthorId = p.AuthorId,
                AuthorName = p.Author.FullName,
                AuthorPhotoUrl = p.Author.ProfilePhotoUrl,
                Content = p.Content,

                ImageUrl = p.ImageUrl,
                CreatedAt = p.CreatedAt,
                LikesCount = p.Likes.Count,
                SharesCount = p.Shares.Count,

                IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == userId)
            })
            .ToListAsync();

        return posts;
    }

    public async Task<bool> LikePostAsync(Guid postId, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("Usuário não autenticado.");

        var post = await _context.Posts
            .Include(p => p.Channel)
            .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);

        if (post == null) return false;

        var isMember = post.Channel.Members.Any(m => m.UserId == userId);

        if (!isMember)
            throw new UnauthorizedAccessException("Você não é membro deste canal.");

        var existingLike = await _context.PostLikes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

        if (existingLike != null)
            return true;

        var like = new PostLike
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.PostLikes.Add(like);

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UnlikePostAsync(Guid postId, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("Usuário não autenticado.");

        var like = await _context.PostLikes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

        if (like == null) return false;

        _context.PostLikes.Remove(like);

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> SharePostAsync(Guid postId, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("Usuário não autenticado.");

        var post = await _context.Posts
            .Include(p => p.Channel)
            .ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);

        if (post == null) return false;

        var member = post.Channel.Members.FirstOrDefault(m => m.UserId == userId);

        if (member == null)
        {
            throw new UnauthorizedAccessException("Você não é membro deste canal.");
        }

        if (member.Role != ChannelRole.Admin &&
            member.Role != ChannelRole.Owner)
        {
            throw new UnauthorizedAccessException("Apenas administradores e o proprietário podem publicar neste canal.");
        }

        var share = new PostShare
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.PostShares.Add(share);

        await _context.SaveChangesAsync();

        return true;
    }

    private async Task<PostResponseDto> BuildPostResponseAsync(Guid postId, string userId)
    {
        var post = await _context.Posts
            .AsNoTracking()
            .Where(p => p.Id == postId)
            .Select(p => new PostResponseDto
            {
                Id = p.Id,
                ChannelId = p.ChannelId,
                AuthorId = p.AuthorId,
                AuthorName = p.Author.FullName,
                AuthorPhotoUrl = p.Author.ProfilePhotoUrl,

                Content = p.Content,
                ImageUrl = p.ImageUrl,
                CreatedAt = p.CreatedAt,

                LikesCount = p.Likes.Count,
                SharesCount = p.Shares.Count,

                IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == userId)
            })
            .FirstAsync();

        return post;
    }
}
