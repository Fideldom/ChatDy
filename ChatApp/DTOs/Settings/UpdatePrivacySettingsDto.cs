using System.ComponentModel.DataAnnotations;

namespace ChatApp.DTOs.Settings;

public class UpdatePrivacySettingsDto
{
    [Required]
    [MaxLength(20)]
    public string ProfileVisibility { get; set; } = "everyone";

    [Required]
    [MaxLength(20)]
    public string OnlineStatusVisibility { get; set; } = "everyone";

    [Required]
    [MaxLength(20)]
    public string LastSeenVisibility { get; set; } = "everyone";

    [Required]
    [MaxLength(20)]
    public string MessagePrivacy { get; set; } = "everyone";

    [Required]
    [MaxLength(20)]
    public string CallPrivacy { get; set; } = "everyone";

    [Required]
    [MaxLength(20)]
    public string FriendRequestPrivacy { get; set; } = "everyone";

    public bool Discoverable { get; set; } = true;
}
