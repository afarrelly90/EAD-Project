using System.ComponentModel.DataAnnotations;

namespace FitTrackApi.DTOs;

public class UpdateExerciseDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Url]
    [MaxLength(500)]
    public string? VideoLink { get; set; }

    [Url]
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Range(0, 5000)]
    public int Calories { get; set; }

    public bool IsCore { get; set; }

    public bool IsUpperBody { get; set; }

    public bool IsLowerBody { get; set; }

    [MaxLength(50)]
    public string Difficulty { get; set; } = "Beginner";

    [Range(1, 300)]
    public int DurationMinutes { get; set; } = 10;

    [MaxLength(150)]
    public string? Equipment { get; set; }
}