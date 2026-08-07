using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicPassportAndVerifiedStories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublicPassportEnabled",
                table: "UserProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "PublicPassportShareId",
                table: "UserProfiles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SourceCompletionId",
                table: "SocialPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FeaturedPassportAchievements",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementId = table.Column<Guid>(type: "uuid", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeaturedPassportAchievements", x => new { x.UserId, x.AchievementId });
                    table.CheckConstraint("CK_FeaturedPassportAchievements_SortOrder", "\"SortOrder\" BETWEEN 0 AND 4");
                    table.ForeignKey(
                        name: "FK_FeaturedPassportAchievements_Achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "Achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FeaturedPassportAchievements_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UX_UserProfiles_PublicPassportShareId",
                table: "UserProfiles",
                column: "PublicPassportShareId",
                unique: true,
                filter: "\"PublicPassportShareId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_SocialPosts_SourceCompletionId",
                table: "SocialPosts",
                column: "SourceCompletionId",
                unique: true,
                filter: "\"SourceCompletionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_FeaturedPassportAchievements_AchievementId",
                table: "FeaturedPassportAchievements",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "UX_FeaturedPassportAchievements_User_SortOrder",
                table: "FeaturedPassportAchievements",
                columns: new[] { "UserId", "SortOrder" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPosts_QuestCompletions_SourceCompletionId",
                table: "SocialPosts",
                column: "SourceCompletionId",
                principalTable: "QuestCompletions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SocialPosts_QuestCompletions_SourceCompletionId",
                table: "SocialPosts");

            migrationBuilder.DropTable(
                name: "FeaturedPassportAchievements");

            migrationBuilder.DropIndex(
                name: "UX_UserProfiles_PublicPassportShareId",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "UX_SocialPosts_SourceCompletionId",
                table: "SocialPosts");

            migrationBuilder.DropColumn(
                name: "IsPublicPassportEnabled",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "PublicPassportShareId",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "SourceCompletionId",
                table: "SocialPosts");
        }
    }
}
