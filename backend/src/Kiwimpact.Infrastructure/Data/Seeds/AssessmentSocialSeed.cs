using Kiwimpact.Core.Entities;
using Kiwimpact.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Idempotent fictional community stories for the assessment showcase.
/// The stories use pseudonymous or configured assessment identities and reuse
/// the credited Pexels illustrations from the real Quest catalogue. They do
/// not represent real people, attendance, evidence, or provider endorsements.
/// </summary>
public static class AssessmentSocialSeed
{
    private const string FictionalTitlePrefix = "Fictional showcase · ";
    private const string FictionalBodyDisclosure =
        "Fictional assessment story — no real person, attendance, or evidence is represented.";

    public static readonly IReadOnlyList<Guid> PostIds =
    [
        new("64000000-0000-4000-8000-000000000201"),
        new("64000000-0000-4000-8000-000000000202"),
        new("64000000-0000-4000-8000-000000000203"),
        new("64000000-0000-4000-8000-000000000204"),
        new("64000000-0000-4000-8000-000000000205"),
        new("64000000-0000-4000-8000-000000000206"),
        new("64000000-0000-4000-8000-000000000207"),
        new("64000000-0000-4000-8000-000000000208"),
        new("64000000-0000-4000-8000-000000000209"),
        new("64000000-0000-4000-8000-000000000210"),
        new("64000000-0000-4000-8000-000000000211"),
        new("64000000-0000-4000-8000-000000000212"),
        new("64000000-0000-4000-8000-000000000213"),
        new("64000000-0000-4000-8000-000000000214"),
        new("64000000-0000-4000-8000-000000000215"),
        new("64000000-0000-4000-8000-000000000216"),
        new("64000000-0000-4000-8000-000000000217"),
        new("64000000-0000-4000-8000-000000000218"),
        new("64000000-0000-4000-8000-000000000219"),
        new("64000000-0000-4000-8000-000000000220"),
    ];

    private static readonly IReadOnlyList<Guid> CommentIds =
        Enumerable.Range(301, 28)
            .Select(value => new Guid(
                $"64000000-0000-4000-8000-{value:D12}"))
            .ToArray();

    public static async Task SeedAsync(
        KiwimpactDbContext db,
        IReadOnlyList<AssessmentAccountSeedPersona> personas,
        DateTimeOffset? now = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(personas);
        if (personas.Count != 6)
        {
            throw new InvalidOperationException(
                "Assessment social seeding requires all six configured accounts.");
        }

        var seedNow = (now ?? DateTimeOffset.UtcNow).ToUniversalTime();
        var users = await LoadAuthorsAsync(db, personas, cancellationToken);
        var definitions = Definitions();
        var existingPosts = await db.SocialPosts
            .Where(post => PostIds.Contains(post.Id))
            .Include(post => post.Images)
            .Include(post => post.Tags)
            .ToDictionaryAsync(post => post.Id, cancellationToken);
        var missingPostIndexes = Enumerable.Range(0, definitions.Count)
            .Where(index => !existingPosts.ContainsKey(PostIds[index]))
            .ToHashSet();
        for (var index = 0; index < definitions.Count; index++)
        {
            if (existingPosts.TryGetValue(PostIds[index], out var existingPost) &&
                existingPost.AuthorUserId != users[definitions[index].AuthorIndex].Id)
            {
                throw new InvalidOperationException(
                    $"Assessment Post ID {existingPost.Id} is owned by another user.");
            }
        }
        var createdPostIndexes = new HashSet<int>();
        for (var index = 0; index < definitions.Count; index++)
        {
            var definition = definitions[index];
            var author = users[definition.AuthorIndex];
            var createdAt = PostCreatedAt(seedNow, index);
            var images = AssessmentDataSeed.CommunityStoryImagesForPost(index);
            if (existingPosts.TryGetValue(PostIds[index], out var existingPost))
            {
                // Deterministic showcase media is deployment content. Reconcile
                // it on restart while preserving reviewer edits to post copy,
                // tags, Quest relationship, visibility, and timestamps.
                existingPost.Update(
                    existingPost.QuestId,
                    existingPost.Title,
                    existingPost.Content,
                    images,
                    existingPost.Tags.Select(tag => tag.Name).ToArray(),
                    existingPost.UpdatedAt);
                continue;
            }

            var post = SocialPost.Create(
                author.Id,
                AssessmentDataSeed.QuestIds[definition.QuestIndex],
                $"{FictionalTitlePrefix}{definition.Title}",
                $"{FictionalBodyDisclosure}\n\n{definition.Content}",
                images,
                definition.Tags,
                isHidden: false,
                createdAt);
            post.Id = PostIds[index];
            foreach (var image in post.Images)
                image.PostId = post.Id;
            foreach (var tag in post.Tags)
                tag.PostId = post.Id;
            db.SocialPosts.Add(post);
            createdPostIndexes.Add(index);
        }

        await db.SaveChangesAsync(cancellationToken);
        await SeedInteractionsAsync(
            db,
            users,
            definitions,
            createdPostIndexes,
            seedNow,
            cancellationToken);
    }

    private static async Task<ApplicationUser[]> LoadAuthorsAsync(
        KiwimpactDbContext db,
        IReadOnlyList<AssessmentAccountSeedPersona> personas,
        CancellationToken cancellationToken)
    {
        var normalizedEmails = personas
            .Select(persona => persona.Email.Trim().ToUpperInvariant())
            .ToArray();
        var configuredByEmail = await db.Set<ApplicationUser>()
            .Where(user =>
                user.NormalizedEmail != null &&
                normalizedEmails.Contains(user.NormalizedEmail))
            .ToDictionaryAsync(
                user => user.NormalizedEmail!,
                cancellationToken);
        var supportingById = await db.Set<ApplicationUser>()
            .Where(user =>
                AssessmentActivitySeed.SupportingContributorIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);
        if (configuredByEmail.Count != personas.Count ||
            supportingById.Count != AssessmentActivitySeed.SupportingContributorIds.Count)
        {
            throw new InvalidOperationException(
                "Assessment social seeding requires all ten assessment identities.");
        }

        return personas
            .Select(persona => configuredByEmail[
                persona.Email.Trim().ToUpperInvariant()])
            .Concat(AssessmentActivitySeed.SupportingContributorIds
                .Select(id => supportingById[id]))
            .ToArray();
    }

    private static async Task SeedInteractionsAsync(
        KiwimpactDbContext db,
        IReadOnlyList<ApplicationUser> users,
        IReadOnlyList<AssessmentPostDefinition> definitions,
        IReadOnlySet<int> createdPostIndexes,
        DateTimeOffset seedNow,
        CancellationToken cancellationToken)
    {
        if (createdPostIndexes.Count == 0)
            return;

        var reservedComments = await db.SocialComments
            .AsNoTracking()
            .Where(comment => CommentIds.Contains(comment.Id))
            .Select(comment => comment.Id)
            .ToListAsync(cancellationToken);
        var requiredCommentIds = createdPostIndexes
            .Select(index => CommentIds[index])
            .Concat(createdPostIndexes
                .Where(index => index < ReplyBodies.Count)
                .Select(index => CommentIds[Definitions().Count + index]))
            .ToHashSet();
        if (reservedComments.Any(requiredCommentIds.Contains))
        {
            throw new InvalidOperationException(
                "An assessment comment ID is reserved by another row.");
        }

        foreach (var postIndex in createdPostIndexes.Order())
        {
            var definition = definitions[postIndex];
            var likeCount = 2 + postIndex % 5;
            for (var offset = 1; offset <= likeCount; offset++)
            {
                var liker = users[(definition.AuthorIndex + offset) % users.Count];
                db.SocialPostLikes.Add(SocialPostLike.Create(
                    PostIds[postIndex],
                    liker.Id,
                    PostCreatedAt(seedNow, postIndex).AddMinutes(10 + offset * 7)));
            }

            var rootComment = SocialComment.Create(
                PostIds[postIndex],
                users[(definition.AuthorIndex + 3) % users.Count].Id,
                parentCommentId: null,
                RootCommentBodies[postIndex],
                PostCreatedAt(seedNow, postIndex).AddMinutes(58));
            rootComment.Id = CommentIds[postIndex];
            db.SocialComments.Add(rootComment);

            if (postIndex < ReplyBodies.Count)
            {
                var reply = SocialComment.Create(
                    PostIds[postIndex],
                    users[definition.AuthorIndex].Id,
                    rootComment.Id,
                    ReplyBodies[postIndex],
                    PostCreatedAt(seedNow, postIndex).AddMinutes(82));
                reply.Id = CommentIds[definitions.Count + postIndex];
                db.SocialComments.Add(reply);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static DateTimeOffset PostCreatedAt(DateTimeOffset seedNow, int index) =>
        seedNow.AddHours(-(2 + index * 8));

    private static IReadOnlyList<AssessmentPostDefinition> Definitions() =>
    [
        new(
            0,
            10,
            "First field-day lesson: slow down and listen",
            "I went in expecting the binoculars to do all the work. The useful lesson was to stop talking, wait a full minute, and notice how many calls appear once the group settles. What helped you learn your first few bird calls?",
            ["Auckland", "bird-monitoring", "assessment-showcase"]),
        new(
            6,
            11,
            "The five-minute trap check that became a habit",
            "Putting the check beside my Sunday coffee reminder made it much easier to remember. I am still learning what to record, but the small routine finally feels manageable rather than like another big job.",
            ["Auckland", "backyard-action", "assessment-showcase"]),
        new(
            1,
            12,
            "A quiet team makes a long track feel short",
            "The best part of a maintenance morning is how naturally everyone falls into a rhythm: one person clears, another carries, someone else checks the next section. I arrived nervous and left with three names to remember for next time.",
            ["Wellington", "volunteering", "assessment-showcase"]),
        new(
            7,
            13,
            "What I pack for a community ranger morning",
            "Gloves, water, a pencil that works in drizzle, and one more warm layer than I think I need. Keeping the kit by the door removes most of the friction. Add your one essential item below—I am refining the list.",
            ["Wellington", "field-notes", "assessment-showcase"]),
        new(
            2,
            14,
            "One patch of weeds, one very good morning",
            "It was not a dramatic before-and-after, just a small patch with more breathing room around the natives. That scale felt surprisingly satisfying. The patient jobs are easier when someone beside you can explain what to leave alone.",
            ["Wellington", "restoration", "assessment-showcase"]),
        new(
            8,
            15,
            "Planting day: wet boots, warm welcome",
            "The weather turned halfway through, but nobody made the newcomer feel slow. A quick planting-depth check saved me from repeating the same mistake all morning. Practical kindness might be my favourite kind of community spirit.",
            ["Christchurch", "native-planting", "assessment-showcase"]),
        new(
            3,
            16,
            "Three things a first-time bird counter notices",
            "One: movement is often easier to spot than colour. Two: writing the time immediately matters. Three: experienced counters still say ‘not sure’. That last one made citizen science feel much more welcoming.",
            ["Christchurch", "citizen-science", "assessment-showcase"]),
        new(
            9,
            17,
            "The stream looked clear—then the test kit told the story",
            "I assumed clear water meant healthy water. Working through the measurements showed why observation needs a repeatable method, not just a quick glance. I would love a simple cheat sheet for remembering the order next time.",
            ["Christchurch", "water-quality", "assessment-showcase"]),
        new(
            4,
            18,
            "Tiny plants, big future shade",
            "The seedlings looked almost too small for the open site, but imagining the same place in ten years changed the whole morning. I labelled my photo with the species name so I can actually recognise it when I return.",
            ["Hamilton", "planting-day", "assessment-showcase"]),
        new(
            5,
            19,
            "A screen-free lunch walk through Kirikiriroa",
            "I chose one short trail and left the headphones in my bag. Twenty minutes was enough to notice the gully getting cooler, hear tūī overhead, and return to work with a much clearer head. Small nature breaks count too.",
            ["Hamilton", "nature-walk", "assessment-showcase"]),
        new(
            6,
            20,
            "The question that stopped everyone: who lives under this leaf?",
            "A simple insect search turned into the longest conversation of the session. The young explorers did not need a perfect answer—they needed time, a magnifier, and permission to be curious. I am borrowing that approach for my own walks.",
            ["Hamilton", "kids-in-nature", "assessment-showcase"]),
        new(
            0,
            21,
            "Dune planting taught me where not to step",
            "I had never noticed how one shortcut can cut through fragile dune plants. Learning to read the marked access paths made the planting work feel connected to every future beach visit, not just one volunteer session.",
            ["Tauranga", "coast-care", "assessment-showcase"]),
        new(
            7,
            22,
            "A two-bag clean-up and one useful surprise",
            "We separated what we collected instead of treating it as one pile. Seeing the mix made it obvious which items keep escaping nearby bins. Next time I want to record the top three types so the clean-up also produces a useful clue.",
            ["Tauranga", "litter-cleanup", "assessment-showcase"]),
        new(
            1,
            23,
            "My compost bin finally stopped smelling",
            "The fix was less dramatic than expected: more dry carbon, smaller scraps, and a proper mix. Sharing the failed first attempt because the troubleshooting was more useful than another photo of perfect compost.",
            ["Tauranga", "composting", "assessment-showcase"]),
        new(
            8,
            24,
            "New-volunteer nerves disappeared at the tool shed",
            "I nearly turned around in the car park because everyone else looked like they knew where to go. A clear welcome, a name tag, and one specific first job changed that in five minutes. If you are new too, arriving early really helps.",
            ["Dunedin", "first-time-volunteer", "assessment-showcase"]),
        new(
            2,
            25,
            "Small jobs make a wetland feel cared for",
            "Today was mostly clearing around young plants and checking guards. It was quiet, repetitive work—and exactly the kind that makes the next season possible. I am learning not to measure every contribution by how photogenic it looks.",
            ["Dunedin", "wetland-care", "assessment-showcase"]),
        new(
            9,
            26,
            "Helping habitat without getting in the way",
            "The strongest message was that wildlife space comes first. Staying with the assigned task, keeping distance, and following the local team matters more than getting a close photo. That boundary made the work feel more meaningful.",
            ["Dunedin", "wildlife-habitat", "assessment-showcase"]),
        new(
            3,
            27,
            "Our adopted corner is starting to look loved",
            "There is still plenty to do, but regular visits have changed how I see this little public space. I notice fresh litter sooner, recognise which plants are settling in, and say hello to neighbours who stop to ask what is happening.",
            ["Nelson", "adopt-a-spot", "assessment-showcase"]),
        new(
            4,
            28,
            "Backyard tracking: the print I could not identify",
            "The mark in the tracking tunnel did not match my first guess, so I saved the photo and asked instead of forcing an answer. That tiny uncertainty turned into a useful conversation about careful records. Any beginner-friendly identification tips?",
            ["Nelson", "backyard-trapping", "assessment-showcase"]),
        new(
            5,
            29,
            "The best part of planting was the tea afterwards",
            "The plants went in quickly; the conversations afterwards are what made me want to return. People swapped garden cuttings, bus-route tips, and the dates of the next working bee. Community grows in the gaps between the tasks too.",
            ["Palmerston-North", "green-corridors", "assessment-showcase"]),
    ];

    private static readonly IReadOnlyList<string> RootCommentBodies =
    [
        "Listening before looking changed bird walks for me too. I use one familiar call as an anchor.",
        "Pairing it with an existing habit is clever. Mine is the evening rubbish-bin check.",
        "This captures the welcome so well. Shared work makes conversation much easier.",
        "A kneeling pad is my unexpected essential—especially on damp mornings.",
        "Those modest before-and-after moments are the ones that keep me coming back.",
        "Planting depth caught me out on my first day too. Asking early saves so much rework.",
        "‘Not sure’ is a valid observation! Photos and notes can still make the record useful.",
        "A laminated order card would be brilliant. I always second-guess the middle steps.",
        "Please post the return photo when you recognise it again. That is such a good idea.",
        "Short local walks are underrated. Twenty minutes is much easier to repeat than a big plan.",
        "Curiosity without rushing to name everything is such a lovely way to learn.",
        "I notice those informal tracks everywhere now. Access choices really do add up.",
        "Recording the common items could help decide where prevention effort goes next.",
        "Thank you for sharing the messy version. More dry material fixed mine as well.",
        "This will help someone else make it through the car-park moment. Clear welcomes matter.",
        "Quiet maintenance rarely gets the spotlight, but healthy sites depend on it.",
        "Respectful distance is a contribution in itself. The habitat is not a backdrop.",
        "Regular care creates relationships as well as healthier spaces. Beautifully put.",
        "Posting an uncertain record is much more useful than guessing with confidence.",
        "The cup-of-tea debrief might be the most effective volunteer-retention tool we have.",
    ];

    private static readonly IReadOnlyList<string> ReplyBodies =
    [
        "I love the anchor-call idea. I am going to start with tūī and build from there.",
        "That is exactly the level of routine I was hoping for—small enough to keep.",
        "Yes! Having a task beside you takes the pressure off making conversation.",
        "Adding that to the kit list now. My knees will be grateful.",
        "Same here. The next visit will probably be more satisfying than the first photo.",
        "Absolutely. The team would rather answer one question than replant a whole row.",
        "That takes the pressure off. Good notes first, confident identification second.",
        "I might make one and share it here after the next session.",
    ];

    private sealed record AssessmentPostDefinition(
        int AuthorIndex,
        int QuestIndex,
        string Title,
        string Content,
        IReadOnlyList<string> Tags);
}
