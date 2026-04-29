using System.ComponentModel.DataAnnotations;

namespace FitTrackApi.DTOs;

public class RegisterDto
{
    [Required]
    [MinLength(2)]
    [MaxLength(100)]
    public string FullName { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; }

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string Password { get; set; }

    [RegularExpression("^(en|it)$")]
    public string Language { get; set; }
}
