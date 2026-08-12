namespace ChatApp.Models;

// Chamada normal (1-para-1) de áudio ou vídeo. Pode também estar ligada a uma Meeting (grupo).
public class Call
{
    public int Id { get; set; }

    public string CallerId { get; set; } = string.Empty;
    public ApplicationUser Caller { get; set; } = null!;

    public string? ReceiverId { get; set; }
    public ApplicationUser? Receiver { get; set; }

    public int? MeetingId { get; set; }
    public Meeting? Meeting { get; set; }

    public CallType Type { get; set; } = CallType.Video;
    public CallStatus Status { get; set; } = CallStatus.Ringing;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AnsweredAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public ICollection<CallParticipant> Participants { get; set; } = new List<CallParticipant>();
}
