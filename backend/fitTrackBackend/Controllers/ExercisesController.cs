using FitTrackApi.DTOs;
using FitTrackApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace fitTrack.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExercisesController : ControllerBase
{
    private readonly ExerciseService _exerciseService;

    public ExercisesController(ExerciseService exerciseService)
    {
        _exerciseService = exerciseService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExerciseDto>>> GetAll()
    {
        var exercises = await _exerciseService.GetAllAsync();
        return Ok(exercises);
    }

    [HttpGet("generate-workout")]
    public async Task<ActionResult<GeneratedWorkoutDto>> GenerateWorkout([FromQuery] GenerateWorkoutRequestDto request)
    {
        var workout = await _exerciseService.GenerateWorkoutAsync(request);
        if (workout == null)
        {
            return NotFound(new { message = "No exercises matched the selected workout criteria" });
        }

        return Ok(workout);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ExerciseDto>> GetById(int id)
    {
        var exercise = await _exerciseService.GetByIdAsync(id);
        if (exercise == null)
        {
            return NotFound(new { message = "Exercise not found" });
        }

        return Ok(exercise);
    }

    [HttpPost]
    public async Task<ActionResult<ExerciseDto>> Create(CreateExerciseDto dto)
    {
        var exercise = await _exerciseService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = exercise.Id }, exercise);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ExerciseDto>> Update(int id, UpdateExerciseDto dto)
    {
        var exercise = await _exerciseService.UpdateAsync(id, dto);
        if (exercise == null)
        {
            return NotFound(new { message = "Exercise not found" });
        }

        return Ok(exercise);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _exerciseService.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = "Exercise not found" });
        }

        return NoContent();
    }
}
