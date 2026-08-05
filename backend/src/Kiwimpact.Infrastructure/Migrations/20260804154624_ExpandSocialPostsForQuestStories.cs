using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandSocialPostsForQuestStories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "SocialPosts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "QuestId",
                table: "SocialPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "SocialPosts",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "SocialPostImages",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    AltText = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPostImages", x => new { x.PostId, x.SortOrder });
                    table.CheckConstraint("CK_SocialPostImages_SortOrder", "\"SortOrder\" >= 0 AND \"SortOrder\" < 9");
                    table.ForeignKey(
                        name: "FK_SocialPostImages_SocialPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "SocialPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SocialPostTags",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    NormalizedName = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Name = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPostTags", x => new { x.PostId, x.NormalizedName });
                    table.ForeignKey(
                        name: "FK_SocialPostTags_SocialPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "SocialPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Existing posts predate titles and multi-image rows. Preserve their
            // content and image rather than inventing a Quest relationship or
            // deleting user data. New writes enforce a published Quest in the
            // application service.
            migrationBuilder.Sql(
                """
                UPDATE "SocialPosts"
                SET "Title" = LEFT("Content", 120)
                WHERE "Title" = '';

                INSERT INTO "SocialPostImages" ("PostId", "SortOrder", "Url", "AltText")
                SELECT "Id", 0, "ImageUrl", "ImageAltText"
                FROM "SocialPosts"
                WHERE "ImageUrl" IS NOT NULL AND "ImageAltText" IS NOT NULL
                ON CONFLICT ("PostId", "SortOrder") DO NOTHING;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "SocialPosts",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(120)",
                oldMaxLength: 120,
                oldDefaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_SocialPosts_QuestId",
                table: "SocialPosts",
                column: "QuestId");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPosts_Quests_QuestId",
                table: "SocialPosts",
                column: "QuestId",
                principalTable: "Quests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SocialPosts_Quests_QuestId",
                table: "SocialPosts");

            // The legacy schema can retain only one image. Preserve position
            // zero before removing the ordered image table during rollback.
            migrationBuilder.Sql(
                """
                UPDATE "SocialPosts" AS post
                SET "ImageUrl" = image."Url",
                    "ImageAltText" = image."AltText"
                FROM "SocialPostImages" AS image
                WHERE image."PostId" = post."Id"
                  AND image."SortOrder" = 0;
                """);

            migrationBuilder.DropTable(
                name: "SocialPostImages");

            migrationBuilder.DropTable(
                name: "SocialPostTags");

            migrationBuilder.DropIndex(
                name: "IX_SocialPosts_QuestId",
                table: "SocialPosts");

            migrationBuilder.DropColumn(
                name: "IsHidden",
                table: "SocialPosts");

            migrationBuilder.DropColumn(
                name: "QuestId",
                table: "SocialPosts");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "SocialPosts");
        }
    }
}
