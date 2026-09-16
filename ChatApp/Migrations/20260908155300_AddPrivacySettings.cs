using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivacySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CallPrivacy",
                table: "UserSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "Discoverable",
                table: "UserSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FriendRequestPrivacy",
                table: "UserSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastSeenVisibility",
                table: "UserSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MessagePrivacy",
                table: "UserSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OnlineStatusVisibility",
                table: "UserSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProfileVisibility",
                table: "UserSettings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CallPrivacy",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "Discoverable",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "FriendRequestPrivacy",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "LastSeenVisibility",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "MessagePrivacy",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "OnlineStatusVisibility",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "ProfileVisibility",
                table: "UserSettings");
        }
    }
}
