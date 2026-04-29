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

    public async Task<GeneratedWorkoutDto?> GenerateWorkoutAsync(GenerateWorkoutRequestDto request)
    {
        var user = request.UserId.HasValue
            ? await _context.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.UserId.Value)
            : null;

        var difficulty = ResolveDifficulty(request.Difficulty, user?.PreferredDifficulty);
        var muscleGroup = ResolveMuscleGroup(request.MuscleGroup, user?.PreferredMuscleGroup);
        var equipment = ResolveEquipment(request.Equipment, user?.PreferredEquipment);
        var targetMinutes = Math.Clamp(request.TargetMinutes ?? user?.PreferredWorkoutMinutes ?? 20, 5, 180);
        var maxExercises = Math.Clamp(request.MaxExercises ?? 6, 1, 8);
        var prescribedSets = Math.Clamp(user?.DefaultSets ?? 3, 1, 10);
        var exerciseSeconds = Math.Clamp(user?.DefaultExerciseSeconds ?? 45, 5, 3600);
        var restSeconds = Math.Clamp(user?.DefaultRestSeconds ?? 60, 5, 600);

        var minimumCandidateCount = DetermineMinimumCandidateCount(targetMinutes, maxExercises);
        var candidates = await FindCandidatesAsync(
            difficulty,
            muscleGroup,
            equipment,
            minimumCandidateCount);

        var selectedExercises = BuildWorkoutPlan(candidates, targetMinutes, maxExercises);
        if (selectedExercises.Count == 0)
        {
            return null;
        }

        return new GeneratedWorkoutDto
        {
            Title = BuildWorkoutTitle(muscleGroup, difficulty),
            Difficulty = difficulty,
            MuscleGroup = muscleGroup,
            Equipment = equipment,
            TargetMinutes = targetMinutes,
            TotalMinutes = selectedExercises.Sum(x => x.DurationMinutes),
            TotalCalories = selectedExercises.Sum(x => x.Calories),
            PrescribedSets = prescribedSets,
            ExerciseSeconds = exerciseSeconds,
            RestSeconds = restSeconds,
            Exercises = selectedExercises
        };
    }

    private async Task<List<ExerciseDto>> FindCandidatesAsync(
        string difficulty,
        string muscleGroup,
        string? equipment,
        int minimumCandidateCount)
    {
        var filterAttempts = new (string? Difficulty, string? MuscleGroup, string? Equipment)[]
        {
            (difficulty, muscleGroup, equipment),
            (difficulty, muscleGroup, null),
            (difficulty, null, equipment),
            (null, muscleGroup, equipment),
            (difficulty, null, null),
            (null, muscleGroup, null),
            (null, null, equipment),
            (null, null, null),
        };

        List<ExerciseDto> bestCandidates = [];

        foreach (var filterAttempt in filterAttempts)
        {
            var candidates = await BuildCandidateQuery(
                filterAttempt.Difficulty,
                filterAttempt.MuscleGroup,
                filterAttempt.Equipment).ToListAsync();

            if (candidates.Count > bestCandidates.Count)
            {
                bestCandidates = candidates;
            }

            if (candidates.Count >= minimumCandidateCount)
            {
                return candidates;
            }
        }

        return bestCandidates;
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

    public async Task<ExerciseDto?> UpdateAsync(int id, UpdateExerciseDto dto)
    {
        var exercise = await _context.Exercises.FirstOrDefaultAsync(x => x.Id == id);
        if (exercise == null)
        {
            return null;
        }

        exercise.Title = dto.Title;
        exercise.Description = dto.Description;
        exercise.VideoLink = dto.VideoLink;
        exercise.ImageUrl = dto.ImageUrl;
        exercise.Calories = dto.Calories;
        exercise.IsCore = dto.IsCore;
        exercise.IsUpperBody = dto.IsUpperBody;
        exercise.IsLowerBody = dto.IsLowerBody;
        exercise.Difficulty = dto.Difficulty;
        exercise.DurationMinutes = dto.DurationMinutes;
        exercise.Equipment = dto.Equipment;

        await _context.SaveChangesAsync();

        return MapToDto(exercise);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var exercise = await _context.Exercises.FirstOrDefaultAsync(x => x.Id == id);
        if (exercise == null)
        {
            return false;
        }

        _context.Exercises.Remove(exercise);
        await _context.SaveChangesAsync();

        return true;
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

    private IQueryable<ExerciseDto> BuildCandidateQuery(
        string? difficulty,
        string? muscleGroup,
        string? equipment)
    {
        var query = _context.Exercises.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(difficulty))
        {
            var normalizedDifficulty = difficulty.ToLowerInvariant();
            query = query.Where(x => x.Difficulty.ToLower() == normalizedDifficulty);
        }

        query = muscleGroup?.ToLowerInvariant() switch
        {
            "upper" => query.Where(x => x.IsUpperBody),
            "lower" => query.Where(x => x.IsLowerBody),
            "other" => query.Where(x => !x.IsUpperBody && !x.IsLowerBody && !x.IsCore),
            "core" => query.Where(x => x.IsCore),
            _ => query
        };

        if (!string.IsNullOrWhiteSpace(equipment))
        {
            var normalizedEquipment = equipment.ToLowerInvariant();
            query = query.Where(x => (x.Equipment ?? string.Empty).ToLower() == normalizedEquipment);
        }

        return query
            .OrderBy(x => x.DurationMinutes)
            .ThenByDescending(x => x.Calories)
            .ThenBy(x => x.Title)
            .Select(x => MapToDto(x));
    }

    private static List<ExerciseDto> BuildWorkoutPlan(
        List<ExerciseDto> candidates,
        int targetMinutes,
        int maxExercises)
    {
        if (candidates.Count == 0)
        {
            return [];
        }

        var selected = new List<ExerciseDto>();
        var available = new List<ExerciseDto>(candidates);

        while (available.Count > 0 && selected.Count < maxExercises)
        {
            var currentTotal = selected.Sum(x => x.DurationMinutes);
            var remainingMinutes = Math.Max(targetMinutes - currentTotal, 0);

            var nextExercise = available
                .OrderBy(x => ScoreCandidate(x, remainingMinutes))
                .ThenByDescending(x => x.Calories)
                .ThenBy(x => x.Title)
                .First();

            selected.Add(nextExercise);
            available.RemoveAll(x => x.Id == nextExercise.Id);

            if (selected.Sum(x => x.DurationMinutes) >= targetMinutes)
            {
                break;
            }
        }

        return selected;
    }

    private static int ScoreCandidate(ExerciseDto exercise, int remainingMinutes)
    {
        if (remainingMinutes <= 0)
        {
            return exercise.DurationMinutes;
        }

        return Math.Abs(remainingMinutes - exercise.DurationMinutes);
    }

    private static int DetermineMinimumCandidateCount(int targetMinutes, int maxExercises)
    {
        if (maxExercises <= 1)
        {
            return 1;
        }

        if (targetMinutes <= 10)
        {
            return 1;
        }

        return Math.Min(maxExercises, 3);
    }

    private static string ResolveDifficulty(string? difficulty, string? fallbackDifficulty)
    {
        return difficulty?.Trim().ToLowerInvariant() switch
        {
            "advanced" => "Advanced",
            "intermediate" => "Intermediate",
            "beginner" => "Beginner",
            _ => fallbackDifficulty?.Trim().ToLowerInvariant() switch
            {
                "advanced" => "Advanced",
                "intermediate" => "Intermediate",
                _ => "Beginner"
            }
        };
    }

    private static string ResolveMuscleGroup(string? muscleGroup, string? fallbackMuscleGroup)
    {
        return muscleGroup?.Trim().ToLowerInvariant() switch
        {
            "upper" => "Upper",
            "lower" => "Lower",
            "other" => "Other",
            "core" => "Core",
            _ => fallbackMuscleGroup?.Trim().ToLowerInvariant() switch
            {
                "upper" => "Upper",
                "lower" => "Lower",
                "other" => "Other",
                _ => "Core"
            }
        };
    }

    private static string? ResolveEquipment(string? equipment, string? fallbackEquipment)
    {
        var resolvedValue = string.IsNullOrWhiteSpace(equipment) ? fallbackEquipment : equipment;
        if (string.IsNullOrWhiteSpace(resolvedValue))
        {
            return null;
        }

        return resolvedValue.Trim().ToLowerInvariant() switch
        {
            "none" => null,
            _ => resolvedValue.Trim()
        };
    }

    private static string BuildWorkoutTitle(string muscleGroup, string difficulty)
    {
        return $"{muscleGroup} {difficulty} Workout";
    }
}
