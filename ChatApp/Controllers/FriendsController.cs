using ChatApp.Data;
using ChatApp.DTOs;
using ChatApp.Models;
using ChatApp.Services;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FriendsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notifications;
    private readonly IPrivacyService _privacy;

    public FriendsController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        INotificationService notifications,
        IPrivacyService privacy)
    {
        _db = db;
        _userManager = userManager;
        _notifications = notifications;
        _privacy = privacy;
    }

    private string CurrentUserId =>
        _userManager.GetUserId(User)!;

    // ============================================================
    // LISTAR AMIGOS
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var userId = CurrentUserId;

        var friendships = await _db.Friendships
            .AsNoTracking()
            .Where(f =>
                f.Status == FriendshipStatus.Accepted &&
                (
                    f.RequesterId == userId ||
                    f.AddresseeId == userId
                ))
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .ToListAsync();

        var result = new List<FriendViewDto>();

        foreach (var friendship in friendships)
        {
            var friend =
                friendship.RequesterId == userId
                    ? friendship.Addressee
                    : friendship.Requester;

            if (friend == null)
                continue;

            // target = amigo
            // viewer = utilizador autenticado
            var canViewProfile =
                await _privacy.CanViewProfileAsync(
                    friend.Id,
                    userId);

            if (!canViewProfile)
                continue;

            var canViewOnline =
                await _privacy.CanViewOnlineStatusAsync(
                    friend.Id,
                    userId);

            var canViewLastSeen =
                await _privacy.CanViewLastSeenAsync(
                    friend.Id,
                    userId);

            result.Add(new FriendViewDto
            {
                FriendshipId = friendship.Id,

                UserId = friend.Id,

                FullName =
                    friend.FullName,

                ProfilePhotoUrl =
                    friend.ProfilePhotoUrl,

                IsOnline =
                    canViewOnline &&
                    friend.IsOnline,

                LastSeenAt =
                    canViewLastSeen
                        ? friend.LastSeenAt
                        : null,

                Status =
                    friendship.Status.ToString()
            });
        }

        return Ok(result);
    }

    // ============================================================
    // PEDIDOS DE AMIZADE
    // ============================================================

    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingRequests()
    {
        var userId = CurrentUserId;

        var requests = await _db.Friendships
            .AsNoTracking()
            .Where(f =>
                f.AddresseeId == userId &&
                f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .ToListAsync();

        var result = new List<FriendViewDto>();

        foreach (var friendship in requests)
        {
            var requester = friendship.Requester;

            if (requester == null)
                continue;

            var canViewProfile =
                await _privacy.CanViewProfileAsync(
                    requester.Id,
                    userId);

            var canViewOnline =
                await _privacy.CanViewOnlineStatusAsync(
                    requester.Id,
                    userId);

            var canViewLastSeen =
                await _privacy.CanViewLastSeenAsync(
                    requester.Id,
                    userId);

            result.Add(new FriendViewDto
            {
                FriendshipId = friendship.Id,

                UserId = requester.Id,

                FullName =
                    canViewProfile
                        ? requester.FullName
                        : "Utilizador",

                ProfilePhotoUrl =
                    canViewProfile
                        ? requester.ProfilePhotoUrl
                        : null,

                IsOnline =
                    canViewOnline &&
                    requester.IsOnline,

                LastSeenAt =
                    canViewLastSeen
                        ? requester.LastSeenAt
                        : null,

                Status =
                    friendship.Status.ToString()
            });
        }

        return Ok(result);
    }

    // ============================================================
    // PESQUISAR UTILIZADORES
    // ============================================================

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<object>());

        var userId = CurrentUserId;

        q = q.Trim();

        var users = await _db.Users
            .AsNoTracking()
            .Where(u =>
                u.Id != userId &&
                (
                    u.FullName.Contains(q) ||
                    (u.Email != null &&
                     u.Email.Contains(q))
                ))
            .Take(20)
            .ToListAsync();

        var result = new List<object>();

        foreach (var user in users)
        {
            var canViewProfile =
                await _privacy.CanViewProfileAsync(
                    user.Id,
                    userId);

            var canViewOnline =
                await _privacy.CanViewOnlineStatusAsync(
                    user.Id,
                    userId);

            var canViewLastSeen =
                await _privacy.CanViewLastSeenAsync(
                    user.Id,
                    userId);

            if (!canViewProfile)
                continue;

            result.Add(new
            {
                id = user.Id,

                fullName = user.FullName,

                email = user.Email,

                profilePhotoUrl =
                    user.ProfilePhotoUrl,

                isOnline =
                    canViewOnline &&
                    user.IsOnline,

                lastSeenAt =
                    canViewLastSeen
                        ? user.LastSeenAt
                        : null
            });
        }

        return Ok(result);
    }

    // ============================================================
    // ENVIAR PEDIDO
    // ============================================================

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest(
        FriendRequestDto dto)
    {
        var userId = CurrentUserId;

        if (string.IsNullOrWhiteSpace(dto.AddresseeId))
            return BadRequest(
                "Utilizador destinatário inválido.");

        if (dto.AddresseeId == userId)
            return BadRequest(
                "Não é possível adicionar-se a si próprio.");

        var targetUser =
            await _userManager.FindByIdAsync(
                dto.AddresseeId);

        if (targetUser == null)
            return NotFound(
                "Utilizador não encontrado.");

        var canSend =
            await _privacy.CanSendFriendRequestAsync(
                userId,
                dto.AddresseeId);

        if (!canSend)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                "Este utilizador não permite pedidos de amizade.");
        }

        var exists = await _db.Friendships
            .AnyAsync(f =>
                (f.RequesterId == userId &&
                 f.AddresseeId == dto.AddresseeId)
                ||
                (f.RequesterId == dto.AddresseeId &&
                 f.AddresseeId == userId));

        if (exists)
        {
            return BadRequest(
                "Já existe um pedido ou amizade entre estes utilizadores.");
        }

        var friendship = new Friendship
        {
            RequesterId = userId,
            AddresseeId = dto.AddresseeId,
            Status = FriendshipStatus.Pending
        };

        _db.Friendships.Add(friendship);

        await _db.SaveChangesAsync();

        var requester =
            await _db.Users.FindAsync(userId);

        await _notifications.CreateAsync(
            dto.AddresseeId,
            NotificationType.FriendRequest,
            "Novo pedido de amizade",
            $"{requester?.FullName ?? "Um utilizador"} enviou-lhe um pedido de amizade.",
            userId);

        return Ok(new
        {
            friendship.Id
        });
    }

    // ============================================================
    // ACEITAR
    // ============================================================

    [HttpPost("{friendshipId:int}/accept")]
    public async Task<IActionResult> Accept(
        int friendshipId)
    {
        var userId = CurrentUserId;

        var friendship =
            await _db.Friendships
                .FirstOrDefaultAsync(f =>
                    f.Id == friendshipId &&
                    f.AddresseeId == userId &&
                    f.Status == FriendshipStatus.Pending);

        if (friendship == null)
            return NotFound();

        friendship.Status =
            FriendshipStatus.Accepted;

        friendship.RespondedAt =
            DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var addressee =
            await _db.Users.FindAsync(userId);

        await _notifications.CreateAsync(
            friendship.RequesterId,
            NotificationType.FriendAccepted,
            "Pedido de amizade aceite",
            $"{addressee?.FullName ?? "Utilizador"} aceitou o seu pedido de amizade.",
            userId);

        return Ok(new
        {
            success = true
        });
    }

    // ============================================================
    // REJEITAR
    // ============================================================

    [HttpPost("{friendshipId:int}/reject")]
    public async Task<IActionResult> Reject(
        int friendshipId)
    {
        var userId = CurrentUserId;

        var friendship =
            await _db.Friendships
                .FirstOrDefaultAsync(f =>
                    f.Id == friendshipId &&
                    f.AddresseeId == userId &&
                    f.Status == FriendshipStatus.Pending);

        if (friendship == null)
            return NotFound();

        friendship.Status =
            FriendshipStatus.Rejected;

        friendship.RespondedAt =
            DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true
        });
    }

    // ============================================================
    // REMOVER AMIZADE
    // ============================================================

    [HttpDelete("{friendshipId:int}")]
    public async Task<IActionResult> Remove(
        int friendshipId)
    {
        var userId = CurrentUserId;

        var friendship =
            await _db.Friendships
                .FirstOrDefaultAsync(f =>
                    f.Id == friendshipId &&
                    (
                        f.RequesterId == userId ||
                        f.AddresseeId == userId
                    ));

        if (friendship == null)
            return NotFound();

        _db.Friendships.Remove(friendship);

        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true
        });
    }
}
