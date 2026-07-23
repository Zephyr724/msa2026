using Kiwimpact.Core.Enums;

namespace Kiwimpact.Core.Entities;

public sealed class Region
{
    public const int MaxNameLength = 200;

    internal Region()
    {
        Name = string.Empty;
    }

    public Guid Id { get; internal set; }
    public string Name { get; internal set; }
    public RegionType Type { get; internal set; }
    public Guid? ParentRegionId { get; internal set; }
    public bool IsActive { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    // Navigation properties
    public Region? ParentRegion { get; internal set; }
    public ICollection<Region> ChildRegions { get; internal set; } = new List<Region>();
    public ICollection<Quest> Quests { get; internal set; } = new List<Quest>();

    // ── Domain Validation ──────────────────────────────────────────

    /// <summary>
    /// Returns a list of validation errors for creating or updating a Region.
    /// Keep EF and Infrastructure dependencies out of Core.
    /// </summary>
    public static IReadOnlyList<string> Validate(
        string name,
        RegionType type,
        Guid? parentRegionId,
        Func<Guid, RegionType?>? getParentType)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("Region name must not be empty.");
        }
        else if (name.Trim().Length > MaxNameLength)
        {
            errors.Add($"Region name must be at most {MaxNameLength} characters.");
        }

        if (type == RegionType.Country && parentRegionId.HasValue)
        {
            errors.Add("A Country region must have no parent.");
        }

        if (type != RegionType.Country && !parentRegionId.HasValue)
        {
            errors.Add($"A {type} region must have a parent.");
        }

        if (parentRegionId.HasValue && getParentType is not null)
        {
            var parentType = getParentType(parentRegionId.Value);

            if (parentType is null)
            {
                errors.Add("Parent region not found.");
            }
            else
            {
                var valid = type switch
                {
                    RegionType.AdministrativeArea => parentType == RegionType.Country,
                    RegionType.LocalArea => parentType == RegionType.AdministrativeArea,
                    _ => true
                };

                if (!valid)
                {
                    errors.Add($"A {type} cannot have a parent of type {parentType}.");
                }

                if ((int)type <= (int)parentType)
                {
                    errors.Add($"Parent type {parentType} is not broader than child type {type}.");
                }
            }
        }

        return errors;
    }
}