namespace ChatApp.Models;

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
