using System.ComponentModel.DataAnnotations;

namespace FitTrackApi.DTOs;

public class LoginDto
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; }

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string Password { get; set; }
}
