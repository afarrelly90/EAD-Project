using FitTrackApi.DTOs;
using FitTrackApi.Models;
using FitTrackApi.Services;
using fitTrackBackend.Tests.TestHelpers;

namespace fitTrackBackend.Tests.Services;

public class ExerciseServiceTests
{
    [Fact]
    public async Task GetAllAsync_ReturnsExercisesOrderedByTitle()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(GetAllAsync_ReturnsExercisesOrderedByTitle));
        context.Exercises.AddRange(
            new Exercise { Title = "Squats", Calories = 80, Difficulty = "Beginner", DurationMinutes = 10 },
            new Exercise { Title = "Crunches", Calories = 40, Difficulty = "Beginner", DurationMinutes = 8 });
        await context.SaveChangesAsync();

        var service = new ExerciseService(context);

        var result = await service.GetAllAsync();

        Assert.Equal(new[] { "Crunches", "Squats" }, result.Select(x => x.Title).ToArray());
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenExerciseDoesNotExist()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(GetByIdAsync_ReturnsNull_WhenExerciseDoesNotExist));
        var service = new ExerciseService(context);

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_SavesExerciseAndReturnsDto()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(CreateAsync_SavesExerciseAndReturnsDto));
        var service = new ExerciseService(context);
        var dto = new CreateExerciseDto
        {
            Title = "Plank",
            Description = "Core stability hold",
            VideoLink = "https://example.com/plank",
            ImageUrl = "https://example.com/plank.jpg",
            Calories = 50,
            IsCore = true,
            Difficulty = "Beginner",
            DurationMinutes = 5,
            Equipment = "Mat"
        };

        var result = await service.CreateAsync(dto);

        Assert.NotEqual(0, result.Id);
        Assert.Equal("Plank", result.Title);
        Assert.Equal("Core stability hold", result.Description);
        Assert.Equal("Mat", result.Equipment);
        Assert.True(result.IsCore);
        Assert.Single(context.Exercises);
    }
}
