namespace ChatApp.DTOs.Channels;

using ChatApp.Models;

public class ChannelResponseDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? PhotoUrl { get; set; }

    public bool IsPrivate { get; set; }

    public string OwnerId { get; set; } = string.Empty;

    public string OwnerName { get; set; } = string.Empty;

    public string? OwnerPhotoUrl { get; set; }

    public int MemberCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool IsMember { get; set; }

    public bool IsOwner { get; set; }

    public ChannelRole Role { get; set; }
}
