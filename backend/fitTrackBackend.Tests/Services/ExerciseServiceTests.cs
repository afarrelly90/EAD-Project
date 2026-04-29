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

    [Fact]
    public async Task GenerateWorkoutAsync_UsesUserPreferences_WhenRequestDoesNotOverrideThem()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(GenerateWorkoutAsync_UsesUserPreferences_WhenRequestDoesNotOverrideThem));
        context.Users.Add(new User
        {
            FullName = "Planner User",
            Email = "planner@test.com",
            PasswordHash = "hash",
            Language = "en",
            PreferredDifficulty = "Beginner",
            PreferredMuscleGroup = "Lower",
            PreferredWorkoutMinutes = 25,
            PreferredEquipment = "Bench",
            DefaultSets = 5,
            DefaultExerciseSeconds = 35,
            DefaultRestSeconds = 45
        });
        context.Exercises.AddRange(
            new Exercise
            {
                Title = "Bench Step-Up",
                Calories = 60,
                IsLowerBody = true,
                Difficulty = "Beginner",
                DurationMinutes = 12,
                Equipment = "Bench"
            },
            new Exercise
            {
                Title = "Bench Split Squat",
                Calories = 70,
                IsLowerBody = true,
                Difficulty = "Beginner",
                DurationMinutes = 14,
                Equipment = "Bench"
            });
        await context.SaveChangesAsync();

        var service = new ExerciseService(context);

        var workout = await service.GenerateWorkoutAsync(new GenerateWorkoutRequestDto
        {
            UserId = 1
        });

        Assert.NotNull(workout);
        Assert.Equal("Beginner", workout!.Difficulty);
        Assert.Equal("Lower", workout.MuscleGroup);
        Assert.Equal(25, workout.TargetMinutes);
        Assert.Equal(5, workout.PrescribedSets);
        Assert.Equal(35, workout.ExerciseSeconds);
        Assert.Equal(45, workout.RestSeconds);
        Assert.All(workout.Exercises, x => Assert.Equal("Bench", x.Equipment));
    }
}
