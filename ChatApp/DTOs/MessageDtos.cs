using ChatApp.Models;

namespace ChatApp.DTOs;

public class SendMessageDto
{
    public string ReceiverId { get; set; } = string.Empty;
    public string? Content { get; set; }
    public MessageType Type { get; set; } = MessageType.Text;
}

public class MessageViewDto
{
    public int Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
    public MessageType Type { get; set; }
    public string? Content { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
}
