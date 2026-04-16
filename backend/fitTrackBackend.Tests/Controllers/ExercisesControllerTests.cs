using FitTrackApi.DTOs;
using FitTrackApi.Models;
using FitTrackApi.Services;
using fitTrack.Controllers;
using fitTrackBackend.Tests.TestHelpers;
using Microsoft.AspNetCore.Mvc;

namespace fitTrackBackend.Tests.Controllers;

public class ExercisesControllerTests
{
    [Fact]
    public async Task GetAll_ReturnsOkWithExercises()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(GetAll_ReturnsOkWithExercises));
        context.Exercises.Add(new Exercise
        {
            Title = "Crunches",
            Calories = 40,
            Difficulty = "Beginner",
            DurationMinutes = 8
        });
        await context.SaveChangesAsync();

        var controller = new ExercisesController(new ExerciseService(context));

        var result = await controller.GetAll();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var exercises = Assert.IsAssignableFrom<IEnumerable<ExerciseDto>>(okResult.Value);
        Assert.Single(exercises);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(GetById_ReturnsNotFound_WhenMissing));
        var controller = new ExercisesController(new ExerciseService(context));

        var result = await controller.GetById(22);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction_WithCreatedExercise()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Create_ReturnsCreatedAtAction_WithCreatedExercise));
        var controller = new ExercisesController(new ExerciseService(context));
        var dto = new CreateExerciseDto
        {
            Title = "Push-Ups",
            Calories = 70,
            IsUpperBody = true,
            Difficulty = "Intermediate",
            DurationMinutes = 12
        };

        var result = await controller.Create(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(ExercisesController.GetById), createdResult.ActionName);
        var exercise = Assert.IsType<ExerciseDto>(createdResult.Value);
        Assert.Equal("Push-Ups", exercise.Title);
        Assert.Equal(1, await context.Exercises.CountAsync());
    }

    [Fact]
    public async Task Update_ReturnsOkWithUpdatedExercise()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Update_ReturnsOkWithUpdatedExercise));
        context.Exercises.Add(new Exercise
        {
            Title = "Sit-Ups",
            Calories = 45,
            Difficulty = "Beginner",
            DurationMinutes = 8
        });
        await context.SaveChangesAsync();

        var controller = new ExercisesController(new ExerciseService(context));
        var dto = new UpdateExerciseDto
        {
            Title = "Sit-Ups Plus",
            Calories = 60,
            IsCore = true,
            Difficulty = "Intermediate",
            DurationMinutes = 10
        };

        var result = await controller.Update(1, dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var exercise = Assert.IsType<ExerciseDto>(okResult.Value);
        Assert.Equal("Sit-Ups Plus", exercise.Title);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenExerciseExists()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Delete_ReturnsNoContent_WhenExerciseExists));
        context.Exercises.Add(new Exercise
        {
            Title = "Lunges",
            Calories = 55,
            Difficulty = "Intermediate",
            DurationMinutes = 12
        });
        await context.SaveChangesAsync();

        var controller = new ExercisesController(new ExerciseService(context));

        var result = await controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
        Assert.Empty(context.Exercises);
    }
}
