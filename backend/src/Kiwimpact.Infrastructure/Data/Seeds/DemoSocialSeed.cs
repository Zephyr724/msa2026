using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Development-only Community fixtures covering the feed's supported cover
/// shapes. These rows are public, fictional, deterministic, and idempotent.
/// The passwordless demo curator is retained as their non-sign-in author.
/// </summary>
public static class DemoSocialSeed
{
    public static readonly IReadOnlyList<Guid> PostIds =
    [
        new("65000000-0000-4000-8000-000000000101"),
        new("65000000-0000-4000-8000-000000000102"),
        new("65000000-0000-4000-8000-000000000103"),
        new("65000000-0000-4000-8000-000000000104"),
        new("65000000-0000-4000-8000-000000000105"),
        new("65000000-0000-4000-8000-000000000106"),
        new("65000000-0000-4000-8000-000000000107"),
        new("65000000-0000-4000-8000-000000000108"),
        new("65000000-0000-4000-8000-000000000109"),
        new("65000000-0000-4000-8000-000000000110"),
        new("65000000-0000-4000-8000-000000000111"),
        new("65000000-0000-4000-8000-000000000112"),
        new("65000000-0000-4000-8000-000000000113"),
        new("65000000-0000-4000-8000-000000000114"),
        new("65000000-0000-4000-8000-000000000115"),
        new("65000000-0000-4000-8000-000000000116"),
        new("65000000-0000-4000-8000-000000000117"),
        new("65000000-0000-4000-8000-000000000118"),
        new("65000000-0000-4000-8000-000000000119"),
        new("65000000-0000-4000-8000-000000000120"),
        new("65000000-0000-4000-8000-000000000121"),
        new("65000000-0000-4000-8000-000000000122"),
        new("65000000-0000-4000-8000-000000000123"),
        new("65000000-0000-4000-8000-000000000124"),
        new("65000000-0000-4000-8000-000000000125"),
        new("65000000-0000-4000-8000-000000000126"),
        new("65000000-0000-4000-8000-000000000127"),
        new("65000000-0000-4000-8000-000000000128"),
        new("65000000-0000-4000-8000-000000000129"),
        new("65000000-0000-4000-8000-000000000130"),
        new("65000000-0000-4000-8000-000000000131"),
        new("65000000-0000-4000-8000-000000000132"),
        new("65000000-0000-4000-8000-000000000133"),
        new("65000000-0000-4000-8000-000000000134"),
        new("65000000-0000-4000-8000-000000000135"),
        new("65000000-0000-4000-8000-000000000136"),
        new("65000000-0000-4000-8000-000000000137"),
        new("65000000-0000-4000-8000-000000000138"),
        new("65000000-0000-4000-8000-000000000139"),
        new("65000000-0000-4000-8000-000000000140"),
        new("65000000-0000-4000-8000-000000000141"),
        new("65000000-0000-4000-8000-000000000142"),
        new("65000000-0000-4000-8000-000000000143"),
        new("65000000-0000-4000-8000-000000000144"),
    ];

    public static readonly IReadOnlyList<Guid> SupportingContributorIds =
    [
        new("65000000-0000-4000-8000-000000000301"),
        new("65000000-0000-4000-8000-000000000302"),
        new("65000000-0000-4000-8000-000000000303"),
        new("65000000-0000-4000-8000-000000000304"),
        new("65000000-0000-4000-8000-000000000305"),
    ];

    public static readonly IReadOnlyList<Guid> RootCommentIds =
        Enumerable.Range(401, 44)
            .Select(value => new Guid($"65000000-0000-4000-8000-{value:D12}"))
            .ToArray();

    public static readonly IReadOnlyList<Guid> ReplyCommentIds =
        Enumerable.Range(501, 20)
            .Select(value => new Guid($"65000000-0000-4000-8000-{value:D12}"))
            .ToArray();

    private static readonly Guid[] PublishedQuestIds =
    [
        new("11111111-1111-4111-8111-111111111101"),
        new("11111111-1111-4111-8111-111111111102"),
        new("11111111-1111-4111-8111-111111111103"),
        new("11111111-1111-4111-8111-111111111104"),
        new("11111111-1111-4111-8111-111111111105"),
        new("11111111-1111-4111-8111-111111111106"),
        new("11111111-1111-4111-8111-111111111107"),
        new("11111111-1111-4111-8111-111111111108"),
        new("11111111-1111-4111-8111-111111111109"),
        new("11111111-1111-4111-8111-11111111110a"),
        new("11111111-1111-4111-8111-11111111110b"),
        new("11111111-1111-4111-8111-11111111110c"),
        new("11111111-1111-4111-8111-11111111110d"),
        new("11111111-1111-4111-8111-11111111110e"),
        new("11111111-1111-4111-8111-11111111110f"),
    ];

    private static readonly IReadOnlyList<string> SupportingDisplayNames =
    [
        "Aroha T.",
        "Liam W.",
        "Mei L.",
        "Sam K.",
        "Noah P.",
    ];

    private static readonly DateTimeOffset SeededAt =
        new(2026, 8, 6, 7, 0, 0, TimeSpan.Zero);

    public static async Task SeedAsync(
        KiwimpactDbContext db,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(db);

        var curator = await db.Set<ApplicationUser>().SingleOrDefaultAsync(
            user => user.Id == DemoQuestSeed.CuratorUserId,
            cancellationToken);
        if (curator is null ||
            await db.Quests.CountAsync(
                quest => PublishedQuestIds.Contains(quest.Id),
                cancellationToken) != PublishedQuestIds.Length)
        {
            throw new InvalidOperationException(
                "Development social seeding requires the demo curator and all published demo Quests.");
        }

        if (!await db.UserProfiles.AnyAsync(
                profile => profile.Id == DemoQuestSeed.CuratorUserId,
                cancellationToken))
        {
            db.UserProfiles.Add(UserProfile.Create(
                DemoQuestSeed.CuratorUserId,
                "Kiwimpact Demo",
                SeededAt));
        }

        var supportingContributors = await EnsureSupportingContributorsAsync(
            db,
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        var authors = new[] { curator }.Concat(supportingContributors).ToArray();

        var existing = await db.SocialPosts
            .Where(post => PostIds.Contains(post.Id))
            .Include(post => post.Images)
            .Include(post => post.Tags)
            .ToDictionaryAsync(post => post.Id, cancellationToken);
        var definitions = Definitions();
        for (var index = 0; index < definitions.Count; index++)
        {
            if (existing.TryGetValue(PostIds[index], out var existingPost) &&
                existingPost.AuthorUserId != authors[definitions[index].AuthorIndex].Id)
            {
                throw new InvalidOperationException(
                    $"Development Community fixture {PostIds[index]} is owned by another user.");
            }
        }

        for (var index = 0; index < definitions.Count; index++)
        {
            var definition = definitions[index];
            var author = authors[definition.AuthorIndex];
            var questIndex = definition.QuestIndex ?? index % 4;
            var questId = PublishedQuestIds[questIndex];
            var tags = new[] { "local-demo", definition.ShapeTag }
                .Concat(definition.ExtraTags)
                .ToArray();
            if (existing.TryGetValue(PostIds[index], out var existingPost))
            {
                existingPost.Update(
                    questId,
                    definition.Title,
                    definition.Content,
                    definition.Images,
                    tags,
                    SeededAt.AddMinutes(-index));
                continue;
            }

            var post = SocialPost.Create(
                author.Id,
                questId,
                definition.Title,
                definition.Content,
                definition.Images,
                tags,
                isHidden: false,
                SeededAt.AddMinutes(-index));
            post.Id = PostIds[index];
            foreach (var image in post.Images)
                image.PostId = post.Id;
            foreach (var tag in post.Tags)
                tag.PostId = post.Id;
            db.SocialPosts.Add(post);
        }

        await db.SaveChangesAsync(cancellationToken);
        await SeedCommentsAsync(db, authors, definitions, cancellationToken);
    }

    private static async Task<ApplicationUser[]> EnsureSupportingContributorsAsync(
        KiwimpactDbContext db,
        CancellationToken cancellationToken)
    {
        var users = new ApplicationUser[SupportingContributorIds.Count];
        for (var index = 0; index < SupportingContributorIds.Count; index++)
        {
            var id = SupportingContributorIds[index];
            var userName = $"dev-community-supporter-{index + 1:D2}";
            var normalizedUserName = userName.ToUpperInvariant();
            var email = $"dev-community-supporter-{index + 1:D2}@kiwimpact.invalid";
            var normalizedEmail = email.ToUpperInvariant();
            var reserved = await db.Set<ApplicationUser>()
                .Where(user =>
                    user.Id == id ||
                    user.NormalizedUserName == normalizedUserName ||
                    user.NormalizedEmail == normalizedEmail)
                .ToListAsync(cancellationToken);
            if (reserved.Any(user => user.Id != id))
            {
                throw new InvalidOperationException(
                    "A development Community supporting identity is reserved by another user.");
            }

            var user = reserved.SingleOrDefault(user => user.Id == id);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    Id = id,
                    UserName = userName,
                    NormalizedUserName = normalizedUserName,
                    Email = email,
                    NormalizedEmail = normalizedEmail,
                    EmailConfirmed = false,
                    PasswordHash = null,
                    SecurityStamp = null,
                    ConcurrencyStamp = null,
                    LockoutEnabled = true,
                };
                db.Set<ApplicationUser>().Add(user);
            }
            else
            {
                if (user.NormalizedUserName != normalizedUserName ||
                    user.NormalizedEmail != normalizedEmail ||
                    user.PasswordHash is not null ||
                    user.EmailConfirmed)
                {
                    throw new InvalidOperationException(
                        "A development Community supporting identity does not match its disabled contract.");
                }

                var hasAuthenticationArtifacts =
                    await db.Set<IdentityUserRole<Guid>>()
                        .AnyAsync(item => item.UserId == id, cancellationToken) ||
                    await db.Set<IdentityUserClaim<Guid>>()
                        .AnyAsync(item => item.UserId == id, cancellationToken) ||
                    await db.Set<IdentityUserLogin<Guid>>()
                        .AnyAsync(item => item.UserId == id, cancellationToken) ||
                    await db.Set<IdentityUserToken<Guid>>()
                        .AnyAsync(item => item.UserId == id, cancellationToken);
                if (hasAuthenticationArtifacts)
                {
                    throw new InvalidOperationException(
                        "A development Community supporting identity has authentication artifacts.");
                }
            }

            var profile = await db.UserProfiles.SingleOrDefaultAsync(
                item => item.Id == id,
                cancellationToken);
            if (profile is null)
            {
                db.UserProfiles.Add(UserProfile.Create(
                    id,
                    SupportingDisplayNames[index],
                    SeededAt));
            }
            users[index] = user;
        }
        return users;
    }

    private static async Task SeedCommentsAsync(
        KiwimpactDbContext db,
        IReadOnlyList<ApplicationUser> authors,
        IReadOnlyList<DemoPostDefinition> definitions,
        CancellationToken cancellationToken)
    {
        var allCommentIds = RootCommentIds.Concat(ReplyCommentIds).ToArray();
        var existing = await db.SocialComments
            .Where(comment => allCommentIds.Contains(comment.Id))
            .ToDictionaryAsync(comment => comment.Id, cancellationToken);

        for (var index = 0; index < definitions.Count; index++)
        {
            var rootAuthorIndex = 1 + ((index + 1) % SupportingContributorIds.Count);
            if (rootAuthorIndex == definitions[index].AuthorIndex)
                rootAuthorIndex = 1 + (rootAuthorIndex % SupportingContributorIds.Count);
            UpsertComment(
                db,
                existing,
                RootCommentIds[index],
                PostIds[index],
                authors[rootAuthorIndex].Id,
                parentCommentId: null,
                RootCommentBodies[index],
                SeededAt.AddMinutes(20 - index));
        }

        for (var replyIndex = 0; replyIndex < ReplyCommentBodies.Count; replyIndex++)
        {
            var postIndex = 24 + replyIndex;
            UpsertComment(
                db,
                existing,
                ReplyCommentIds[replyIndex],
                PostIds[postIndex],
                authors[definitions[postIndex].AuthorIndex].Id,
                RootCommentIds[postIndex],
                ReplyCommentBodies[replyIndex],
                SeededAt.AddMinutes(35 - postIndex));
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static void UpsertComment(
        KiwimpactDbContext db,
        IReadOnlyDictionary<Guid, SocialComment> existing,
        Guid id,
        Guid postId,
        Guid authorUserId,
        Guid? parentCommentId,
        string content,
        DateTimeOffset createdAt)
    {
        if (existing.TryGetValue(id, out var comment))
        {
            if (comment.PostId != postId ||
                comment.AuthorUserId != authorUserId ||
                comment.ParentCommentId != parentCommentId)
            {
                throw new InvalidOperationException(
                    $"Development Community comment fixture {id} is reserved by another row.");
            }
            comment.UpdateContent(content);
            return;
        }

        comment = SocialComment.Create(
            postId,
            authorUserId,
            parentCommentId,
            content,
            createdAt);
        comment.Id = id;
        db.SocialComments.Add(comment);
    }

    private static IReadOnlyList<DemoPostDefinition> Definitions()
    {
        const string localCommunityImageOrigin =
            "https://local.kiwimpact.invalid/images/community/";
        IReadOnlyList<SocialPostImageDetails> LocalPhoto(
            (string FileName, string AltText) image) =>
            [new($"{localCommunityImageOrigin}{image.FileName}", image.AltText)];

        var mirrorImages = new (string FileName, string AltText)[]
        {
            ("30-wetland-birds-monochrome.jpg", "Water birds reflected in a wetland"),
            ("08-trap-check-near-square.jpg", "A person observing a natural area beside a conservation fence"),
            ("07-track-maintenance-portrait.jpg", "A group walking together along a forest track"),
            ("43-environmental-cleanup.jpg", "Volunteers working together in a public green space"),
            ("23-young-tree-care-portrait.jpg", "A person observing an open natural area"),
            ("01-stream-planting-square.jpg", "Two volunteers planting young trees in an open green space"),
            ("15-bird-box-portrait.jpg", "A volunteer using binoculars to observe wildlife"),
            ("36-water-fieldwork.jpg", "Researchers carrying out water fieldwork in a wetland"),
            ("13-native-seed-collecting-square.jpg", "Several people holding young green plants together"),
            ("42-children-forest-walk.jpg", "Children exploring a sunlit forest path"),
            ("18-youth-pollinator-plan-landscape.jpg", "Two volunteers navigating a forest with a map and binoculars"),
            ("14-dune-guard-check-landscape.jpg", "Coastal grasses growing across a sandy dune habitat"),
            ("25-beach-cleanup-group.jpg", "Volunteers collecting litter together on a beach"),
            ("38-compost-hands.jpg", "Hands holding rich compost beside garden plants"),
            ("19-tool-cleaning-portrait.jpg", "A conservation volunteer resting outdoors after fieldwork"),
            ("11-wetland-guards-portrait.jpg", "Volunteers planting on a sandy restoration site"),
            ("29-coastal-cleanup-landscape.jpg", "A broad coastal habitat with a volunteer working in the distance"),
            ("41-park-cleanup-group.jpg", "A group of volunteers cleaning a public park"),
            ("34-wetland-heron.jpg", "A grey heron wading through a wetland"),
            ("44-volunteer-group.jpg", "Volunteers taking a group photo after community work"),
        }
            .Select(LocalPhoto)
            .ToArray();

        var storyImages = new (string FileName, string AltText)[]
        {
            ("02-beach-cleanup-landscape.jpg", "A group of volunteers collecting rubbish beside the water"),
            ("16-rain-garden-near-square.jpg", "A volunteer supporting a newly planted tree"),
            ("04-recycling-workshop-near-square.jpg", "Volunteers sorting plastic, paper, and glass for recycling"),
            ("03-wetland-notes-portrait.jpg", "Water birds among reeds in a wetland habitat"),
            ("05-water-quality-square.jpg", "A field researcher assessing water quality outdoors"),
            ("09-home-compost-square.jpg", "A person collecting kitchen scraps for composting"),
            ("26-beach-cleanup-family.jpg", "Adults and children taking part in a beach clean-up"),
            ("10-bikes-working-bee-landscape.jpg", "Young volunteers working together in a green public space"),
            ("47-greenhouse-gardening.jpg", "Two gardeners potting plants together in a greenhouse"),
            ("17-stream-invertebrates-square.jpg", "Reeds and native habitat in a wetland landscape"),
            ("35-wetland-duck.jpg", "A duck standing in a natural wetland habitat"),
            ("12-nature-walk-near-square.jpg", "Two people exploring a forest with a map and binoculars"),
            ("46-community-potting-session.jpg", "A group taking part in a community potting session"),
            ("21-litter-audit-square.jpg", "A person sorting recyclable materials into a large sack"),
            ("45-greenhouse-seedling-planting.jpg", "Two people planting rows of young seedlings"),
            ("22-invasive-vine-removal-landscape.jpg", "A volunteer collecting litter in a green public space"),
            ("06-community-garden-landscape.jpg", "A group planting a young tree together"),
            ("37-wetland-dawn.jpg", "Birds across a misty wetland at dawn"),
            ("20-working-bee-tea-near-square.jpg", "A volunteer sorting reusable and recyclable household items"),
            ("39-wetland-egret.jpg", "A white egret standing in a grassy wetland"),
        };
        var storyImageIndex = 0;

        DemoPostDefinition ProductionMirror(
            string title,
            string content,
            params int[] postIndexes) =>
            new(
                title,
                content,
                mirrorImages[postIndexes[0]],
                "production-image-mirror");

        DemoPostDefinition CommunityStory(
            int authorIndex,
            int questIndex,
            string title,
            string content,
            IReadOnlyList<int> _imageIndexes,
            params string[] tags) =>
            new(
                title,
                content,
                LocalPhoto(storyImages[storyImageIndex++]),
                "community-story",
                questIndex,
                authorIndex,
                tags);

        return
        [
            new(
                "Landscape cover · stream restoration",
                "This fictional local post demonstrates a deliberately cropped landscape fixture in the masonry feed.",
                LocalPhoto(("32-forest-cleanup.jpg", "Volunteers picking up recyclable litter in a forest")),
                "landscape-cover"),
            new(
                "Square cover · planting notes",
                "This fictional local post demonstrates a square fixture without forcing a shared card height.",
                LocalPhoto(("33-compost-bin.jpg", "A gardener working beside an outdoor compost bin")),
                "square-cover"),
            new(
                "Tall cover · a bounded portrait",
                "This fictional local post demonstrates a portrait source while the feed preserves its original aspect ratio.",
                LocalPhoto(("40-litter-pickup-pair.jpg", "Two volunteers picking up litter outdoors")),
                "tall-cover"),
            new(
                "Text cover · no image supplied",
                "The first complete sentence becomes this post's cover. The remaining body stays in the opened post so the discovery card remains compact.",
                [],
                "text-cover"),
            ProductionMirror(
                "First field-day lesson: slow down and listen",
                "The original-ratio production image is mirrored here so local Community layout matches the deployed showcase.",
                0),
            ProductionMirror(
                "The five-minute trap check that became a habit",
                "A small repeatable routine made this local conservation task feel manageable.",
                1),
            ProductionMirror(
                "A quiet team makes a long track feel short",
                "Two production images exercise the detail carousel while the first keeps its native feed ratio.",
                2, 4),
            ProductionMirror(
                "What I pack for a community ranger morning",
                "Gloves, water, a pencil that works in drizzle, and one more warm layer than expected.",
                3),
            ProductionMirror(
                "One patch of weeds, one very good morning",
                "Patient restoration work becomes easier when someone nearby can explain what to leave alone.",
                4),
            ProductionMirror(
                "Planting day: wet boots, warm welcome",
                "Two differently shaped originals show how a real post can mix portrait and landscape media.",
                5, 8),
            ProductionMirror(
                "Three things a first-time bird counter notices",
                "Movement, immediate notes, and being comfortable saying not sure made citizen science welcoming.",
                6),
            ProductionMirror(
                "The stream looked clear—then the test kit told the story",
                "A repeatable method revealed more than a quick glance at the water.",
                7),
            ProductionMirror(
                "Tiny plants, big future shade",
                "Native image dimensions remain intact in this two-photo local mirror.",
                8, 19),
            ProductionMirror(
                "A screen-free lunch walk through Kirikiriroa",
                "Twenty quiet minutes on a nearby trail was enough to reset the afternoon.",
                9),
            ProductionMirror(
                "Who lives under this leaf?",
                "A magnifier and permission to stay curious turned one question into a long conversation.",
                10),
            ProductionMirror(
                "Dune planting taught me where not to step",
                "This multi-image post preserves the source ratios rather than requesting a server-side crop.",
                11, 16),
            ProductionMirror(
                "A two-bag clean-up and one useful surprise",
                "Sorting the collection made recurring litter patterns much easier to notice.",
                12, 17),
            ProductionMirror(
                "My compost bin finally stopped smelling",
                "More dry carbon, smaller scraps, and a proper mix solved the messy first attempt.",
                13),
            ProductionMirror(
                "New-volunteer nerves disappeared at the tool shed",
                "A clear welcome and one specific first job changed the morning in five minutes.",
                14),
            ProductionMirror(
                "Small jobs make a wetland feel cared for",
                "Quiet maintenance around young plants makes the next season possible.",
                15),
            ProductionMirror(
                "Helping habitat without getting in the way",
                "Keeping distance and following the local team matters more than getting a close photo.",
                16),
            ProductionMirror(
                "Our adopted corner is starting to look loved",
                "Regular visits build relationships with a place as well as improving it.",
                17),
            ProductionMirror(
                "Backyard tracking: the print I could not identify",
                "Saving an uncertain observation led to a useful conversation instead of a forced answer.",
                18),
            ProductionMirror(
                "The best part of planting was the tea afterwards",
                "The work finished quickly; the conversations afterwards made everyone want to return.",
                19, 8),
            CommunityStory(
                1,
                0,
                "What we found in forty minutes beside the stream",
                "I expected the usual drink bottles and wrappers, but the small pieces were what filled our bags fastest: cable ties, torn foam, and bits of plastic caught under roots. We worked slowly around the planted edge so we did not damage the new growth. By the end, the visible change was modest, yet the waterline looked noticeably calmer. Next time I am bringing a separate bucket for sharp fragments and a notebook so we can compare what keeps returning after rain.",
                [1],
                "stream-cleanup",
                "field-notes"),
            CommunityStory(
                2,
                1,
                "The planting lesson I wish I had learned earlier",
                "My first few holes were far too deep, and I was embarrassed when someone gently asked me to check where the root flare sat. Once I understood what to look for, the rest of the row went much faster. We also left space around each stem instead of piling mulch against it. I took photos of the finished guards and labels because I want to recognise these trees on a return visit, not just remember a busy morning of digging.",
                [0],
                "native-planting",
                "beginner-tip"),
            CommunityStory(
                3,
                2,
                "A recycling question that split our whole table",
                "We brought a bag of confusing household items to the workshop and discovered that almost everyone had been confidently sorting at least one thing incorrectly. The most useful part was not memorising a longer list; it was learning to check the local guidance when packaging changes. I have put a small container beside the recycling bin for lids and pieces that need a second look. It is already stopping the rushed guesses that used to happen on collection night.",
                [3],
                "recycling",
                "practical-learning"),
            CommunityStory(
                4,
                3,
                "A quiet morning checking the habitat edge",
                "The ranger asked us to pay attention to signs rather than trying to get close to wildlife. We noted fresh tracks, checked the marked line, and kept voices low near the denser vegetation. That slower pace changed the whole experience: I noticed calls I would normally miss and understood why some areas need to stay visually uneventful for visitors. The best photo was taken from well back on the path, and the most useful work happened where nobody would think to pose.",
                [15],
                "habitat-care",
                "responsible-volunteering"),
            CommunityStory(
                5,
                4,
                "Clear water does not always mean healthy water",
                "I nearly wrote down that the stream looked fine before we opened the test kit. Working through temperature, clarity, and the other measurements reminded me how unreliable a quick visual judgement can be. Our first reading seemed odd, so we rinsed the container and repeated it instead of forcing the number to fit our expectation. I would like to return after a wet week and compare the results; one careful measurement feels useful, but a pattern over time would tell a much better story.",
                [4],
                "water-quality",
                "citizen-science"),
            CommunityStory(
                1,
                5,
                "The children asked better compost questions than I did",
                "I arrived with a tidy explanation prepared, then the first group immediately asked why worms do not drown when the bin is wet. We ended up examining texture, smell, and moisture together instead of following my planned order. Giving everyone a small job kept the session moving, especially for the quieter students who did not want to speak in front of the class. I left with fewer perfect answers but a much better idea of how curiosity can guide environmental learning.",
                [8],
                "environmental-education",
                "youth-learning"),
            CommunityStory(
                2,
                6,
                "Four bags from one short stretch of coast",
                "The beach looked fairly clean from the car park, but the high-tide line told a different story. We separated rope, soft plastic, and general rubbish as we moved, then photographed the unusual items before disposal. Gloves were essential around the driftwood, and working in pairs made it easier to watch the incoming water while reaching awkward spots. The biggest lesson was how quickly tiny fragments disappear into sand; the final ten metres took almost as long as the first fifty.",
                [22],
                "coastal-cleanup",
                "waste-reduction"),
            CommunityStory(
                3,
                7,
                "Planting beside the bike path changed my commute",
                "I pass this route most weekdays and had never thought about who maintained the narrow green strip beside it. During the working bee we planted low native shrubs, checked sight lines around the crossing, and kept tools clear of riders. Now I notice which plants are holding moisture and where litter gathers after windy days. It is a small project, but seeing it repeatedly makes the contribution feel more tangible than work in a place I may never visit again.",
                [17],
                "bike-path",
                "urban-restoration"),
            CommunityStory(
                4,
                8,
                "Our first garden harvest was smaller than the shared lunch",
                "We picked only a modest bowl of greens, but everyone brought something and the table kept expanding. Before eating, we repaired the edge of one bed, added dry material to the compost, and wrote down which seedlings had struggled in the exposed corner. The notes felt overly careful at first, then a longtime gardener explained how much guesswork they save next season. I came for practical growing advice and stayed because the conversation made the garden feel genuinely shared.",
                [5],
                "community-garden",
                "composting"),
            CommunityStory(
                5,
                9,
                "Wetland work is mostly patience and wet socks",
                "There was no dramatic transformation today. We cleared around young plants, checked guards, and carried cut material back along a muddy edge without stepping into the softest ground. The coordinator showed us how to distinguish a planted native from a similar-looking weed, which slowed me down in the best way. On the walk out we spotted birds using the sheltered water near last season's planting. That small sign made the repetitive maintenance feel connected to a much longer recovery.",
                [16],
                "wetland-restoration",
                "wildlife-habitat"),
            CommunityStory(
                1,
                10,
                "My bird-count notes were messy but still useful",
                "I worried that everyone else would identify birds instantly, while I was still writing descriptions like ‘small, fast, pale underneath’. The experienced counter beside me said those observations were better than an overconfident guess. We recorded time, direction, behaviour, and the calls we could recognise, then reviewed uncertain entries together. By the second location I was listening more carefully and reaching for the guide less often. I am posting this for anyone who thinks beginner notes do not belong in citizen science.",
                [2],
                "bird-count",
                "beginner-observations"),
            CommunityStory(
                2,
                11,
                "Ten minutes in the backyard became a tiny survey",
                "I started with one patch beside the fence and resisted the urge to search the entire garden. In ten minutes I found different leaf shapes, two kinds of visiting insects, and several marks I could not identify. Photographing the wider plant before the close-up made the record much easier to understand later. I have added the same short survey to my calendar for next month because repeating one bounded observation may reveal more than a single ambitious afternoon.",
                [11],
                "backyard-biodiversity",
                "nature-journal"),
            CommunityStory(
                3,
                12,
                "The eco-club activity that finally got everyone talking",
                "We asked each group to choose one overlooked corner and imagine how it could support more life without becoming difficult to maintain. The ideas ranged from a small herb bed to leaving seed heads through winter. Once the students could draw and rearrange the plan, the quieter voices started shaping the discussion. We finished by assigning one realistic next step rather than promising a complete transformation. I am keeping that format; it made stewardship feel practical instead of abstract.",
                [9],
                "youth-eco-club",
                "community-learning"),
            CommunityStory(
                4,
                13,
                "A waste audit makes one lunch bin impossible to ignore",
                "Sorting a single sample was enough to show how much avoidable packaging moved through the space each day. We weighed broad categories, photographed the layout, and wrote down the items that were hardest to classify. The conversation shifted from blaming people to asking whether bins, labels, and purchasing choices made the right action easy. Our next step is deliberately small: improve one confusing station, repeat the same sample, and see whether the mix changes before proposing anything larger.",
                [21],
                "waste-audit",
                "measurement"),
            CommunityStory(
                5,
                14,
                "Harakeke, heavy clay, and a very patient team leader",
                "The ground beside the stream looked soft until the spade met a dense layer of clay. We adjusted the spacing, loosened each hole properly, and made sure the plants were firm without being buried. Someone kept the path clear while others carried water, so the group settled into an easy rhythm despite the slow digging. I wrote the planting date on my phone and want to revisit after summer. Survival will be a more honest result than the number we planted today.",
                [10],
                "stream-planting",
                "native-plants"),
            CommunityStory(
                1,
                0,
                "The cleanup kit that now lives by my front door",
                "After arriving without a spare pair of gloves last time, I made a small grab-and-go kit: gloves, hand sanitiser, a reusable water bottle, and two old sacks for separating what we collect. It removes the morning scramble and makes spontaneous neighbourhood cleanups much easier. I still leave unknown or hazardous material alone and report it rather than trying to be heroic. The kit is simple, but turning preparation into a routine has made me much more likely to show up.",
                [20],
                "volunteer-kit",
                "cleanup-routine"),
            CommunityStory(
                2,
                1,
                "I returned to the planting site three weeks later",
                "The row looked less dramatic than it did in the group photo, which was exactly why the return visit mattered. A few guards needed straightening, mulch had shifted, and one exposed plant looked stressed. I sent the observations to the coordinator instead of attempting changes I was unsure about. Most seedlings were settling in well, and recognising the labels made the place feel familiar. Planting day was satisfying; checking what happened afterwards made it feel like responsibility rather than a one-off event.",
                [12],
                "planting-follow-up",
                "site-care"),
            CommunityStory(
                3,
                10,
                "A dawn bird count without a perfect checklist",
                "We began before the park became busy and used the first few minutes simply to listen. I missed several calls while trying to write and look at the same time, so we divided roles for the next interval. That small change produced calmer, clearer notes and let everyone contribute at their own confidence level. The final list was not enormous, but the repeated locations and timestamps made it useful. Next time I will bring a clipboard and fewer expectations about identifying everything immediately.",
                [14],
                "early-morning",
                "citizen-science"),
            CommunityStory(
                4,
                2,
                "The awkward packaging shelf in our kitchen",
                "After the recycling workshop, we created a temporary shelf for packaging we could not confidently sort. Once a week we check the local guidance, remove labels where required, and decide whether the product is worth buying again. The shelf is not photogenic, but it has exposed patterns that a tidy bin hid from us. We are choosing one replacement at a time rather than attempting a perfect low-waste household overnight, and that pace has made the changes stick.",
                [19],
                "household-waste",
                "small-changes"),
            CommunityStory(
                5,
                3,
                "The best habitat photo was the one I did not take",
                "A bird moved near the track and my first instinct was to step closer for a clearer image. The volunteer beside me quietly pointed out the boundary marker, so we stayed back and watched for only a moment before continuing. Later we photographed the wider habitat and recorded what we had observed without sharing a precise location. That choice felt less exciting in the moment, but it respected the reason we were there. Responsible participation sometimes looks like deciding that documentation is not the priority.",
                [7],
                "wildlife-ethics",
                "habitat-protection"),
        ];
    }

    private static readonly IReadOnlyList<string> RootCommentBodies =
    [
        "We found most of the small plastic wedged just below the footbridge. A separate bucket for sharp pieces made the sorting much safer.",
        "The planting-depth reminder is useful. I also mark the uphill side of each guard so it is easier to check after heavy rain.",
        "That seedling photo reminds me how quickly delicate plants dry out in wind. We kept ours covered until each hole was completely ready.",
        "A clear first sentence is enough to make me stop and read. Photos help, but practical notes are usually what I save for later.",
        "Waiting quietly works surprisingly well. I heard three calls this morning before I managed to identify even one of the birds.",
        "Linking the check to coffee is clever. I use the Sunday weather forecast as my reminder and record even the uneventful checks.",
        "Shared tasks make introductions much less awkward. Carrying tools beside someone is often how I learn their name.",
        "A dry pencil and spare socks are my two additions. The socks stay in the car and have rescued more than one wet morning.",
        "Knowing what to leave is the hardest part for beginners. A five-minute plant walk before starting saved our group from mistakes.",
        "The welcome matters so much. Someone checking my first plant gave me confidence to keep going without hovering over every hole.",
        "Writing the time immediately changed my records. I used to remember the bird and forget when or where I had actually seen it.",
        "Repeating an odd reading is good practice. We once discovered that our sample container had not been rinsed properly.",
        "A return photo would be lovely. The tiny labels feel optimistic now, but they make future visits much more meaningful.",
        "Short walks are easier to repeat than ambitious weekend plans. I have started noticing seasonal changes on the same twenty-minute route.",
        "Children are brilliant at staying with a small mystery. Adults often rush to name things before we have properly looked.",
        "Once you notice informal tracks through dunes, they are hard to unsee. The marked access route is usually only a few steps longer.",
        "Recording the common litter types could support prevention, not just cleanup. Bottle caps keep dominating our local count.",
        "Thank you for including the failed version. Adding shredded cardboard and mixing the centre fixed the same smell in our bin.",
        "The car-park nerves are real. A named greeter and one clear first task made my second attempt completely different.",
        "Quiet maintenance rarely appears in event photos, but guards and cleared edges are what help the planting survive its first year.",
        "Keeping distance is part of the work. Habitat restoration should never become an excuse to crowd the wildlife it is meant to support.",
        "Regular visits change how neighbours respond too. People who once walked past now stop to ask when the next working bee is.",
        "Saving the uncertain print was the right call. Scale, surface, and a wider context photo can all help someone identify it later.",
        "The tea afterwards is where I heard about two other local projects. Informal conversation might be the best volunteer noticeboard.",
        "A notebook is worth bringing. We started seeing the same foam fragments after each heavy rain and could finally report a pattern.",
        "Root flare was new language for me too. Once someone showed me on a real seedling, the planting instructions finally made sense.",
        "Our table argued about black plastic trays for ten minutes before checking the local rules. Packaging changes faster than habits do.",
        "Thank you for mentioning distance. A useful habitat check can feel uneventful, and that is often a sign we did not disturb anything.",
        "Comparing after rain would be interesting. Try to sample from the same safe location so the results are easier to interpret.",
        "Letting the questions change the lesson takes confidence. The moisture test is much more memorable when everyone can feel the difference.",
        "The high-tide line always hides more than expected. We use one person to watch conditions while the other collects near the water.",
        "I ride past that strip as well and noticed the new guards this week. It already makes the crossing feel more cared for.",
        "Keeping seasonal notes transformed our garden planning. Even a rough record of shade and harvest dates is surprisingly valuable.",
        "Wet socks are accurate! A boot brush at the vehicle also helps stop seeds and mud travelling from one restoration site to another.",
        "Descriptions like ‘pale underneath’ can be exactly the clue someone needs. Careful uncertainty is better data than a confident guess.",
        "The wider plant photo is such a good tip. My close-ups often become impossible to place when I review them a week later.",
        "One realistic next step keeps the energy from disappearing after the session. Our group chose a small pollinator patch near the entrance.",
        "Improving one station before repeating the sample is a strong approach. It gives people a visible change and something measurable.",
        "Heavy clay slowed our team too. Pre-positioning water and mulch kept the narrow path from turning into a traffic jam.",
        "I keep a similar kit in a bucket so it is easy to rinse afterwards. A small first-aid pouch is another useful addition.",
        "The follow-up visit is where stewardship becomes real. Reporting concerns to the coordinator also prevents well-meant accidental damage.",
        "Dividing observer and recorder roles helped our group enormously. We swapped halfway so everyone still practised both skills.",
        "The awkward shelf is honest and practical. Seeing the pile makes purchasing patterns much easier to discuss without blaming anyone.",
        "Not sharing the precise location is an important detail. A habitat-level photo can tell the story without adding pressure to wildlife.",
    ];

    private static readonly IReadOnlyList<string> ReplyCommentBodies =
    [
        "That is exactly the kind of pattern I want to capture. I will add the bridge location and rainfall notes without posting anything sensitive.",
        "I am glad it was not just me. The root-flare check is now the first thing I will ask someone to demonstrate at the next planting.",
        "The changing packaging is what surprised me most. I have bookmarked the local guide instead of relying on what I learned years ago.",
        "‘Uneventful’ is a helpful way to frame it. I came away appreciating the boundaries more than the chance of a close sighting.",
        "Good point about using the same location. I will also note the time and recent weather so the comparison has some context.",
        "The hands-on moisture comparison was the moment everyone leaned in. I am rewriting the next activity around observation first.",
        "Having a dedicated conditions watcher would make the shoreline work much calmer. We improvised that role near the end.",
        "It is lovely that you noticed the guards. I am hoping the low planting keeps the path open while still adding habitat.",
        "We started a shared notebook today. Nothing elaborate—just date, weather, work completed, and what needs checking next time.",
        "A boot brush is going straight onto our equipment list. Biosecurity between sites is easy to forget when everyone is tired and muddy.",
        "Thank you—that takes pressure off the identification part. I am going to keep using descriptive notes alongside any tentative species name.",
        "I learned that after reviewing a folder full of mystery close-ups. One context photo now comes before every detailed shot.",
        "A pollinator patch sounds achievable and visible. I may suggest the same scale when the club chooses its first project.",
        "Yes, a repeat sample should tell us more than a large proposal based on one day. I will share the before-and-after categories here.",
        "Pre-positioning supplies would have saved many slippery trips. We will sketch a simple tool and water layout before the next session.",
        "A washable bucket is better than my loose sacks for storage. I will add the first-aid pouch and an emergency contact card too.",
        "I resisted straightening the stressed plant because I was unsure. Sending a marked photo to the coordinator felt like the safer contribution.",
        "Swapping roles is a great idea. Recording made me listen differently, but I would still like time to practise spotting movement.",
        "The shelf has already changed one purchase without any household rule-making. That feels more sustainable than trying to overhaul everything.",
        "I nearly included the location, then realised the wider habitat was the actual story. I am glad we kept the observation general.",
    ];

    private sealed record DemoPostDefinition(
        string Title,
        string Content,
        IReadOnlyList<SocialPostImageDetails> Images,
        string ShapeTag,
        int? QuestIndex = null,
        int AuthorIndex = 0,
        IReadOnlyList<string>? AdditionalTags = null)
    {
        public IReadOnlyList<string> ExtraTags { get; } = AdditionalTags ?? [];
    }
}
