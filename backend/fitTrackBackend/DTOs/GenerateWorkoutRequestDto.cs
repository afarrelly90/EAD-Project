using System.ComponentModel.DataAnnotations;

namespace FitTrackApi.DTOs;

public class GenerateWorkoutRequestDto
{
    public int? UserId { get; set; }

    [RegularExpression("^(Beginner|Intermediate|Advanced)$")]
    public string? Difficulty { get; set; }

    [RegularExpression("^(Core|Upper|Lower|Other)$")]
    public string? MuscleGroup { get; set; }

    [RegularExpression("^(None|Mat|Dumbbell|Resistance Band|Kettlebell|Bench)$")]
    public string? Equipment { get; set; }

    [Range(5, 180)]
    public int? TargetMinutes { get; set; }

    [Range(1, 8)]
    public int? MaxExercises { get; set; }
}
