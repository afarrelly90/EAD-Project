namespace FitTrackApi.DTOs;

public class UserProfileDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public double? Weight { get; set; }
    public string Language { get; set; } = "en";
    public string PreferredDifficulty { get; set; } = "Beginner";
    public string PreferredMuscleGroup { get; set; } = "Core";
    public int PreferredWorkoutMinutes { get; set; } = 20;
    public string? PreferredEquipment { get; set; }
    public int DefaultSets { get; set; } = 3;
    public int DefaultExerciseSeconds { get; set; } = 45;
    public int DefaultRestSeconds { get; set; } = 60;
}
