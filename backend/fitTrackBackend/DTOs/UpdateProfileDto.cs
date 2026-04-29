using System.ComponentModel.DataAnnotations;

namespace FitTrackApi.DTOs;

public class UpdateProfileDto
{
    [Range(20, 400)]
    public double? Weight { get; set; }

    [Required]
    [RegularExpression("^(en|it)$")]
    public string Language { get; set; } = "en";

    [Required]
    [RegularExpression("^(Beginner|Intermediate|Advanced)$")]
    public string PreferredDifficulty { get; set; } = "Beginner";

    [Required]
    [RegularExpression("^(Core|Upper|Lower|Other)$")]
    public string PreferredMuscleGroup { get; set; } = "Core";

    [Range(5, 180)]
    public int PreferredWorkoutMinutes { get; set; } = 20;

    [RegularExpression("^(Mat|Dumbbell|Resistance Band|Kettlebell|Bench)$")]
    public string? PreferredEquipment { get; set; }

    [Range(1, 10)]
    public int DefaultSets { get; set; } = 3;

    [Range(5, 3600)]
    public int DefaultExerciseSeconds { get; set; } = 45;

    [Range(5, 600)]
    public int DefaultRestSeconds { get; set; } = 60;
}
