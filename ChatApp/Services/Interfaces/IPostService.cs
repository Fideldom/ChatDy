using ChatApp.DTOs.Channels;

namespace ChatApp.Services.Interfaces;

public interface IPostService
{
    Task<PostResponseDto> CreatePostAsync(
        string userId,
        CreatePostDto dto);

    Task<IReadOnlyList<PostResponseDto>> GetChannelPostsAsync(
        Guid channelId,
        string userId);

    Task<bool> LikePostAsync(
        Guid postId,
        string userId);

    Task<bool> UnlikePostAsync(
        Guid postId,
        string userId);

    Task<bool> SharePostAsync(
        Guid postId,
        string userId);
}
