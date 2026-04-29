using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using FitTrackApi.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace FitTrackApi.Services;

public class TokenService
{
    private const string DevelopmentFallbackKey = "THIS_IS_A_SUPER_SECRET_KEY_12345";
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;

    public TokenService(IConfiguration configuration, IHostEnvironment environment)
    {
        _configuration = configuration;
        _environment = environment;
    }

    public string CreateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var secret = ResolveSigningKey();
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secret));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var now = DateTime.UtcNow;

        var token = new JwtSecurityToken(
            claims: claims,
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            notBefore: now,
            expires: now.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string ResolveSigningKey()
    {
        var configuredKey = _configuration["Jwt:Key"];

        if (!string.IsNullOrWhiteSpace(configuredKey))
        {
            return configuredKey;
        }

        if (_environment.IsDevelopment())
        {
            return DevelopmentFallbackKey;
        }

        throw new InvalidOperationException("JWT signing key is not configured.");
    }
}
