using ChatApp.DTOs.Channels;

namespace ChatApp.Services.Interfaces;

public interface IChannelService
{
    Task<ChannelResponseDto> CreateChannelAsync(string userId, CreateChannelDto dto);

    Task<IReadOnlyList<ChannelResponseDto>> GetMyChannelsAsync(string userId);

    Task<IReadOnlyList<ChannelResponseDto>> GetDiscoverChannelsAsync(string userId);

    Task<ChannelResponseDto?> GetChannelAsync(Guid channelId, string userId);

    Task<IReadOnlyList<ChannelMemberResponseDto>> GetChannelMembersAsync(Guid channelId, string userId);
}
