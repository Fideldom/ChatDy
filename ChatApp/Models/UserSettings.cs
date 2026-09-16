using System.ComponentModel.DataAnnotations;

namespace ChatApp.Models;

public class UserSettings
{
    public Guid Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    // ============================================================
    // CONFIGURAÇÕES GERAIS
    // ============================================================

    [Required]
    [MaxLength(10)]
    public string Language { get; set; } = "pt";

    [Required]
    [MaxLength(100)]
    public string TimeZone { get; set; } = "Africa/Luanda";

    [Required]
    [MaxLength(5)]
    public string TimeFormat { get; set; } = "24h";


    // ============================================================
    // CONFIGURAÇÕES DE PRIVACIDADE
    // ============================================================

    /// <summary>
    /// Define quem pode visualizar o perfil do utilizador.
    /// Valores: everyone, friends, nobody
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ProfileVisibility { get; set; } = "everyone";


    /// <summary>
    /// Define quem pode visualizar o estado online.
    /// Valores: everyone, friends, nobody
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string OnlineStatusVisibility { get; set; } = "everyone";


    /// <summary>
    /// Define quem pode visualizar o último acesso.
    /// Valores: everyone, friends, nobody
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string LastSeenVisibility { get; set; } = "everyone";


    /// <summary>
    /// Define quem pode enviar mensagens ao utilizador.
    /// Valores: everyone, friends, nobody
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string MessagePrivacy { get; set; } = "everyone";


    /// <summary>
    /// Define quem pode iniciar chamadas com o utilizador.
    /// Valores: everyone, friends, nobody
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string CallPrivacy { get; set; } = "everyone";


    /// <summary>
    /// Define quem pode enviar solicitações de amizade.
    /// Valores: everyone, nobody
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string FriendRequestPrivacy { get; set; } = "everyone";


    /// <summary>
    /// Define se o perfil pode aparecer nos resultados de pesquisa.
    /// </summary>
    public bool Discoverable { get; set; } = true;


    // ============================================================
    // AUDITORIA
    // ============================================================

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
