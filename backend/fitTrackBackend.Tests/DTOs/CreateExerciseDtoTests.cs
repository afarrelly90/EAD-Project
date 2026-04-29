using System.ComponentModel.DataAnnotations;
using FitTrackApi.DTOs;

namespace fitTrackBackend.Tests.DTOs;

public class CreateExerciseDtoTests
{
    [Fact]
    public void Validate_ReturnsNoErrors_ForAValidDto()
    {
        var dto = CreateValidDto();

        var errors = Validate(dto);

        Assert.Empty(errors);
    }

    [Fact]
    public void Validate_ReturnsError_WhenTitleIsMissing()
    {
        var dto = CreateValidDto();
        dto.Title = string.Empty;

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.Title)));
    }

    [Fact]
    public void Validate_ReturnsError_WhenTitleExceedsMaxLength()
    {
        var dto = CreateValidDto();
        dto.Title = new string('A', 151);

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.Title)));
    }

    [Fact]
    public void Validate_ReturnsError_WhenDescriptionExceedsMaxLength()
    {
        var dto = CreateValidDto();
        dto.Description = new string('A', 1001);

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.Description)));
    }

    [Fact]
    public void Validate_ReturnsError_WhenVideoLinkIsNotAValidUrl()
    {
        var dto = CreateValidDto();
        dto.VideoLink = "not-a-url";

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.VideoLink)));
    }

    [Fact]
    public void Validate_ReturnsError_WhenImageUrlExceedsMaxLength()
    {
        var dto = CreateValidDto();
        dto.ImageUrl = $"https://example.com/{new string('a', 481)}";

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.ImageUrl)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2001)]
    public void Validate_ReturnsError_WhenCaloriesAreOutOfRange(int calories)
    {
        var dto = CreateValidDto();
        dto.Calories = calories;

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.Calories)));
    }

    [Fact]
    public void Validate_ReturnsError_WhenDifficultyIsInvalid()
    {
        var dto = CreateValidDto();
        dto.Difficulty = "Expert";

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.Difficulty)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(181)]
    public void Validate_ReturnsError_WhenDurationMinutesAreOutOfRange(int durationMinutes)
    {
        var dto = CreateValidDto();
        dto.DurationMinutes = durationMinutes;

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.DurationMinutes)));
    }

    [Fact]
    public void Validate_ReturnsError_WhenEquipmentIsNotAllowed()
    {
        var dto = CreateValidDto();
        dto.Equipment = "Barbell";

        var errors = Validate(dto);

        Assert.Contains(errors, error => error.MemberNames.Contains(nameof(CreateExerciseDto.Equipment)));
    }

    private static CreateExerciseDto CreateValidDto()
    {
        return new CreateExerciseDto
        {
            Title = "Push-Ups",
            Description = "Upper body exercise",
            VideoLink = "https://example.com/video",
            ImageUrl = "https://example.com/image.jpg",
            Calories = 100,
            IsCore = false,
            IsUpperBody = true,
            IsLowerBody = false,
            Difficulty = "Intermediate",
            DurationMinutes = 15,
            Equipment = "Dumbbell"
        };
    }

    private static List<ValidationResult> Validate(CreateExerciseDto dto)
    {
        var validationResults = new List<ValidationResult>();

        Validator.TryValidateObject(
            dto,
            new ValidationContext(dto),
            validationResults,
            validateAllProperties: true);

        return validationResults;
    }
}
