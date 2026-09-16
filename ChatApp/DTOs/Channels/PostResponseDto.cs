namespace ChatApp.DTOs.Channels;

public class PostResponseDto
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }

    public string AuthorId { get; set; } = string.Empty;

    public string AuthorName { get; set; } = string.Empty;

    public string? AuthorPhotoUrl { get; set; }

    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public int LikesCount { get; set; }

    public int SharesCount { get; set; }

    public bool IsLikedByCurrentUser { get; set; }
}
