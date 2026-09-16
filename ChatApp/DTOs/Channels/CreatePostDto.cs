namespace ChatApp.DTOs.Channels;

public class CreatePostDto
{
    public Guid ChannelId { get; set; }

    public string? Content { get; set; }

    public string? ImageUrl { get; set; }
}
