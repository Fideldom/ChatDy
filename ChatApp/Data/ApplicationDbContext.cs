using ChatApp.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Existing entities onModelCreator
    public DbSet<Friendship> Friendships => Set<Friendship>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<Meeting> Meetings => Set<Meeting>();

    public DbSet<MeetingParticipant> MeetingParticipants
        => Set<MeetingParticipant>();

    public DbSet<Call> Calls => Set<Call>();

    public DbSet<CallParticipant> CallParticipants => Set<CallParticipant>();

    public DbSet<UserSettings> UserSettings => Set<UserSettings>();

    // Channel entities
    public DbSet<Channel> Channels => Set<Channel>();

    public DbSet<ChannelMember> ChannelMembers => Set<ChannelMember>();

    public DbSet<ChannelInvite> ChannelInvites => Set<ChannelInvite>();

    public DbSet<Post> Posts => Set<Post>();

    public DbSet<PostLike> PostLikes => Set<PostLike>();

    public DbSet<PostShare> PostShares => Set<PostShare>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // FRIENDSHIP
        builder.Entity<Friendship>(e =>
        {
            e.HasOne(f => f.Requester)
                .WithMany(u => u.FriendshipsRequested)
                .HasForeignKey(f => f.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(f => f.Addressee)
                .WithMany(u => u.FriendshipsReceived)
                .HasForeignKey(f => f.AddresseeId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(f => new
            {
                f.RequesterId,
                f.AddresseeId
            })
            .IsUnique();
        });

        // MESSAGES
        builder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Sender)
                .WithMany(u => u.MessagesSent)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(m => m.Receiver)
                .WithMany(u => u.MessagesReceived)
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(m => new
            {
                m.SenderId,
                m.ReceiverId,
                m.SentAt
            });
        });

        // NOTIFICATIONS
        builder.Entity<Notification>(e =>
        {
            e.HasOne(n => n.User).WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MEETINGS
        builder.Entity<Meeting>(e =>
        {
            e.HasOne(m => m.Host).WithMany()
                .HasForeignKey(m => m.HostId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(m => m.RoomCode)
                .IsUnique();
        });

        builder.Entity<MeetingParticipant>(e =>
        {
            e.HasOne(p => p.Meeting).WithMany(m => m.Participants)
                .HasForeignKey(p => p.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CALLS
        builder.Entity<Call>(e =>
        {
            e.HasOne(c => c.Caller).WithMany()
                .HasForeignKey(c => c.CallerId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Receiver).WithMany()
                .HasForeignKey(c => c.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Meeting).WithMany()
                .HasForeignKey(c => c.MeetingId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<CallParticipant>(e =>
        {
            e.HasOne(p => p.Call).WithMany(c => c.Participants)
                .HasForeignKey(p => p.CallId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CHANNEL
        builder.Entity<Channel>(e =>
        {
            e.HasKey(c => c.Id);

            e.Property(c => c.Name).IsRequired().HasMaxLength(100);

            e.Property(c => c.Description).HasMaxLength(500);

            e.Property(c => c.PhotoUrl).HasMaxLength(2048);

            e.HasOne(c => c.Owner).WithMany(u => u.OwnedChannels)
                .HasForeignKey(c => c.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Pesquisa/listagem de canais do proprietário
            e.HasIndex(c => new
            {
                c.OwnerId,
                c.CreatedAt
            });

            // Descoberta de canais públicos
            e.HasIndex(c => new
            {
                c.IsPrivate,
                c.CreatedAt
            });
        });

        // CHANNEL MEMBER
        builder.Entity<ChannelMember>(e =>
        {
            e.HasKey(m => m.Id);

            e.HasOne(m => m.Channel)
                .WithMany(c => c.Members)
                .HasForeignKey(m => m.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.User)
                .WithMany(u => u.ChannelMemberships)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Um usuário só pode estar uma vez no mesmo canal
            e.HasIndex(m => new
            {
                m.ChannelId,
                m.UserId
            })
            .IsUnique();

            // Buscar todos os canais de um usuário
            e.HasIndex(m => new
            {
                m.UserId,
                m.ChannelId
            });
        });

        // CHANNEL INVITE
        builder.Entity<ChannelInvite>(e =>
        {
            e.HasKey(i => i.Id);

            e.HasOne(i => i.Channel)
                .WithMany(c => c.Invites)
                .HasForeignKey(i => i.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(i => i.InvitedUser)
                .WithMany(u => u.ChannelInvitesReceived)
                .HasForeignKey(i => i.InvitedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(i => i.InvitedBy)
                .WithMany(u => u.ChannelInvitesSent)
                .HasForeignKey(i => i.InvitedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Buscar rapidamente convites recebidos
            e.HasIndex(i => new
            {
                i.InvitedUserId,
                i.Status,
                i.CreatedAt
            });

            // Buscar convites de um canal
            e.HasIndex(i => new
            {
                i.ChannelId,
                i.Status,
                i.CreatedAt
            });
        });

        // POSTS
        builder.Entity<Post>(e =>
        {
            e.HasKey(p => p.Id);

            e.Property(p => p.Content)
                .IsRequired()
                .HasMaxLength(5000);

            e.Property(p => p.ImageUrl)
                .HasMaxLength(2048);

            e.HasOne(p => p.Channel)
                .WithMany(c => c.Posts)
                .HasForeignKey(p => p.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(p => p.Author)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Fundamental para carregar posts de um canal
            e.HasIndex(p => new
            {
                p.ChannelId,
                p.CreatedAt
            });
        });

        // POST LIKE
        builder.Entity<PostLike>(e =>
        {
            e.HasKey(l => l.Id);

            e.HasOne(l => l.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(l => l.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(l => l.User)
                .WithMany(u => u.PostLikes)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Um usuário só pode dar like uma vez
            e.HasIndex(l => new
            {
                l.PostId,
                l.UserId
            })
            .IsUnique();
        });

        // POST SHARE
        builder.Entity<PostShare>(e =>
        {
            e.HasKey(s => s.Id);

            e.HasOne(s => s.Post)
                .WithMany(p => p.Shares)
                .HasForeignKey(s => s.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.User)
                .WithMany(u => u.PostShares)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(s => new
            {
                s.PostId,
                s.CreatedAt
            });
        });

        // USER SETTINGS
        builder.Entity<UserSettings>(e =>
        {
            e.HasKey(s => s.Id);

            e.Property(s => s.Language)
                .IsRequired()
                .HasMaxLength(10);

            e.Property(s => s.TimeZone)
                .IsRequired()
                .HasMaxLength(100);

            e.Property(s => s.TimeFormat)
                .IsRequired()
                .HasMaxLength(5);

            e.HasOne(s => s.User)
                .WithOne(u => u.Settings)
                .HasForeignKey<UserSettings>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(s => s.UserId)
                .IsUnique();
        });
    }
}
