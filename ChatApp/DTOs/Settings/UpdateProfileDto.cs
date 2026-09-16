using System.ComponentModel.DataAnnotations;

namespace ChatApp.DTOs.Settings;

public class UpdateProfileDto
{
    [Required]
    [StringLength(
        100,
        MinimumLength = 2,
        ErrorMessage = "O nome completo deve ter entre 2 e 100 caracteres."
    )]
    public string FullName { get; set; } = string.Empty;

    [StringLength(
        30,
        ErrorMessage = "O número de telefone não pode ultrapassar 30 caracteres."
    )]
    public string? PhoneNumber { get; set; }
}
