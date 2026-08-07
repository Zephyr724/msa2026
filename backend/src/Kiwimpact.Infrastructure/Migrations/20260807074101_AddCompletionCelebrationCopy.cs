using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kiwimpact.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompletionCelebrationCopy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CelebrationMessage",
                table: "MemberRewardEvents",
                type: "character varying(280)",
                maxLength: 280,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CelebrationTitle",
                table: "MemberRewardEvents",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CompletionCelebrationCopies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Text = table.Column<string>(type: "character varying(280)", maxLength: 280, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompletionCelebrationCopies", x => x.Id);
                    table.CheckConstraint("CK_CompletionCelebrationCopies_SortOrder_NonNegative", "\"SortOrder\" >= 0");
                    table.CheckConstraint("CK_CompletionCelebrationCopies_Text_NotBlank", "length(btrim(\"Text\")) > 0");
                });

            var titles = new[]
            {
                "Well Done!",
                "Good Job!",
                "Mission Accomplished!",
                "Impact Made!",
                "Quest Complete!",
                "Brilliant Work!",
                "You Did It!",
                "Great Effort!",
                "Nice Work!",
                "Eco Win!",
                "Action Confirmed!",
                "Progress Unlocked!",
                "Impact Verified!",
                "Step Forward!",
                "Strong Finish!",
                "Community Hero!",
                "Planet Positive!",
                "Change in Motion!",
                "Green Momentum!",
                "Another Win!",
                "Wonderful Work!",
                "Keep It Growing!",
                "Purpose in Action!",
                "A Better Future!",
                "Momentum Built!",
                "Real-World Impact!",
                "Together We Grow!",
                "That Made a Difference!",
                "Your Impact Counts!",
                "Small Action, Big Meaning!",
            };
            var messages = new[]
            {
                "Thank you for taking action. Your verified Quest adds another meaningful step to our shared effort.",
                "Your time and care matter. This verified action is now part of the community's growing impact story.",
                "One real-world action can inspire the next. Thank you for moving our shared mission forward.",
                "You showed up and followed through. That is how lasting community momentum begins.",
                "This Quest is complete, but its meaning continues through the example you have set.",
                "Thank you for turning good intentions into a verified action the community can celebrate.",
                "Your contribution joins many others to build a stronger culture of everyday environmental action.",
                "Progress is made one thoughtful action at a time. Thank you for making yours count.",
                "You have added a real action to your Impact Passport and fresh momentum to the community.",
                "Every completed Quest helps make positive action more visible, normal, and achievable for others.",
                "Thank you for giving your time to something bigger than a checklist. Your participation matters.",
                "The community moves forward when members take action. Today, you helped create that movement.",
                "Your verified effort is now part of a wider pattern of people choosing to make a difference.",
                "This is what purpose looks like in practice: a clear action, completed and shared with the community.",
                "You have built another piece of your impact journey. Thank you for keeping the momentum alive.",
                "A healthier future is shaped through repeated action. Thank you for taking the next step.",
                "Your action may be personal, but its example can travel. Thank you for contributing.",
                "You completed the task and strengthened the shared story behind Kiwimpact's community mission.",
                "Thank you for making space in your week for verified environmental action.",
                "The most useful progress is progress we can repeat. Your completed Quest helps show the way.",
                "Your participation has been verified and recorded. Take a moment to enjoy the progress you made.",
                "You turned a Quest into action. That follow-through is worth recognising and sharing.",
                "This completed Quest is one more signal that practical community action is growing.",
                "Thank you for choosing participation over intention and adding your effort to the wider mission.",
                "Your Impact Passport now carries another verified chapter in your environmental journey.",
                "What you completed today becomes part of the momentum that encourages tomorrow's action.",
                "You helped make community impact tangible through one completed, verified Quest.",
                "Thank you for bringing energy, attention, and follow-through to this shared challenge.",
                "Positive change needs people who act. This verified completion shows that you are one of them.",
                "Your contribution has been recorded, and the community is stronger for your participation.",
                "Another Quest is complete and another example of practical action is ready to be shared.",
                "You have earned this moment. Thank you for adding a verified action to the collective effort.",
                "Small actions gain meaning when people keep showing up. Thank you for being part of that pattern.",
                "This completion reflects real participation, not just a promise. That distinction matters.",
                "Thank you for doing your part and helping the community build visible, credible momentum.",
                "Your action has a place in the bigger picture. Today, that picture became a little stronger.",
                "A completed Quest is proof of movement. Thank you for helping move the mission ahead.",
                "Your verified action adds depth to your Passport and energy to the community around it.",
                "Thank you for taking a practical step and giving others another reason to believe action is possible.",
                "The journey grows through moments like this: one person, one Quest, one completed action.",
                "You brought this Quest across the finish line. Its verified record can now encourage what comes next.",
                "Your effort contributes to a community where environmental action is seen, valued, and repeated.",
                "Thank you for completing what you started and strengthening your long-term impact record.",
                "This verified completion is a clear marker of progress in your personal impact journey.",
                "You have created momentum that can carry into your next Quest and inspire someone else's first.",
                "Thank you for making your values visible through action and adding to the community's shared progress.",
                "One more Quest is verified, one more action is recorded, and the next step is ready when you are.",
                "Your completed action now connects personal progress with a wider community mission.",
                "Thank you for taking part with purpose. Your effort belongs in the story of what the community can do.",
                "Pause and take credit for the work: you completed a real action and moved your impact journey forward.",
            };
            for (var index = 0; index < titles.Length; index++)
            {
                migrationBuilder.InsertData(
                    table: "CompletionCelebrationCopies",
                    columns: new[] { "Id", "Kind", "Text", "SortOrder", "IsActive" },
                    values: new object[]
                    {
                        Guid.Parse($"37000000-0000-4000-8001-{index + 1:000000000000}"),
                        "Title",
                        titles[index],
                        index,
                        true,
                    });
            }
            for (var index = 0; index < messages.Length; index++)
            {
                migrationBuilder.InsertData(
                    table: "CompletionCelebrationCopies",
                    columns: new[] { "Id", "Kind", "Text", "SortOrder", "IsActive" },
                    values: new object[]
                    {
                        Guid.Parse($"37000000-0000-4000-8002-{index + 1:000000000000}"),
                        "Message",
                        messages[index],
                        index,
                        true,
                    });
            }

            migrationBuilder.Sql("""
                UPDATE "MemberRewardEvents"
                SET "CelebrationTitle" = 'Well Done!',
                    "CelebrationMessage" = 'Thank you for taking action. Your verified Quest adds another meaningful step to our shared effort.'
                """);

            migrationBuilder.AlterColumn<string>(
                name: "CelebrationTitle",
                table: "MemberRewardEvents",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CelebrationMessage",
                table: "MemberRewardEvents",
                type: "character varying(280)",
                maxLength: 280,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(280)",
                oldMaxLength: 280,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "UX_CompletionCelebrationCopies_Kind_Order",
                table: "CompletionCelebrationCopies",
                columns: new[] { "Kind", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_CompletionCelebrationCopies_Kind_Text",
                table: "CompletionCelebrationCopies",
                columns: new[] { "Kind", "Text" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompletionCelebrationCopies");

            migrationBuilder.DropColumn(
                name: "CelebrationMessage",
                table: "MemberRewardEvents");

            migrationBuilder.DropColumn(
                name: "CelebrationTitle",
                table: "MemberRewardEvents");
        }
    }
}
