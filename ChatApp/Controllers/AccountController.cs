using ChatApp.DTOs;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Controllers;

// Criação de conta com e-mail, nome, palavra-passe e foto de perfil, mais login/logout.
public class AccountController : Controller
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IFileStorageService _fileStorage;

    public AccountController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IFileStorageService fileStorage)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public IActionResult Register() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (!ModelState.IsValid) return View(dto);

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName
        };

        if (dto.Photo != null)
        {
            var (url, _, _) = await _fileStorage.SaveFileAsync(dto.Photo, "photos");
            user.ProfilePhotoUrl = url;
        }

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(string.Empty, error.Description);
            return View(dto);
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public IActionResult Login() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (!ModelState.IsValid) return View(dto);

        var result = await _signInManager.PasswordSignInAsync(dto.Email, dto.Password, dto.RememberMe, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            ModelState.AddModelError(string.Empty, "E-mail ou palavra-passe inválidos.");
            return View(dto);
        }

        return RedirectToAction("Index", "Home");
    }

    [Authorize]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return RedirectToAction("Login");
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> UpdatePhoto(IFormFile photo)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var (url, _, _) = await _fileStorage.SaveFileAsync(photo, "photos");
        if (!string.IsNullOrEmpty(user.ProfilePhotoUrl))
            _fileStorage.DeleteFile(user.ProfilePhotoUrl);

        user.ProfilePhotoUrl = url;
        await _userManager.UpdateAsync(user);

        return Ok(new { url });
    }
}
