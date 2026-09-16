namespace ChatApp.Models;

public class Notification
{
    public int Id { get; set; }

    // Usuário que recebe a notificação
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    // Tipo
    public NotificationType Type { get; set; }

    // Título
    public string Title { get; set; } = string.Empty;

    // Conteúdo
    public string? Content { get; set; }

    // ID relacionado à ação
    //
    // FriendRequest  -> ID da amizade
    // FriendAccepted -> ID da amizade
    // ChannelInvite  -> ID do convite
    //
    public string? RelatedEntityId { get; set; }

    // Estado
    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
