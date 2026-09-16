namespace ChatApp.DTOs.Settings;

public class UserSettingsDto
{
    public string Language { get; set; } = "pt";

    public string TimeZone { get; set; } = "Africa/Luanda";

    public string TimeFormat { get; set; } = "24h";
}