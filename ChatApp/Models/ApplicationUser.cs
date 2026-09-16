using Microsoft.AspNetCore.Identity;

namespace ChatApp.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;

    public string? ProfilePhotoUrl { get; set; }

    public bool IsOnline { get; set; }

    public DateTime? LastSeenAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public UserSettings? Settings { get; set; }

    // Friends
    public ICollection<Friendship> FriendshipsRequested { get; set; } = new List<Friendship>();

    public ICollection<Friendship> FriendshipsReceived { get; set; } = new List<Friendship>();

    // Messages
    public ICollection<Message> MessagesSent { get; set; } = new List<Message>();

    public ICollection<Message> MessagesReceived { get; set; } = new List<Message>();

    // Notifications
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    // Channels

    // Canais onde o usuário é proprietário. </summary>
    public ICollection<Channel> OwnedChannels { get; set; } = new List<Channel>();

    // Canais onde o usuário é membro.
    public ICollection<ChannelMember> ChannelMemberships { get; set; } = new List<ChannelMember>();

    // Convites recebidos para canais.
    public ICollection<ChannelInvite> ChannelInvitesReceived { get; set; } = new List<ChannelInvite>();

    // Convites enviados pelo usuário.
    public ICollection<ChannelInvite> ChannelInvitesSent { get; set; }  = new List<ChannelInvite>();

    // Posts
    public ICollection<Post> Posts { get; set; } = new List<Post>();

    public ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();

    public ICollection<PostShare> PostShares { get; set; } = new List<PostShare>();
}
