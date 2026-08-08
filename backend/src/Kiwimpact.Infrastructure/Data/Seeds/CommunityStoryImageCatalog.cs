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
        Image("01-stream-planting-square.jpg", "Two volunteers planting young trees in an open green space"),
        Image("02-beach-cleanup-landscape.jpg", "A group of volunteers collecting rubbish beside the water"),
        Image("03-wetland-notes-portrait.jpg", "Water birds among reeds in a wetland habitat"),
        Image("04-recycling-workshop-near-square.jpg", "Volunteers sorting plastic, paper, and glass for recycling"),
        Image("05-water-quality-square.jpg", "A field researcher assessing water quality outdoors"),
        Image("06-community-garden-landscape.jpg", "A group planting a young tree together"),
        Image("07-track-maintenance-portrait.jpg", "A group walking together along a forest track"),
        Image("08-trap-check-near-square.jpg", "A person observing a natural area beside a conservation fence"),
        Image("09-home-compost-square.jpg", "A person collecting kitchen scraps for composting"),
        Image("10-bikes-working-bee-landscape.jpg", "Young volunteers working together in a green public space"),
        Image("11-wetland-guards-portrait.jpg", "Volunteers planting on a sandy restoration site"),
        Image("12-nature-walk-near-square.jpg", "Two people exploring a forest with a map and binoculars"),
        Image("13-native-seed-collecting-square.jpg", "Several people holding young green plants together"),
        Image("14-dune-guard-check-landscape.jpg", "Coastal grasses growing across a sandy dune habitat"),
        Image("15-bird-box-portrait.jpg", "A volunteer using binoculars to observe wildlife"),
        Image("16-rain-garden-near-square.jpg", "A volunteer supporting a newly planted tree"),
        Image("17-stream-invertebrates-square.jpg", "Reeds and native habitat in a wetland landscape"),
        Image("18-youth-pollinator-plan-landscape.jpg", "Two volunteers navigating a forest with a map and binoculars"),
        Image("19-tool-cleaning-portrait.jpg", "A conservation volunteer resting outdoors after fieldwork"),
        Image("20-working-bee-tea-near-square.jpg", "A volunteer sorting reusable and recyclable household items"),
        Image("21-litter-audit-square.jpg", "A person sorting recyclable materials into a large sack"),
        Image("22-invasive-vine-removal-landscape.jpg", "A volunteer collecting litter in a green public space"),
        Image("23-young-tree-care-portrait.jpg", "A person using binoculars to observe an open natural area"),
        Image("24-reusable-event-near-square.jpg", "A person organising reusable materials at an outdoor market"),
    ];

    private static readonly IReadOnlyList<IReadOnlyList<int>> AssessmentPostImageIndexes =
    [
        [14],
        [15],
        [6, 18],
        [17],
        [22],
        [0],
        [2],
        [4],
        [5],
        [11],
        [9],
        [13],
        [1, 3],
        [8],
        [19, 23],
        [10],
        [16],
        [20, 21],
        [7],
        [12],
    ];

    public static IReadOnlyList<SocialPostImageDetails> All() => Images;

    public static IReadOnlyList<SocialPostImageDetails> ForAssessmentPost(int postIndex) =>
        AssessmentPostImageIndexes[postIndex]
            .Select(imageIndex => Images[imageIndex])
            .ToArray();

    private static SocialPostImageDetails Image(string fileName, string altText) =>
        new($"{LocalImageOrigin}{fileName}", altText);
}
