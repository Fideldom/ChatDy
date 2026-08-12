namespace ChatApp.Models;

public class Channel
{
	public Guid Id { get; set; } = Guid.NewGuid();

	public string Name { get; set; } = string.Empty;

	public string? Description { get; set; }

	public string? PhotoUrl { get; set; }

	public bool IsPrivate { get; set; }

	public Guid OwnerId { get; set; }

	public ApplicationUser Owner { get; set; } = null!;

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public ICollection<ChannelMember> Members { get; set; }
		= new List<ChannelMember>();

	public ICollection<ChannelInvite> Invites { get; set; }
		= new List<ChannelInvite>();

	public ICollection<Post> Posts { get; set; }
		= new List<Post>();
}

public class ChannelMember
{
	public Guid Id { get; set; } = Guid.NewGuid();

	public Guid ChannelId { get; set; }

	public Channel Channel { get; set; } = null!;

	public string UserId { get; set; } = string.Empty;

	public ApplicationUser User { get; set; } = null!;

	public ChannelRole Role { get; set; } = ChannelRole.Member;

	public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class ChannelInvite
{
	public Guid Id { get; set; } = Guid.NewGuid();

	public Guid ChannelId { get; set; }

	public Channel Channel { get; set; } = null!;

	public string InvitedUserId { get; set; } = string.Empty;

	public ApplicationUser InvitedUser { get; set; } = null!;

	public string InvitedById { get; set; } = string.Empty;

	public ApplicationUser InvitedBy { get; set; } = null!;

	public ChannelInviteStatus Status { get; set; }
		= ChannelInviteStatus.Pending;

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

	public DateTime? RespondedAt { get; set; }
}