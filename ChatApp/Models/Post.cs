namespace ChatApp.Models;

public class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChannelId { get; set; }

    public Channel Channel { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;

    public ApplicationUser Author { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; }

    public ICollection<PostLike> Likes { get; set; }
        = new List<PostLike>();

    public ICollection<PostShare> Shares { get; set; }
        = new List<PostShare>();
}

public class PostLike
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PostId { get; set; }

    public Post Post { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PostShare
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PostId { get; set; }

    public Post Post { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
