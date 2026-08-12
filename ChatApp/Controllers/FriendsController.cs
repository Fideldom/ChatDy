using ChatApp.Data;
using ChatApp.DTOs;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

// Lista de amigos: pedidos, aceitação, remoção e pesquisa de utilizadores.
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FriendsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notifications;

    public FriendsController(ApplicationDbContext db, UserManager<ApplicationUser> userManager, INotificationService notifications)
    {
        _db = db;
        _userManager = userManager;
        _notifications = notifications;
    }

    private string CurrentUserId => _userManager.GetUserId(User)!;

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var userId = CurrentUserId;

        var friendships = await _db.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted && (f.RequesterId == userId || f.AddresseeId == userId))
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .ToListAsync();

        var result = friendships.Select(f =>
        {
            var friend = f.RequesterId == userId ? f.Addressee : f.Requester;
            return new FriendViewDto
            {
                FriendshipId = f.Id,
                UserId = friend.Id,
                FullName = friend.FullName,
                ProfilePhotoUrl = friend.ProfilePhotoUrl,
                IsOnline = friend.IsOnline,
                LastSeenAt = friend.LastSeenAt,
                Status = f.Status.ToString()
            };
        });

        return Ok(result);
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingRequests()
    {
        var userId = CurrentUserId;
        var requests = await _db.Friendships
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .Select(f => new FriendViewDto
            {
                FriendshipId = f.Id,
                UserId = f.Requester.Id,
                FullName = f.Requester.FullName,
                ProfilePhotoUrl = f.Requester.ProfilePhotoUrl,
                IsOnline = f.Requester.IsOnline,
                Status = f.Status.ToString()
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<object>());

        var userId = CurrentUserId;
        var users = await _db.Users
            .Where(u => u.Id != userId && (u.FullName.Contains(q) || u.Email!.Contains(q)))
            .Take(20)
            .Select(u => new { u.Id, u.FullName, u.Email, u.ProfilePhotoUrl })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest(FriendRequestDto dto)
    {
        var userId = CurrentUserId;
        if (dto.AddresseeId == userId) return BadRequest("Não é possível adicionar-se a si próprio.");

        var exists = await _db.Friendships.AnyAsync(f =>
            (f.RequesterId == userId && f.AddresseeId == dto.AddresseeId) ||
            (f.RequesterId == dto.AddresseeId && f.AddresseeId == userId));

        if (exists) return BadRequest("Já existe um pedido ou amizade entre estes utilizadores.");

        var friendship = new Friendship { RequesterId = userId, AddresseeId = dto.AddresseeId };
        _db.Friendships.Add(friendship);
        await _db.SaveChangesAsync();

        var requester = await _db.Users.FindAsync(userId);
        await _notifications.CreateAsync(dto.AddresseeId, NotificationType.FriendRequest,
            "Novo pedido de amizade", $"{requester?.FullName} enviou-lhe um pedido de amizade.", userId);

        return Ok(new { friendship.Id });
    }

    [HttpPost("{friendshipId:int}/accept")]
    public async Task<IActionResult> Accept(int friendshipId)
    {
        var userId = CurrentUserId;
        var friendship = await _db.Friendships.FirstOrDefaultAsync(f => f.Id == friendshipId && f.AddresseeId == userId);
        if (friendship == null) return NotFound();

        friendship.Status = FriendshipStatus.Accepted;
        friendship.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var addressee = await _db.Users.FindAsync(userId);
        await _notifications.CreateAsync(friendship.RequesterId, NotificationType.FriendAccepted,
            "Pedido de amizade aceite", $"{addressee?.FullName} aceitou o seu pedido de amizade.", userId);

        return Ok();
    }

    [HttpPost("{friendshipId:int}/reject")]
    public async Task<IActionResult> Reject(int friendshipId)
    {
        var userId = CurrentUserId;
        var friendship = await _db.Friendships.FirstOrDefaultAsync(f => f.Id == friendshipId && f.AddresseeId == userId);
        if (friendship == null) return NotFound();

        friendship.Status = FriendshipStatus.Rejected;
        friendship.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{friendshipId:int}")]
    public async Task<IActionResult> Remove(int friendshipId)
    {
        var userId = CurrentUserId;
        var friendship = await _db.Friendships.FirstOrDefaultAsync(f =>
            f.Id == friendshipId && (f.RequesterId == userId || f.AddresseeId == userId));
        if (friendship == null) return NotFound();

        _db.Friendships.Remove(friendship);
        await _db.SaveChangesAsync();
        return Ok();
    }
}
