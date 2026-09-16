using ChatApp.Data;
using ChatApp.DTOs.Settings;
using ChatApp.Hubs;
using ChatApp.Models;
using ChatApp.Services;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

[Authorize]
[Route("Settings")]
public class SettingsController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IFileStorageService _fileStorage;
    private readonly IPrivacyService _privacy;
    private readonly IHubContext<ChatHub> _chatHub;

    public SettingsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IFileStorageService fileStorage,
        IPrivacyService privacy,
        IHubContext<ChatHub> chatHub)
    {
        _context = context;
        _userManager = userManager;
        _fileStorage = fileStorage;
        _privacy = privacy;
        _chatHub = chatHub;
    }

    // ============================================================
    // PÁGINA DE CONFIGURAÇÕES
    // ============================================================

    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        var settings =
            await GetOrCreateSettingsAsync(user.Id);

        ViewData["Title"] = "Configurações";

        return View(settings);
    }

    // ============================================================
    // CONFIGURAÇÕES GERAIS
    // ============================================================

    // GET: /Settings/Get
    [HttpGet("Get")]
    public async Task<IActionResult> Get()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        var settings =
            await GetOrCreateSettingsAsync(user.Id);

        return Ok(new UserSettingsDto
        {
            Language = NormalizeLanguage(settings.Language),
            TimeZone = NormalizeTimeZone(settings.TimeZone),
            TimeFormat = NormalizeTimeFormat(settings.TimeFormat)
        });
    }

    // PUT: /Settings/Update
    [HttpPut("Update")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Update(
        [FromBody] UpdateUserSettingsDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message = "Dados de configuração inválidos."
            });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        var language =
            NormalizeLanguage(dto.Language);

        var timeZone =
            NormalizeTimeZone(dto.TimeZone);

        var timeFormat =
            NormalizeTimeFormat(dto.TimeFormat);

        // --------------------------------------------------------
        // Validação do idioma
        // --------------------------------------------------------

        var allowedLanguages =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "pt",
                "en",
                "fr",
                "es"
            };

        if (!allowedLanguages.Contains(language))
        {
            return BadRequest(new
            {
                success = false,
                message = "Idioma selecionado inválido."
            });
        }

        // --------------------------------------------------------
        // Validação do formato da hora
        // --------------------------------------------------------

        if (timeFormat != "12h" &&
            timeFormat != "24h")
        {
            return BadRequest(new
            {
                success = false,
                message = "Formato de hora inválido."
            });
        }

        // --------------------------------------------------------
        // Validação do fuso horário
        // --------------------------------------------------------

        if (string.IsNullOrWhiteSpace(timeZone))
        {
            return BadRequest(new
            {
                success = false,
                message = "Fuso horário inválido."
            });
        }

        if (!IsSupportedTimeZone(timeZone))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "O fuso horário selecionado não é suportado."
            });
        }

        // --------------------------------------------------------
        // Guardar
        // --------------------------------------------------------

        var settings =
            await GetOrCreateSettingsAsync(user.Id);

        settings.Language = language;
        settings.TimeZone = timeZone;
        settings.TimeFormat = timeFormat;
        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,

            message =
                "Configurações atualizadas com sucesso.",

            settings = new UserSettingsDto
            {
                Language = settings.Language,
                TimeZone = settings.TimeZone,
                TimeFormat = settings.TimeFormat
            }
        });
    }

    // ============================================================
    // PERFIL
    // ============================================================

    // GET: /Settings/Profile
    [HttpGet("Profile")]
    public async Task<IActionResult> Profile()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        return Ok(new ProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            UserName = user.UserName ?? string.Empty,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            ProfilePhotoUrl = user.ProfilePhotoUrl,
            CreatedAt = user.CreatedAt
        });
    }

    // PUT: /Settings/Profile
    [HttpPut("Profile")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message = "Verifica os dados introduzidos.",
                errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors
                            .Select(e => e.ErrorMessage)
                            .ToArray())
            });
        }

        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        var fullName =
            dto.FullName.Trim();

        if (fullName.Length < 2)
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "O nome completo deve ter pelo menos 2 caracteres."
            });
        }

        user.FullName = fullName;

        var phoneNumber =
            string.IsNullOrWhiteSpace(dto.PhoneNumber)
                ? null
                : dto.PhoneNumber.Trim();

        var currentPhoneNumber =
            await _userManager.GetPhoneNumberAsync(user);

        if (currentPhoneNumber != phoneNumber)
        {
            var phoneResult =
                await _userManager.SetPhoneNumberAsync(
                    user,
                    phoneNumber);

            if (!phoneResult.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    message =
                        "Não foi possível atualizar o número de telefone.",
                    errors = phoneResult.Errors
                        .Select(e => e.Description)
                        .ToArray()
                });
            }
        }

        var updateResult =
            await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Não foi possível atualizar o perfil.",
                errors = updateResult.Errors
                    .Select(e => e.Description)
                    .ToArray()
            });
        }

        return Ok(new
        {
            success = true,
            message =
                "Perfil atualizado com sucesso.",

            profile = new ProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                UserName = user.UserName ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                ProfilePhotoUrl = user.ProfilePhotoUrl,
                CreatedAt = user.CreatedAt
            }
        });
    }

    // ============================================================
    // FOTO DE PERFIL
    // ============================================================

    // POST: /Settings/Profile/Photo
    [HttpPost("Profile/Photo")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateProfilePhoto(
        IFormFile? photo)
    {
        if (photo == null || photo.Length == 0)
        {
            return BadRequest(new
            {
                success = false,
                message = "Seleciona uma imagem."
            });
        }

        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        var allowedExtensions =
            new[]
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            };

        var extension =
            Path.GetExtension(photo.FileName)
                .ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Formato de imagem não suportado. Usa JPG, PNG ou WebP."
            });
        }

        const long maxFileSize =
            5 * 1024 * 1024;

        if (photo.Length > maxFileSize)
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "A imagem não pode ultrapassar 5 MB."
            });
        }

        var (url, _, _) =
            await _fileStorage.SaveFileAsync(
                photo,
                "photos");

        var oldPhotoUrl =
            user.ProfilePhotoUrl;

        user.ProfilePhotoUrl = url;

        var result =
            await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            _fileStorage.DeleteFile(url);

            return BadRequest(new
            {
                success = false,
                message =
                    "Não foi possível atualizar a foto de perfil.",
                errors = result.Errors
                    .Select(e => e.Description)
                    .ToArray()
            });
        }

        if (!string.IsNullOrWhiteSpace(oldPhotoUrl))
        {
            _fileStorage.DeleteFile(oldPhotoUrl);
        }

        return Ok(new
        {
            success = true,
            message =
                "Foto de perfil atualizada com sucesso.",
            url
        });
    }

    // ============================================================
    // PRIVACIDADE
    // ============================================================

    // GET: /Settings/Privacy
    [HttpGet("Privacy")]
    public async Task<IActionResult> GetPrivacy()
    {
        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        var settings =
            await GetOrCreateSettingsAsync(user.Id);

        return Ok(new
        {
            profileVisibility =
                settings.ProfileVisibility,

            onlineStatusVisibility =
                settings.OnlineStatusVisibility,

            lastSeenVisibility =
                settings.LastSeenVisibility,

            messagePrivacy =
                settings.MessagePrivacy,

            callPrivacy =
                settings.CallPrivacy,

            friendRequestPrivacy =
                settings.FriendRequestPrivacy,

            discoverable =
                settings.Discoverable
        });
    }

    // PUT: /Settings/Privacy
    [HttpPut("Privacy")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdatePrivacy(
        [FromBody] UpdatePrivacySettingsDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Os dados enviados são inválidos."
            });
        }

        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        var allowedVisibility =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "everyone",
                "friends",
                "nobody"
            };

        var allowedFriendRequest =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "everyone",
                "nobody"
            };

        var profileVisibility =
            NormalizePrivacyValue(
                dto.ProfileVisibility);

        var onlineStatusVisibility =
            NormalizePrivacyValue(
                dto.OnlineStatusVisibility);

        var lastSeenVisibility =
            NormalizePrivacyValue(
                dto.LastSeenVisibility);

        var messagePrivacy =
            NormalizePrivacyValue(
                dto.MessagePrivacy);

        var callPrivacy =
            NormalizePrivacyValue(
                dto.CallPrivacy);

        var friendRequestPrivacy =
            NormalizePrivacyValue(
                dto.FriendRequestPrivacy);

        if (!allowedVisibility.Contains(
                profileVisibility))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Valor inválido para visibilidade do perfil."
            });
        }

        if (!allowedVisibility.Contains(
                onlineStatusVisibility))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Valor inválido para visibilidade do estado online."
            });
        }

        if (!allowedVisibility.Contains(
                lastSeenVisibility))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Valor inválido para visibilidade do último acesso."
            });
        }

        if (!allowedVisibility.Contains(
                messagePrivacy))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Valor inválido para privacidade das mensagens."
            });
        }

        if (!allowedVisibility.Contains(
                callPrivacy))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Valor inválido para privacidade das chamadas."
            });
        }

        if (!allowedFriendRequest.Contains(
                friendRequestPrivacy))
        {
            return BadRequest(new
            {
                success = false,
                message =
                    "Valor inválido para pedidos de amizade."
            });
        }

        var settings =
            await GetOrCreateSettingsAsync(user.Id);

        var previousOnlineVisibility =
            settings.OnlineStatusVisibility;

        settings.ProfileVisibility =
            profileVisibility;

        settings.OnlineStatusVisibility =
            onlineStatusVisibility;

        settings.LastSeenVisibility =
            lastSeenVisibility;

        settings.MessagePrivacy =
            messagePrivacy;

        settings.CallPrivacy =
            callPrivacy;

        settings.FriendRequestPrivacy =
            friendRequestPrivacy;

        settings.Discoverable =
            dto.Discoverable;

        settings.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // --------------------------------------------------------
        // Se a visibilidade do estado online mudou,
        // atualizamos imediatamente os amigos.
        // --------------------------------------------------------

        if (!string.Equals(
                previousOnlineVisibility,
                onlineStatusVisibility,
                StringComparison.OrdinalIgnoreCase))
        {
            await NotifyPresenceVisibilityChangedAsync(
                user.Id);
        }

        return Ok(new
        {
            success = true,
            message =
                "Configurações de privacidade atualizadas com sucesso."
        });
    }

    // ============================================================
    // PRESENÇA APÓS ALTERAÇÃO DA PRIVACIDADE
    // ============================================================

    private async Task NotifyPresenceVisibilityChangedAsync(
        string userId)
    {
        var user =
            await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    u => u.Id == userId);

        if (user == null)
            return;

        var friendIds =
            await _context.Friendships
                .AsNoTracking()
                .Where(f =>
                    f.Status == FriendshipStatus.Accepted &&
                    (
                        f.RequesterId == userId ||
                        f.AddresseeId == userId
                    ))
                .Select(f =>
                    f.RequesterId == userId
                        ? f.AddresseeId
                        : f.RequesterId)
                .ToListAsync();

        foreach (var friendId in friendIds)
        {
            var canView =
                await _privacy.CanViewOnlineStatusAsync(
                    userId,
                    friendId);

            await _chatHub
                .Clients
                .Group(ChatHub.UserGroup(friendId))
                .SendAsync(
                    "FriendPresenceChanged",
                    userId,
                    canView && user.IsOnline);
        }
    }

    // ============================================================
    // SETTINGS
    // ============================================================

    private async Task<UserSettings>
        GetOrCreateSettingsAsync(
            string userId)
    {
        var settings =
            await _context.UserSettings
                .FirstOrDefaultAsync(
                    s => s.UserId == userId);

        if (settings != null)
            return settings;

        var now =
            DateTime.UtcNow;

        settings = new UserSettings
        {
            Id = Guid.NewGuid(),

            UserId = userId,

            Language = "pt",

            TimeZone =
                "Africa/Luanda",

            TimeFormat =
                "24h",

            ProfileVisibility =
                "everyone",

            OnlineStatusVisibility =
                "everyone",

            LastSeenVisibility =
                "everyone",

            MessagePrivacy =
                "everyone",

            CallPrivacy =
                "everyone",

            FriendRequestPrivacy =
                "everyone",

            Discoverable =
                true,

            CreatedAt = now,

            UpdatedAt = now
        };

        _context.UserSettings.Add(
            settings);

        await _context.SaveChangesAsync();

        return settings;
    }

    // ============================================================
    // NORMALIZAÇÃO
    // ============================================================

    private static string NormalizeLanguage(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "pt";

        return value
            .Trim()
            .ToLowerInvariant();
    }

    private static string NormalizeTimeZone(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "Africa/Luanda";

        return value.Trim();
    }

    private static string NormalizeTimeFormat(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "24h";

        return value
            .Trim()
            .ToLowerInvariant();
    }

    private static string NormalizePrivacyValue(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "everyone";

        return value
            .Trim()
            .ToLowerInvariant();
    }

    // ============================================================
    // FUSOS SUPORTADOS PELO CHATAPP
    // ============================================================

    private static bool IsSupportedTimeZone(
        string timeZone)
    {
        return timeZone switch
        {
            "Africa/Luanda" => true,
            "Africa/Johannesburg" => true,
            "Europe/London" => true,
            "Europe/Lisbon" => true,
            "America/Sao_Paulo" => true,
            "America/New_York" => true,

            _ => false
        };
    }
}
