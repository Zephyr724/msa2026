using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestCompletionCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CompletionCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ValidFrom = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ValidTo = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompletionCodes", x => x.Id);
                    table.CheckConstraint("CK_CompletionCodes_ValidityWindow", "\"ValidTo\" IS NULL OR \"ValidTo\" > \"ValidFrom\"");
                    table.ForeignKey(
                        name: "FK_CompletionCodes_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CompletionCodes_Quests_QuestId",
                        column: x => x.QuestId,
                        principalTable: "Quests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuestCompletions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParticipationId = table.Column<Guid>(type: "uuid", nullable: true),
                    Method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    VerifiedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RewardDifficultySnapshot = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CommunityRegionIdAtCompletion = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestCompletions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuestCompletions_QuestParticipations_ParticipationId",
                        column: x => x.ParticipationId,
                        principalTable: "QuestParticipations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_QuestCompletions_Quests_QuestId",
                        column: x => x.QuestId,
                        principalTable: "Quests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuestCompletions_Regions_CommunityRegionIdAtCompletion",
                        column: x => x.CommunityRegionIdAtCompletion,
                        principalTable: "Regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompletionCodes_CreatedByUserId",
                table: "CompletionCodes",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CompletionCodes_QuestId_IsActive_IsRevoked",
                table: "CompletionCodes",
                columns: new[] { "QuestId", "IsActive", "IsRevoked" });

            migrationBuilder.CreateIndex(
                name: "UX_CompletionCodes_QuestId_Active",
                table: "CompletionCodes",
                column: "QuestId",
                unique: true,
                filter: "\"IsActive\" AND NOT \"IsRevoked\"");

            migrationBuilder.CreateIndex(
                name: "IX_QuestCompletions_CommunityRegionIdAtCompletion",
                table: "QuestCompletions",
                column: "CommunityRegionIdAtCompletion");

            migrationBuilder.CreateIndex(
                name: "IX_QuestCompletions_ParticipationId",
                table: "QuestCompletions",
                column: "ParticipationId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestCompletions_QuestId",
                table: "QuestCompletions",
                column: "QuestId");

            migrationBuilder.CreateIndex(
                name: "UX_QuestCompletions_UserId_QuestId_Verified",
                table: "QuestCompletions",
                columns: new[] { "UserId", "QuestId" },
                unique: true,
                filter: "\"Status\" = 'Verified'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompletionCodes");

            migrationBuilder.DropTable(
                name: "QuestCompletions");
        }
    }
}
