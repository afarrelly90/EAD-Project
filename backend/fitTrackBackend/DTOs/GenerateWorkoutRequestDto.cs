using System.ComponentModel.DataAnnotations;

namespace FitTrackApi.DTOs;

public class GenerateWorkoutRequestDto
{
    public int? UserId { get; set; }

    [MaxLength(50)]
    public string? Difficulty { get; set; }

    [MaxLength(50)]
    public string? MuscleGroup { get; set; }

    [MaxLength(150)]
    public string? Equipment { get; set; }

    [Range(5, 180)]
    public int? TargetMinutes { get; set; }

    [Range(1, 8)]
    public int? MaxExercises { get; set; }
}
