using ChatApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Controllers;

[Authorize]
[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ProfileController(
        UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    // =====================================================
    // PERFIL DO UTILIZADOR AUTENTICADO
    // =====================================================

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            id = user.Id,
            fullName = user.FullName,
            profilePhotoUrl = user.ProfilePhotoUrl
        });
    }
}
