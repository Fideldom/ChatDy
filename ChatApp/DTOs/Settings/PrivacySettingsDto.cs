namespace ChatApp.DTOs.Settings;

public class PrivacySettingsDto
{
    public string ProfileVisibility { get; set; } = "everyone";

    public string OnlineStatusVisibility { get; set; } = "everyone";

    public string LastSeenVisibility { get; set; } = "everyone";

    public string MessagePrivacy { get; set; } = "everyone";

    public string CallPrivacy { get; set; } = "everyone";

    public string FriendRequestPrivacy { get; set; } = "everyone";

    public bool Discoverable { get; set; } = true;
}
