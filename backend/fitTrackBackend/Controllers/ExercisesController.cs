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
}
