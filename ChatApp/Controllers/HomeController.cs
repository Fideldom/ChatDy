using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Controllers;

public class HomeController : Controller
{
    [Authorize] // AllowAnonymous
    public IActionResult Index() => View();

    [Authorize] // AllowAnonymous
    public IActionResult Meeting(string roomCode)
    {
        ViewBag.RoomCode = roomCode;
        return View();
    }

    public IActionResult Channel()
    {
        return View();
    }
}
