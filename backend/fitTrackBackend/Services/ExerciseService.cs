using FitTrackApi.Data;
using FitTrackApi.DTOs;
using FitTrackApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FitTrackApi.Services;

public class ExerciseService
{
    private readonly AppDbContext _context;

    public ExerciseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExerciseDto>> GetAllAsync()
    {
        return await _context.Exercises
            .OrderBy(x => x.Title)
            .Select(x => MapToDto(x))
            .ToListAsync();
    }

    public async Task<ExerciseDto?> GetByIdAsync(int id)
    {
        return await _context.Exercises
            .Where(x => x.Id == id)
            .Select(x => MapToDto(x))
            .FirstOrDefaultAsync();
    }

    public async Task<ExerciseDto> CreateAsync(CreateExerciseDto dto)
    {
        var exercise = new Exercise
        {
            Title = dto.Title,
            Description = dto.Description,
            VideoLink = dto.VideoLink,
            ImageUrl = dto.ImageUrl,
            Calories = dto.Calories,
            IsCore = dto.IsCore,
            IsUpperBody = dto.IsUpperBody,
            IsLowerBody = dto.IsLowerBody,
            Difficulty = dto.Difficulty,
            DurationMinutes = dto.DurationMinutes,
            Equipment = dto.Equipment
        };

        _context.Exercises.Add(exercise);
        await _context.SaveChangesAsync();

        return MapToDto(exercise);
    }

    private static ExerciseDto MapToDto(Exercise exercise)
    {
        return new ExerciseDto
        {
            Id = exercise.Id,
            Title = exercise.Title,
            Description = exercise.Description,
            VideoLink = exercise.VideoLink,
            ImageUrl = exercise.ImageUrl,
            Calories = exercise.Calories,
            IsCore = exercise.IsCore,
            IsUpperBody = exercise.IsUpperBody,
            IsLowerBody = exercise.IsLowerBody,
            Difficulty = exercise.Difficulty,
            DurationMinutes = exercise.DurationMinutes,
            Equipment = exercise.Equipment,
            CreatedAtUtc = exercise.CreatedAtUtc
        };
    }
}
