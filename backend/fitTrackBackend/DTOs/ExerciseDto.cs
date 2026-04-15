namespace FitTrackApi.DTOs;

public class ExerciseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? VideoLink { get; set; }
    public string? ImageUrl { get; set; }
    public int Calories { get; set; }
    public bool IsCore { get; set; }
    public bool IsUpperBody { get; set; }
    public bool IsLowerBody { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string? Equipment { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
