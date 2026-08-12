namespace ChatApp.Models;

// Reunião / videoconferência com várias pessoas
public class Meeting
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RoomCode { get; set; } = Guid.NewGuid().ToString("N")[..10];

    public string HostId { get; set; } = string.Empty;
    public ApplicationUser Host { get; set; } = null!;

    public DateTime? ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }

    public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();
}
