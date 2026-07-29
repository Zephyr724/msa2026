using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTrustedCompletionClaims : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EvidenceClaimDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestCompletionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EvidenceUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    UserDeclaration = table.Column<bool>(type: "boolean", nullable: false),
                    ReviewNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReviewedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    EvidencePurgeDueAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    EvidencePurgedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvidenceClaimDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvidenceClaimDetails_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EvidenceClaimDetails_QuestCompletions_QuestCompletionId",
                        column: x => x.QuestCompletionId,
                        principalTable: "QuestCompletions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuestCompletions_Method_Status_CreatedAt",
                table: "QuestCompletions",
                columns: new[] { "Method", "Status", "CreatedAt" });

            migrationBuilder.Sql("""
                CREATE UNIQUE INDEX "UX_QuestCompletions_UserId_QuestId_PendingClaim"
                ON "QuestCompletions" ("UserId", "QuestId")
                WHERE "Method" = 'EvidenceClaim' AND "Status" = 'Pending';
                """);
            migrationBuilder.Sql("""
                CREATE UNIQUE INDEX "UX_QuestCompletions_UserId_QuestId_SelfReported"
                ON "QuestCompletions" ("UserId", "QuestId")
                WHERE "Method" = 'SelfReported' AND "Status" = 'SelfReported';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_EvidenceClaimDetails_PurgeDue",
                table: "EvidenceClaimDetails",
                column: "EvidencePurgeDueAt",
                filter: "\"EvidencePurgedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_EvidenceClaimDetails_ReviewedByUserId",
                table: "EvidenceClaimDetails",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "UX_EvidenceClaimDetails_QuestCompletionId",
                table: "EvidenceClaimDetails",
                column: "QuestCompletionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """DROP INDEX "UX_QuestCompletions_UserId_QuestId_PendingClaim";""");
            migrationBuilder.Sql(
                """DROP INDEX "UX_QuestCompletions_UserId_QuestId_SelfReported";""");

            migrationBuilder.DropTable(
                name: "EvidenceClaimDetails");

            migrationBuilder.DropIndex(
                name: "IX_QuestCompletions_Method_Status_CreatedAt",
                table: "QuestCompletions");
        }
    }
}
