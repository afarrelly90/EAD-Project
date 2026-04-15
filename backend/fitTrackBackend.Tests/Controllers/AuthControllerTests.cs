using FitTrackApi.Data;
using FitTrackApi.DTOs;
using FitTrackApi.Models;
using FitTrackApi.Services;
using fitTrack.Controllers;
using fitTrackBackend.Tests.TestHelpers;
using Microsoft.AspNetCore.Mvc;

namespace fitTrackBackend.Tests.Controllers;

public class AuthControllerTests
{
    [Fact]
    public async Task Register_ReturnsBadRequest_WhenEmailAlreadyExists()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Register_ReturnsBadRequest_WhenEmailAlreadyExists));
        context.Users.Add(new User
        {
            Email = "taken@test.com",
            PasswordHash = "hash",
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, new TokenService());

        var result = await controller.Register(new RegisterDto
        {
            Email = "taken@test.com",
            Password = "123456",
            Language = "en"
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Email already exists", badRequest.Value);
    }

    [Fact]
    public async Task Register_CreatesUser_WhenEmailIsAvailable()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Register_CreatesUser_WhenEmailIsAvailable));
        var controller = new AuthController(context, new TokenService());

        var result = await controller.Register(new RegisterDto
        {
            Email = "new@test.com",
            Password = "123456",
            Language = "pt"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, await context.Users.CountAsync());
        var user = await context.Users.SingleAsync();
        Assert.Equal("new@test.com", user.Email);
        Assert.Equal("pt", user.Language);
        Assert.NotEqual("123456", user.PasswordHash);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Login_ReturnsUnauthorized_WhenCredentialsAreInvalid()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Login_ReturnsUnauthorized_WhenCredentialsAreInvalid));
        context.Users.Add(new User
        {
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, new TokenService());

        var result = await controller.Login(new LoginDto
        {
            Email = "user@test.com",
            Password = "wrong-password"
        });

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Invalid credentials", unauthorized.Value);
    }

    [Fact]
    public async Task Login_ReturnsOkWithToken_WhenCredentialsAreValid()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Login_ReturnsOkWithToken_WhenCredentialsAreValid));
        context.Users.Add(new User
        {
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, new TokenService());

        var result = await controller.Login(new LoginDto
        {
            Email = "user@test.com",
            Password = "correct-password"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }
}
