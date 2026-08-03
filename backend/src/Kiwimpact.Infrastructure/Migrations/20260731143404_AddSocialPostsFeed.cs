using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialPostsFeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SocialPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    ImageAltText = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPosts", x => x.Id);
                    table.CheckConstraint("CK_SocialPosts_ImageMetadata_Pair", "(\"ImageUrl\" IS NULL AND \"ImageAltText\" IS NULL) OR (\"ImageUrl\" IS NOT NULL AND \"ImageAltText\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_SocialPosts_AspNetUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SocialComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentCommentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialComments", x => x.Id);
                    table.CheckConstraint("CK_SocialComments_NotSelfParent", "\"ParentCommentId\" IS NULL OR \"ParentCommentId\" <> \"Id\"");
                    table.ForeignKey(
                        name: "FK_SocialComments_AspNetUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SocialComments_SocialComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "SocialComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SocialComments_SocialPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "SocialPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SocialPostLikes",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialPostLikes", x => new { x.PostId, x.UserId });
                    table.ForeignKey(
                        name: "FK_SocialPostLikes_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SocialPostLikes_SocialPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "SocialPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SocialComments_AuthorUserId",
                table: "SocialComments",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialComments_ParentCommentId",
                table: "SocialComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialComments_Post_Parent_CreatedAt_Id",
                table: "SocialComments",
                columns: new[] { "PostId", "ParentCommentId", "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_SocialPostLikes_UserId",
                table: "SocialPostLikes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialPosts_AuthorUserId",
                table: "SocialPosts",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialPosts_CreatedAt_Id",
                table: "SocialPosts",
                columns: new[] { "CreatedAt", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SocialComments");

            migrationBuilder.DropTable(
                name: "SocialPostLikes");

            migrationBuilder.DropTable(
                name: "SocialPosts");
        }
    }
}
