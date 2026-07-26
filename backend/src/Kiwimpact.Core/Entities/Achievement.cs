namespace Kiwimpact.Core.Entities;

/// <summary>
/// One row of the achievement catalog. Content comes only from the approved
/// deterministic seed (<c>AchievementSeed</c>); rows are never written by any
/// runtime award path. Identity fields (<see cref="Id"/>, <see cref="Code"/>,
/// <see cref="Category"/>) are immutable after seeding; the seed may update
/// only the product-visible display fields.
/// </summary>
public sealed class Achievement
{
    public const int MaxCodeLength = 100;
    public const int MaxNameLength = 200;
    public const int MaxDescriptionLength = 500;
    public const int MaxIconUrlLength = 2000;
    public const int MaxCategoryLength = 50;

    internal Achievement()
    {
        Code = string.Empty;
        Name = string.Empty;
        Description = string.Empty;
        Category = string.Empty;
    }

    public Guid Id { get; internal set; }
    public string Code { get; internal set; }
    public string Name { get; internal set; }
    public string Description { get; internal set; }
    public string? IconUrl { get; internal set; }
    public string Category { get; internal set; }
    public bool IsActive { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }

    public static Achievement Create(
        Guid id,
        string code,
        string name,
        string description,
        string? iconUrl,
        string category,
        bool isActive,
        DateTimeOffset now)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("An achievement ID is required.", nameof(id));
        ValidateDisplayFields(name, description, iconUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        ArgumentException.ThrowIfNullOrWhiteSpace(category);
        if (code.Length > MaxCodeLength)
            throw new ArgumentOutOfRangeException(
                nameof(code), $"Code must be at most {MaxCodeLength} characters.");
        if (category.Length > MaxCategoryLength)
            throw new ArgumentOutOfRangeException(
                nameof(category), $"Category must be at most {MaxCategoryLength} characters.");

        return new Achievement
        {
            Id = id,
            Code = code,
            Name = name,
            Description = description,
            IconUrl = iconUrl,
            Category = category,
            IsActive = isActive,
            CreatedAt = now.ToUniversalTime(),
        };
    }

    /// <summary>
    /// Seed-only deterministic display upsert. Identity fields
    /// (<see cref="Id"/>, <see cref="Code"/>, <see cref="Category"/>) and
    /// <see cref="IsActive"/> are never changed here.
    /// </summary>
    public void UpdateDisplayFields(string name, string description, string? iconUrl)
    {
        ValidateDisplayFields(name, description, iconUrl);
        Name = name;
        Description = description;
        IconUrl = iconUrl;
    }

    private static void ValidateDisplayFields(
        string name,
        string description,
        string? iconUrl)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        if (name.Length > MaxNameLength)
            throw new ArgumentOutOfRangeException(
                nameof(name), $"Name must be at most {MaxNameLength} characters.");
        if (description.Length > MaxDescriptionLength)
            throw new ArgumentOutOfRangeException(
                nameof(description),
                $"Description must be at most {MaxDescriptionLength} characters.");
        if (iconUrl is not null && iconUrl.Length > MaxIconUrlLength)
            throw new ArgumentOutOfRangeException(
                nameof(iconUrl), $"Icon URL must be at most {MaxIconUrlLength} characters.");
    }
}
