namespace ChatApp.Models;

public class CallParticipant
{
    public int Id { get; set; }

    public int CallId { get; set; }
    public Call Call { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
}
