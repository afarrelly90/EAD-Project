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

    [Fact]
    public async Task UpdateAsync_UpdatesExerciseAndReturnsDto()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(UpdateAsync_UpdatesExerciseAndReturnsDto));
        context.Exercises.Add(new Exercise
        {
            Title = "Old Title",
            Calories = 20,
            Difficulty = "Beginner",
            DurationMinutes = 4
        });
        await context.SaveChangesAsync();

        var service = new ExerciseService(context);
        var dto = new UpdateExerciseDto
        {
            Title = "New Title",
            Calories = 90,
            IsUpperBody = true,
            Difficulty = "Advanced",
            DurationMinutes = 18
        };

        var result = await service.UpdateAsync(1, dto);

        Assert.NotNull(result);
        Assert.Equal("New Title", result!.Title);
        Assert.True(result.IsUpperBody);
        Assert.Equal("Advanced", result.Difficulty);
    }

    [Fact]
    public async Task DeleteAsync_RemovesExercise_WhenItExists()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(DeleteAsync_RemovesExercise_WhenItExists));
        context.Exercises.Add(new Exercise
        {
            Title = "Burpees",
            Calories = 100,
            Difficulty = "Intermediate",
            DurationMinutes = 10
        });
        await context.SaveChangesAsync();

        var service = new ExerciseService(context);

        var result = await service.DeleteAsync(1);

        Assert.True(result);
        Assert.Empty(context.Exercises);
    }
}
