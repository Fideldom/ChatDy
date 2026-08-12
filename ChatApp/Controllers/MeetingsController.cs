using ChatApp.Data;
using ChatApp.DTOs;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

// Reuniões / videoconferências: criação, convite, entrada por código de sala e encerramento.
// A troca de áudio/vídeo em si acontece via WebRTC, sinalizada pelo CallHub.
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MeetingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notifications;

    public MeetingsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager, INotificationService notifications)
    {
        _db = db;
        _userManager = userManager;
        _notifications = notifications;
    }

    private string CurrentUserId => _userManager.GetUserId(User)!;

    [HttpPost]
    public async Task<IActionResult> Create(CreateMeetingDto dto)
    {
        var userId = CurrentUserId;
        var meeting = new Meeting
        {
            Title = dto.Title,
            HostId = userId,
            ScheduledStart = dto.ScheduledStart,
            ScheduledEnd = dto.ScheduledEnd
        };

        meeting.Participants.Add(new MeetingParticipant { UserId = userId, IsHost = true });
        foreach (var invitedId in dto.InviteUserIds.Distinct().Where(id => id != userId))
            meeting.Participants.Add(new MeetingParticipant { UserId = invitedId, IsHost = false });

        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        var host = await _db.Users.FindAsync(userId);
        foreach (var invitedId in dto.InviteUserIds.Distinct().Where(id => id != userId))
        {
            await _notifications.CreateAsync(invitedId, NotificationType.MeetingInvite,
                $"Convite para reunião: {meeting.Title}", $"{host?.FullName} convidou-o para uma reunião.", meeting.RoomCode);
        }

        return Ok(new MeetingViewDto
        {
            Id = meeting.Id,
            Title = meeting.Title,
            RoomCode = meeting.RoomCode,
            HostId = meeting.HostId,
            HostName = host?.FullName ?? string.Empty,
            ScheduledStart = meeting.ScheduledStart,
            ScheduledEnd = meeting.ScheduledEnd,
            Status = meeting.Status.ToString()
        });
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming()
    {
        var userId = CurrentUserId;
        var meetings = await _db.MeetingParticipants
            .Where(p => p.UserId == userId)
            .Select(p => p.Meeting)
            .Where(m => m.Status != MeetingStatus.Ended && m.Status != MeetingStatus.Cancelled)
            .OrderBy(m => m.ScheduledStart)
            .Select(m => new MeetingViewDto
            {
                Id = m.Id,
                Title = m.Title,
                RoomCode = m.RoomCode,
                HostId = m.HostId,
                HostName = m.Host.FullName,
                ScheduledStart = m.ScheduledStart,
                ScheduledEnd = m.ScheduledEnd,
                Status = m.Status.ToString()
            })
            .ToListAsync();

        return Ok(meetings);
    }

    [HttpGet("{roomCode}")]
    public async Task<IActionResult> GetByRoomCode(string roomCode)
    {
        var meeting = await _db.Meetings.Include(m => m.Host)
            .FirstOrDefaultAsync(m => m.RoomCode == roomCode);
        if (meeting == null) return NotFound();

        return Ok(new MeetingViewDto
        {
            Id = meeting.Id,
            Title = meeting.Title,
            RoomCode = meeting.RoomCode,
            HostId = meeting.HostId,
            HostName = meeting.Host.FullName,
            ScheduledStart = meeting.ScheduledStart,
            ScheduledEnd = meeting.ScheduledEnd,
            Status = meeting.Status.ToString()
        });
    }

    [HttpPost("{roomCode}/join")]
    public async Task<IActionResult> Join(string roomCode)
    {
        var userId = CurrentUserId;
        var meeting = await _db.Meetings.Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.RoomCode == roomCode);
        if (meeting == null) return NotFound();

        var participant = meeting.Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant == null)
        {
            participant = new MeetingParticipant { MeetingId = meeting.Id, UserId = userId };
            _db.MeetingParticipants.Add(participant);
        }

        participant.JoinedAt = DateTime.UtcNow;
        if (meeting.Status == MeetingStatus.Scheduled)
        {
            meeting.Status = MeetingStatus.Ongoing;
            meeting.ActualStart = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new { meeting.RoomCode });
    }

    [HttpPost("{roomCode}/leave")]
    public async Task<IActionResult> Leave(string roomCode)
    {
        var userId = CurrentUserId;
        var meeting = await _db.Meetings.Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.RoomCode == roomCode);
        if (meeting == null) return NotFound();

        var participant = meeting.Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant != null) participant.LeftAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{roomCode}/end")]
    public async Task<IActionResult> EndMeeting(string roomCode)
    {
        var userId = CurrentUserId;
        var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.RoomCode == roomCode && m.HostId == userId);
        if (meeting == null) return NotFound();

        meeting.Status = MeetingStatus.Ended;
        meeting.ActualEnd = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }
}
