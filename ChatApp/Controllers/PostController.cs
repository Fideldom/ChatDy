using ChatApp.DTOs.Channels;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ChatApp.Controllers;

[Authorize]
[ApiController]
[Route("api/posts")]
public class PostController : ControllerBase
{
    private readonly IPostService _postService;

    public PostController(IPostService postService)
    {
        _postService = postService;
    }

    // =========================================================
    // CRIAR PUBLICAÇÃO
    // POST: api/posts
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreatePost(
        [FromBody] CreatePostDto dto)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new
            {
                message = "Usuário não autenticado."
            });
        }

        try
        {
            var post = await _postService.CreatePostAsync(
                userId,
                dto);

            return Ok(post);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // LISTAR PUBLICAÇÕES DO CANAL
    // GET: api/posts/channel/{channelId}
    // =========================================================

    [HttpGet("channel/{channelId:guid}")]
    public async Task<IActionResult> GetChannelPosts(
        Guid channelId)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var posts = await _postService
                .GetChannelPostsAsync(
                    channelId,
                    userId);

            return Ok(posts);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // CURTIR PUBLICAÇÃO
    // POST: api/posts/{id}/like
    // =========================================================

    [HttpPost("{id:guid}/like")]
    public async Task<IActionResult> LikePost(Guid id)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            await _postService.LikePostAsync(
                id,
                userId);

            return Ok(new
            {
                message = "Publicação curtida."
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // REMOVER CURTIDA
    // DELETE: api/posts/{id}/like
    // =========================================================

    [HttpDelete("{id:guid}/like")]
    public async Task<IActionResult> UnlikePost(Guid id)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            await _postService.UnlikePostAsync(
                id,
                userId);

            return Ok(new
            {
                message = "Curtida removida."
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // PARTILHAR PUBLICAÇÃO
    // POST: api/posts/{id}/share

    [HttpPost("{id:guid}/share")]
    public async Task<IActionResult> SharePost(Guid id)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            await _postService.SharePostAsync(
                id,
                userId);

            return Ok(new
            {
                message = "Publicação partilhada."
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }
}
