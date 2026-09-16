namespace ChatApp.Models;

public class Channel
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? PhotoUrl { get; set; }

    public bool IsPrivate { get; set; }

    // Identity usa string como chave
    public string OwnerId { get; set; } = string.Empty;

    public ApplicationUser Owner { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ChannelMember> Members { get; set; }
        = new List<ChannelMember>();

    public ICollection<ChannelInvite> Invites { get; set; }
        = new List<ChannelInvite>();

    public ICollection<Post> Posts { get; set; }
        = new List<Post>();
}
