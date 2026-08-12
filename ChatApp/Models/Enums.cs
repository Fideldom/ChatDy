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
    FriendRequest = 0,
    FriendAccepted = 1,
    NewMessage = 2,
    MeetingInvite = 3,
    IncomingCall = 4,
    MissedCall = 5
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
