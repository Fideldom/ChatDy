using System.ComponentModel.DataAnnotations;

namespace ChatApp.DTOs.Channels;

public class CreateChannelDto
{
    [Required]
    [StringLength(100, MinimumLength = 3,
        ErrorMessage = "O nome do canal deve ter entre 3 e 100 caracteres."
    )]
    public string Name { get; set; } = string.Empty;

    [StringLength(
        500,
        ErrorMessage = "A descrição não pode ultrapassar 500 caracteres."
    )]
    public string? Description { get; set; }

    public bool IsPrivate { get; set; }

    public string? PhotoUrl { get; set; }
}
