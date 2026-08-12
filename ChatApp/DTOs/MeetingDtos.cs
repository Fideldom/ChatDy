namespace ChatApp.DTOs;

public class CreateMeetingDto
{
    public string Title { get; set; } = string.Empty;
    public DateTime? ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public List<string> InviteUserIds { get; set; } = new();
}

public class MeetingViewDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RoomCode { get; set; } = string.Empty;
    public string HostId { get; set; } = string.Empty;
    public string HostName { get; set; } = string.Empty;
    public DateTime? ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public string Status { get; set; } = string.Empty;
}
