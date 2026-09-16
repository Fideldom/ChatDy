namespace ChatApp.DTOs.Settings;

public class ProfileDto
{
    public string Id { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string? ProfilePhotoUrl { get; set; }

    public DateTime CreatedAt { get; set; }
}

