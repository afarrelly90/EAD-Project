namespace FitTrackApi.DTOs;

public class GeneratedWorkoutDto
{
    public string Title { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public string? Equipment { get; set; }
    public int TargetMinutes { get; set; }
    public int TotalMinutes { get; set; }
    public int TotalCalories { get; set; }
    public int PrescribedSets { get; set; }
    public int ExerciseSeconds { get; set; }
    public int RestSeconds { get; set; }
    public List<ExerciseDto> Exercises { get; set; } = [];
}
