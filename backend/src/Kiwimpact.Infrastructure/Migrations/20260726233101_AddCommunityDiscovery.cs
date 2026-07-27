using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityDiscovery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_UserAchievements_UserId_AchievementId",
                table: "UserAchievements");

            migrationBuilder.AddColumn<Guid>(
                name: "SourceCommunityChallengeId",
                table: "UserAchievements",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Quests",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Quests",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CommunityChallenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LocalAreaRegionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodStart = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    TargetType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TargetValue = table.Column<int>(type: "integer", nullable: false),
                    RewardAchievementId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityChallenges", x => x.Id);
                    table.CheckConstraint("CK_CommunityChallenges_Period", "\"PeriodEnd\" > \"PeriodStart\"");
                    table.CheckConstraint("CK_CommunityChallenges_TargetValue_Positive", "\"TargetValue\" > 0");
                    table.ForeignKey(
                        name: "FK_CommunityChallenges_Achievements_RewardAchievementId",
                        column: x => x.RewardAchievementId,
                        principalTable: "Achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityChallenges_Regions_LocalAreaRegionId",
                        column: x => x.LocalAreaRegionId,
                        principalTable: "Regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserAchievements_SourceCommunityChallengeId",
                table: "UserAchievements",
                column: "SourceCommunityChallengeId");

            migrationBuilder.CreateIndex(
                name: "UX_UserAchievements_CommunityChallenge",
                table: "UserAchievements",
                columns: new[] { "UserId", "AchievementId", "SourceCommunityChallengeId" },
                unique: true,
                filter: "\"SourceCommunityChallengeId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_UserAchievements_Milestone",
                table: "UserAchievements",
                columns: new[] { "UserId", "AchievementId" },
                unique: true,
                filter: "\"SourceCommunityChallengeId\" IS NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Quests_Coordinates_Paired",
                table: "Quests",
                sql: "(\"Latitude\" IS NULL AND \"Longitude\" IS NULL) OR (\"Latitude\" IS NOT NULL AND \"Longitude\" IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Quests_Latitude_Range",
                table: "Quests",
                sql: "\"Latitude\" IS NULL OR \"Latitude\" BETWEEN -90 AND 90");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Quests_Longitude_Range",
                table: "Quests",
                sql: "\"Longitude\" IS NULL OR \"Longitude\" BETWEEN -180 AND 180");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityChallenges_LocalArea_PeriodStart",
                table: "CommunityChallenges",
                columns: new[] { "LocalAreaRegionId", "PeriodStart" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityChallenges_RewardAchievementId",
                table: "CommunityChallenges",
                column: "RewardAchievementId");

            migrationBuilder.CreateIndex(
                name: "UX_CommunityChallenges_ActiveLocalArea",
                table: "CommunityChallenges",
                column: "LocalAreaRegionId",
                unique: true,
                filter: "\"Status\" = 'Active'");

            migrationBuilder.AddForeignKey(
                name: "FK_UserAchievements_CommunityChallenges_SourceCommunityChallen~",
                table: "UserAchievements",
                column: "SourceCommunityChallengeId",
                principalTable: "CommunityChallenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserAchievements_CommunityChallenges_SourceCommunityChallen~",
                table: "UserAchievements");

            migrationBuilder.DropTable(
                name: "CommunityChallenges");

            migrationBuilder.DropIndex(
                name: "IX_UserAchievements_SourceCommunityChallengeId",
                table: "UserAchievements");

            migrationBuilder.DropIndex(
                name: "UX_UserAchievements_CommunityChallenge",
                table: "UserAchievements");

            migrationBuilder.DropIndex(
                name: "UX_UserAchievements_Milestone",
                table: "UserAchievements");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Quests_Coordinates_Paired",
                table: "Quests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Quests_Latitude_Range",
                table: "Quests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Quests_Longitude_Range",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "SourceCommunityChallengeId",
                table: "UserAchievements");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Quests");

            migrationBuilder.CreateIndex(
                name: "UX_UserAchievements_UserId_AchievementId",
                table: "UserAchievements",
                columns: new[] { "UserId", "AchievementId" },
                unique: true);
        }
    }
}
