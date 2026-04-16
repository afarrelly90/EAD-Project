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
}