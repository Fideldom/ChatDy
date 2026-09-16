using ChatApp.DTOs.Channels;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ChatApp.Data;

namespace ChatApp.Controllers;

[Authorize]
[ApiController]
[Route("api/channels")]
public class ChannelController : ControllerBase
{
    private readonly IChannelService _channelService;
    private readonly IPostService _postService;
    private readonly IChannelInviteService _channelInviteService;
    private readonly ApplicationDbContext _context;

    public ChannelController(
        IChannelService channelService,
        IPostService postService,
        IChannelInviteService channelInviteService,
        ApplicationDbContext context)
    {
        _channelService = channelService;
        _postService = postService;
        _channelInviteService = channelInviteService;
        _context = context;
    }


    // CRIAR CANAL --> POST: api/channels PhotoUrl
    [HttpPost]
    public async Task<IActionResult> CreateChannel(
        [FromBody] CreateChannelDto dto)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new {
                message = "Usuário não autenticado."
            });
        }

        try
        {
            var channel = await _channelService.CreateChannelAsync(userId, dto);

            return CreatedAtAction(nameof(GetChannel), new { id = channel.Id }, channel);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
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


    // MEUS CANAIS --> GET: api/channels/my
    [HttpGet("my")]
    public async Task<IActionResult> GetMyChannels()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var channels = await _channelService.GetMyChannelsAsync(userId);

        return Ok(channels);
    }


    // DESCOBRIR CANAIS --> GET: api/channels/discover
    [HttpGet("discover")]
    public async Task<IActionResult> DiscoverChannels()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var channels = await _channelService.GetDiscoverChannelsAsync(userId);

        return Ok(channels);
    }

    // PESQUISAR UTILIZADORES
    // GET: api/channels/users/search?q=nome
    // Este endpoint usa diretamente ApplicationDbContext.
    [HttpGet("users/search")]
    public async Task<IActionResult> SearchUsers(
        [FromQuery] string? q)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized(new {
                message = "Usuário não autenticado."
            });
        }

        q = q?.Trim();

        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(Array.Empty<object>());
        }

        if (q.Length < 2)
        {
            return Ok(Array.Empty<object>());
        }

        var users = await _context.Users.AsNoTracking()

            // Não mostrar o próprio utilizador
            .Where(u => u.Id != currentUserId)

            // Procurar pelo nome, username ou email
            .Where(u => u.FullName.Contains(q) || (u.UserName != null && u.UserName.Contains(q)) 
                    || (u.Email != null && u.Email.Contains(q)))
            .OrderBy(u => u.FullName)

            .Take(20)

            .Select(u => new
            {
                id = u.Id,
                userName = u.UserName ?? "",
                fullName = u.FullName ?? "",
                profilePhotoUrl = u.ProfilePhotoUrl
            })

            .ToListAsync();

        return Ok(users);
    }

    // ABRIR CANAL --> GET: api/channels/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetChannel(Guid id) {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var channel = await _channelService.GetChannelAsync(id, userId);

        if (channel == null)
        {
            return NotFound(new
            {
                message = "Canal não encontrado."
            });
        }

        return Ok(channel);
    }


    // LISTAR MEMBROS --> GET: api/channels/{channelId}/members
    [HttpGet("{channelId:guid}/members")]
    public async Task<IActionResult> GetMembers(
        Guid channelId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var members = await _channelService.GetChannelMembersAsync(channelId, userId);

            return Ok(members);
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
            return StatusCode(403, new {
                message = ex.Message
            });
        }
    }

    // CRIAR PUBLICAÇÃO --> POST: api/channels/{channelId}/posts
    [HttpPost("{channelId:guid}/posts")]
    public async Task<IActionResult> CreatePost(
        Guid channelId,
        [FromBody] CreatePostDto dto)
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        dto.ChannelId = channelId;

        try
        {
            var post = await _postService.CreatePostAsync(userId, dto);

            return Ok(post);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new {
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
            return StatusCode(403, new
            {
                message = ex.Message
            });
        }
    }


    // LISTAR PUBLICAÇÕES --> GET: api/channels/{channelId}/posts
    [HttpGet("{channelId:guid}/posts")]
    public async Task<IActionResult> GetPosts(
        Guid channelId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var posts = await _postService.GetChannelPostsAsync(channelId, userId);

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
            return StatusCode(403, new
            {
                message = ex.Message
            });
        }
    }


    // CURTIR
    // POST: api/channels/{channelId}/posts/{postId}/like
    [HttpPost("{channelId:guid}/posts/{postId:guid}/like")]
    public async Task<IActionResult> LikePost(
        Guid channelId,
        Guid postId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _postService.LikePostAsync(postId, userId);

            return Ok(new
            {
                success = result
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new
            {
                message = ex.Message
            });
        }
    }

    // DESCURTIR
    // DELETE: api/channels/{channelId}/posts/{postId}/like
    [HttpDelete("{channelId:guid}/posts/{postId:guid}/like")]
    public async Task<IActionResult> UnlikePost(Guid channelId, Guid postId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _postService.UnlikePostAsync(postId, userId);

            return Ok(new {
                success = result
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new {
                message = ex.Message
            });
        }
    }


    // PARTILHAR
    // POST:/ api/channels/{channelId}/posts/{postId}/share
    [HttpPost("{channelId:guid}/posts/{postId:guid}/share")]
    public async Task<IActionResult> SharePost(Guid channelId, Guid postId,
        [FromBody] string? comment)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _postService.SharePostAsync(postId, userId);

            return Ok(new
            {
                success = result
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new {
                message = ex.Message
            });
        }
    }


    // ENVIAR CONVITE
    // POST: api/channels/{channelId}/invites
    [HttpPost("{channelId:guid}/invites")]
    public async Task<IActionResult> InviteUser(Guid channelId,
        [FromBody] InviteUserDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new
            {
                message = "Usuário não autenticado."
            });
        }

        try
        {
            await _channelInviteService.InviteUserAsync(userId, channelId, dto);

            return Ok(new {
                message = "Convite enviado com sucesso."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new {
                message = ex.Message
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new {
                message = ex.Message
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new {
                message = ex.Message
            });
        }
    }
}
