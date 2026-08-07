using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberRewardInbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MemberRewardEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestCompletionId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    VerificationMethod = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    QuestTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    XpAwarded = table.Column<int>(type: "integer", nullable: false),
                    PreviousTotalXp = table.Column<long>(type: "bigint", nullable: false),
                    TotalXp = table.Column<long>(type: "bigint", nullable: false),
                    PreviousLevel = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    PreviousRankTitle = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    RankTitle = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    PreviousStreakWeeks = table.Column<int>(type: "integer", nullable: false),
                    StreakWeeks = table.Column<int>(type: "integer", nullable: false),
                    PreviousHasVerifiedImpactThisWeek = table.Column<bool>(type: "boolean", nullable: false),
                    HasVerifiedImpactThisWeek = table.Column<bool>(type: "boolean", nullable: false),
                    CommunityChallengeId = table.Column<Guid>(type: "uuid", nullable: true),
                    CommunityName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CommunityChallengePreviousProgress = table.Column<long>(type: "bigint", nullable: true),
                    CommunityChallengeProgress = table.Column<long>(type: "bigint", nullable: true),
                    CommunityChallengeTarget = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    SeenAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberRewardEvents", x => x.Id);
                    table.CheckConstraint("CK_MemberRewardEvents_CommunitySnapshot_Complete", "(\"CommunityChallengeId\" IS NULL AND \"CommunityName\" IS NULL AND \"CommunityChallengePreviousProgress\" IS NULL AND \"CommunityChallengeProgress\" IS NULL AND \"CommunityChallengeTarget\" IS NULL) OR (\"CommunityChallengeId\" IS NOT NULL AND \"CommunityName\" IS NOT NULL AND \"CommunityChallengePreviousProgress\" IS NOT NULL AND \"CommunityChallengeProgress\" IS NOT NULL AND \"CommunityChallengeTarget\" IS NOT NULL)");
                    table.CheckConstraint("CK_MemberRewardEvents_Level_Range", "\"Level\" BETWEEN 1 AND 99 AND \"PreviousLevel\" BETWEEN 1 AND 99");
                    table.CheckConstraint("CK_MemberRewardEvents_Streak_NonNegative", "\"StreakWeeks\" >= 0 AND \"PreviousStreakWeeks\" >= 0");
                    table.CheckConstraint("CK_MemberRewardEvents_TotalXp_Order", "\"TotalXp\" >= \"PreviousTotalXp\"");
                    table.CheckConstraint("CK_MemberRewardEvents_XpAwarded_Positive", "\"XpAwarded\" > 0");
                    table.ForeignKey(
                        name: "FK_MemberRewardEvents_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberRewardEvents_QuestCompletions_QuestCompletionId",
                        column: x => x.QuestCompletionId,
                        principalTable: "QuestCompletions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberRewardEvents_Quests_QuestId",
                        column: x => x.QuestId,
                        principalTable: "Quests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MemberRewardEvents_XpTransactions_Id",
                        column: x => x.Id,
                        principalTable: "XpTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberRewardEventAchievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RewardEventId = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberRewardEventAchievements", x => x.Id);
                    table.CheckConstraint("CK_MemberRewardEventAchievements_SortOrder", "\"SortOrder\" >= 0");
                    table.ForeignKey(
                        name: "FK_MemberRewardEventAchievements_Achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "Achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MemberRewardEventAchievements_MemberRewardEvents_RewardEven~",
                        column: x => x.RewardEventId,
                        principalTable: "MemberRewardEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UX_MemberRewardEventAchievements_Event_Achievement",
                table: "MemberRewardEventAchievements",
                columns: new[] { "RewardEventId", "AchievementId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_MemberRewardEventAchievements_Event_Order",
                table: "MemberRewardEventAchievements",
                columns: new[] { "RewardEventId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberRewardEvents_User_Inbox",
                table: "MemberRewardEvents",
                columns: new[] { "UserId", "SeenAtUtc", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberRewardEvents_User_Quest",
                table: "MemberRewardEvents",
                columns: new[] { "UserId", "QuestId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "UX_MemberRewardEvents_QuestCompletionId",
                table: "MemberRewardEvents",
                column: "QuestCompletionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MemberRewardEventAchievements");

            migrationBuilder.DropTable(
                name: "MemberRewardEvents");
        }
    }
}
