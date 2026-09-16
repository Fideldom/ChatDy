namespace ChatApp.Models;

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
