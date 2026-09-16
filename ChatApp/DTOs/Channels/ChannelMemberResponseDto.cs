namespace ChatApp.DTOs.Channels;

public class ChannelMemberResponseDto
{
    public string UserId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }

    public string Role { get; set; } = "Member";

    public DateTime JoinedAt { get; set; }
}
