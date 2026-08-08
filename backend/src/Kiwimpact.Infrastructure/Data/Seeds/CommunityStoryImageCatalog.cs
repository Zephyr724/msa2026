using Kiwimpact.Core.Entities;

namespace Kiwimpact.Infrastructure.Data.Seeds;

/// <summary>
/// Deployment-bundled Community media shared by assessment and Development
/// fixtures. The fixed HTTPS host satisfies the persisted social-media
/// contract; the frontend resolves it to the matching same-origin public path.
/// </summary>
internal static class CommunityStoryImageCatalog
{
    private const string LocalImageOrigin =
        "https://local.kiwimpact.invalid/images/community/";

    private static readonly IReadOnlyList<SocialPostImageDetails> Images =
    [
        Image("01-stream-planting-square.jpg", "Volunteers planting native seedlings beside an urban stream"),
        Image("02-beach-cleanup-landscape.jpg", "Volunteers collecting litter beside coastal dunes"),
        Image("03-wetland-notes-portrait.jpg", "A volunteer recording bird observations beside a wetland"),
        Image("04-recycling-workshop-near-square.jpg", "Neighbours sorting reusable and recyclable household items"),
        Image("05-water-quality-square.jpg", "Volunteers testing water quality in a forest stream"),
        Image("06-community-garden-landscape.jpg", "Neighbours harvesting vegetables in a community garden"),
        Image("07-track-maintenance-portrait.jpg", "A volunteer maintaining a muddy forest track"),
        Image("08-trap-check-near-square.jpg", "A volunteer checking a conservation trap in a leafy garden"),
        Image("09-home-compost-square.jpg", "Hands mixing dry leaves and food scraps in a compost bin"),
        Image("10-bikes-working-bee-landscape.jpg", "Volunteers arriving by bicycle for a planting working bee"),
        Image("11-wetland-guards-portrait.jpg", "Volunteers fitting guards around wetland seedlings"),
        Image("12-nature-walk-near-square.jpg", "Children and adults observing insects during a nature walk"),
        Image("13-native-seed-collecting-square.jpg", "Volunteers collecting native seeds for restoration planting"),
        Image("14-dune-guard-check-landscape.jpg", "Volunteers checking plant guards among coastal dunes"),
        Image("15-bird-box-portrait.jpg", "Volunteers installing a nesting box in an urban reserve"),
        Image("16-rain-garden-near-square.jpg", "Neighbours planting a rain garden beside a community building"),
        Image("17-stream-invertebrates-square.jpg", "Citizen scientists identifying stream invertebrates"),
        Image("18-youth-pollinator-plan-landscape.jpg", "A youth eco club planning a pollinator garden"),
        Image("19-tool-cleaning-portrait.jpg", "A volunteer cleaning shared planting tools"),
        Image("20-working-bee-tea-near-square.jpg", "Neighbours sharing tea after a conservation working bee"),
        Image("21-litter-audit-square.jpg", "Volunteers recording litter types after a park cleanup"),
        Image("22-invasive-vine-removal-landscape.jpg", "Volunteers removing an invasive vine from native shrubs"),
        Image("23-young-tree-care-portrait.jpg", "A volunteer checking mulch around a young street tree"),
        Image("24-reusable-event-near-square.jpg", "Organisers preparing reusable cups for a community event"),
    ];

    private static readonly IReadOnlyList<IReadOnlyList<int>> AssessmentPostImageIndexes =
    [
        [2],
        [7],
        [6, 18],
        [9],
        [21],
        [0, 10],
        [14],
        [4, 16],
        [22],
        [11],
        [17],
        [13],
        [1, 20],
        [8],
        [23],
        [12],
        [5],
        [15],
        [3],
        [19],
    ];

    public static IReadOnlyList<SocialPostImageDetails> All() => Images;

    public static IReadOnlyList<SocialPostImageDetails> ForAssessmentPost(int postIndex) =>
        AssessmentPostImageIndexes[postIndex]
            .Select(imageIndex => Images[imageIndex])
            .ToArray();

    private static SocialPostImageDetails Image(string fileName, string altText) =>
        new($"{LocalImageOrigin}{fileName}", altText);
}
