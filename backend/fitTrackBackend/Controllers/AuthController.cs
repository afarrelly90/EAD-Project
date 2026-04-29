using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FitTrackApi.Data;
using FitTrackApi.DTOs;
using FitTrackApi.Models;
using FitTrackApi.Services;

namespace fitTrack.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(x => x.Email == dto.Email))
            return BadRequest("Email already exists");

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Language = dto.Language ?? "en",
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == dto.Email);

        if (user == null ||
            !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid credentials");
        }

        var token = _tokenService.CreateToken(user);

        return Ok(new
        {
            token,
            user = MapProfile(user)
        });
    }

    [HttpGet("profile/{id:int}")]
    public async Task<IActionResult> GetProfile(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(MapProfile(user));
    }

    [HttpPut("profile/{id:int}")]
    public async Task<IActionResult> UpdateProfile(int id, UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        user.Weight = dto.Weight;
        user.Language = string.IsNullOrWhiteSpace(dto.Language) ? "en" : dto.Language;
        user.PreferredDifficulty = NormalizeDifficulty(dto.PreferredDifficulty);
        user.PreferredMuscleGroup = NormalizeMuscleGroup(dto.PreferredMuscleGroup);
        user.PreferredWorkoutMinutes = Math.Clamp(dto.PreferredWorkoutMinutes, 5, 180);
        user.PreferredEquipment = NormalizeEquipment(dto.PreferredEquipment);
        user.DefaultSets = Math.Clamp(dto.DefaultSets, 1, 10);
        user.DefaultExerciseSeconds = Math.Clamp(dto.DefaultExerciseSeconds, 5, 3600);
        user.DefaultRestSeconds = Math.Clamp(dto.DefaultRestSeconds, 5, 600);

        await _context.SaveChangesAsync();

        return Ok(MapProfile(user));
    }

    private static UserProfileDto MapProfile(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Weight = user.Weight,
            Language = user.Language,
            PreferredDifficulty = NormalizeDifficulty(user.PreferredDifficulty),
            PreferredMuscleGroup = NormalizeMuscleGroup(user.PreferredMuscleGroup),
            PreferredWorkoutMinutes = user.PreferredWorkoutMinutes <= 0 ? 20 : user.PreferredWorkoutMinutes,
            PreferredEquipment = NormalizeEquipment(user.PreferredEquipment),
            DefaultSets = user.DefaultSets <= 0 ? 3 : user.DefaultSets,
            DefaultExerciseSeconds = user.DefaultExerciseSeconds <= 0 ? 45 : user.DefaultExerciseSeconds,
            DefaultRestSeconds = user.DefaultRestSeconds <= 0 ? 60 : user.DefaultRestSeconds
        };
    }

    private static string NormalizeDifficulty(string? difficulty)
    {
        return difficulty?.Trim().ToLowerInvariant() switch
        {
            "advanced" => "Advanced",
            "intermediate" => "Intermediate",
            _ => "Beginner"
        };
    }

    private static string NormalizeMuscleGroup(string? muscleGroup)
    {
        return muscleGroup?.Trim().ToLowerInvariant() switch
        {
            "upper" => "Upper",
            "lower" => "Lower",
            "other" => "Other",
            _ => "Core"
        };
    }

    private static string? NormalizeEquipment(string? equipment)
    {
        if (string.IsNullOrWhiteSpace(equipment))
        {
            return null;
        }

        return equipment.Trim().ToLowerInvariant() switch
        {
            "none" => null,
            _ => equipment.Trim()
        };
    }
}
