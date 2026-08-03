using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRicherAchievements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AchievementEvaluationVersion",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "QuestCategorySnapshot",
                table: "QuestCompletions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "QuestCompletions" AS completion
                SET "QuestCategorySnapshot" = quest."Category"
                FROM "Quests" AS quest
                WHERE completion."QuestId" = quest."Id";
                """);

            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM "QuestCompletions"
                        WHERE "QuestCategorySnapshot" IS NULL
                    ) THEN
                        RAISE EXCEPTION
                            'Quest category snapshot backfill is incomplete';
                    END IF;
                END
                $$;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "QuestCategorySnapshot",
                table: "QuestCompletions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.Sql(
                """
                ALTER TABLE "UserProfiles"
                ALTER COLUMN "AchievementEvaluationVersion" SET DEFAULT 2;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_AchievementEvaluationVersion",
                table: "UserProfiles",
                column: "AchievementEvaluationVersion");

            migrationBuilder.AddCheckConstraint(
                name: "CK_UserProfiles_AchievementEvaluationVersion_NonNegative",
                table: "UserProfiles",
                sql: "\"AchievementEvaluationVersion\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_QuestCompletions_UserId_CategorySnapshot_VerifiedAtUtc",
                table: "QuestCompletions",
                columns: new[] { "UserId", "QuestCategorySnapshot", "VerifiedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_AchievementEvaluationVersion",
                table: "UserProfiles");

            migrationBuilder.DropCheckConstraint(
                name: "CK_UserProfiles_AchievementEvaluationVersion_NonNegative",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_QuestCompletions_UserId_CategorySnapshot_VerifiedAtUtc",
                table: "QuestCompletions");

            migrationBuilder.DropColumn(
                name: "AchievementEvaluationVersion",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "QuestCategorySnapshot",
                table: "QuestCompletions");
        }
    }
}
