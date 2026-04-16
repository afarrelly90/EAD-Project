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
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Weight,
                user.Language
            }
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

        await _context.SaveChangesAsync();

        return Ok(MapProfile(user));
    }

    private static object MapProfile(User user)
    {
        return new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Weight,
            user.Language
        };
    }
}