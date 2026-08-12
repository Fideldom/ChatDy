namespace ChatApp.DTOs;

public class FriendRequestDto
{
    public string AddresseeId { get; set; } = string.Empty;
}

public class FriendViewDto
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePhotoUrl { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public int FriendshipId { get; set; }
    public string Status { get; set; } = string.Empty;
}
