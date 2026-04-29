using System.ComponentModel.DataAnnotations;

namespace FitTrackApi.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    public string FullName { get; set; }

    [Required]
    public string Email { get; set; }

    [Required]
    public string PasswordHash { get; set; }

    public double? Weight { get; set; }

    [Required]
    public string Language { get; set; }

    [Required]
    [MaxLength(50)]
    public string PreferredDifficulty { get; set; } = "Beginner";

    [Required]
    [MaxLength(50)]
    public string PreferredMuscleGroup { get; set; } = "Core";

    [Range(5, 180)]
    public int PreferredWorkoutMinutes { get; set; } = 20;

    [MaxLength(150)]
    public string? PreferredEquipment { get; set; }

    [Range(1, 10)]
    public int DefaultSets { get; set; } = 3;

    [Range(5, 3600)]
    public int DefaultExerciseSeconds { get; set; } = 45;

    [Range(5, 600)]
    public int DefaultRestSeconds { get; set; } = 60;
}
