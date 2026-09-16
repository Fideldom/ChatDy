namespace ChatApp.Models;

public enum FriendshipStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2,
    Blocked = 3
}

public enum MessageType
{
    Text = 0,
    Audio = 1,
    Image = 2,
    File = 3
}

public enum NotificationType
{
    // Notificações persistentes
    FriendRequest = 0,
    FriendAccepted = 1,
    ChannelInvite = 2,

    // Eventos temporários / atividade
    NewMessage = 3,
    MeetingInvite = 4,
    IncomingCall = 5,
    MissedCall = 6
}

public enum CallType
{
    Audio = 0,
    Video = 1
}

public enum CallStatus
{
    Ringing = 0,
    Accepted = 1,
    Rejected = 2,
    Missed = 3,
    Ended = 4
}

public enum MeetingStatus
{
    Scheduled = 0,
    Ongoing = 1,
    Ended = 2,
    Cancelled = 3
}

public enum ChannelRole
{
    Member = 0,
    Admin = 1,
    Owner = 2
}

public enum ChannelInviteStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2,
    Cancelled = 3
}
