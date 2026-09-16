using System.ComponentModel.DataAnnotations;

namespace ChatApp.DTOs.Settings;

public class UpdateUserSettingsDto
{
    [Required]
    [MaxLength(10)]
    public string Language { get; set; } = "pt";

    [Required]
    [MaxLength(100)]
    public string TimeZone { get; set; } = "Africa/Luanda";

    [Required]
    [MaxLength(5)]
    public string TimeFormat { get; set; } = "24h";
}
