using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddXpLedgerAndProgression : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Level",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<long>(
                name: "TotalXp",
                table: "UserProfiles",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "XpTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceCompletionId = table.Column<Guid>(type: "uuid", nullable: false),
                    XpAmount = table.Column<int>(type: "integer", nullable: false),
                    CommunityRegionIdAtAward = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XpTransactions", x => x.Id);
                    table.CheckConstraint("CK_XpTransactions_XpAmount_Positive", "\"XpAmount\" > 0");
                    table.ForeignKey(
                        name: "FK_XpTransactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_XpTransactions_QuestCompletions_SourceCompletionId",
                        column: x => x.SourceCompletionId,
                        principalTable: "QuestCompletions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_XpTransactions_Quests_QuestId",
                        column: x => x.QuestId,
                        principalTable: "Quests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_XpTransactions_Regions_CommunityRegionIdAtAward",
                        column: x => x.CommunityRegionIdAtAward,
                        principalTable: "Regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_UserProfiles_Level_Range",
                table: "UserProfiles",
                sql: "\"Level\" BETWEEN 1 AND 99");

            migrationBuilder.AddCheckConstraint(
                name: "CK_UserProfiles_TotalXp_NonNegative",
                table: "UserProfiles",
                sql: "\"TotalXp\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_CommunityRegionIdAtAward_CreatedAt",
                table: "XpTransactions",
                columns: new[] { "CommunityRegionIdAtAward", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_UserId_CreatedAt",
                table: "XpTransactions",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "UX_XpTransactions_SourceCompletionId",
                table: "XpTransactions",
                column: "SourceCompletionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "XpTransactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_UserProfiles_Level_Range",
                table: "UserProfiles");

            migrationBuilder.DropCheckConstraint(
                name: "CK_UserProfiles_TotalXp_NonNegative",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "Level",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "TotalXp",
                table: "UserProfiles");
        }
    }
}
