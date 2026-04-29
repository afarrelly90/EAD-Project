using FitTrackApi.Data;
using FitTrackApi.DTOs;
using FitTrackApi.Models;
using FitTrackApi.Services;
using fitTrack.Controllers;
using fitTrackBackend.Tests.TestHelpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace fitTrackBackend.Tests.Controllers;

public class AuthControllerTests
{
    private static TokenService CreateTokenService()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-super-secret-key-1234567890",
                ["Jwt:Issuer"] = "fitTrackApi",
                ["Jwt:Audience"] = "fitTrackApp"
            })
            .Build();

        return new TokenService(configuration, new TestHostEnvironment());
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenEmailAlreadyExists()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Register_ReturnsBadRequest_WhenEmailAlreadyExists));
        context.Users.Add(new User
        {
            FullName = "Taken User",
            Email = "taken@test.com",
            PasswordHash = "hash",
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.Register(new RegisterDto
        {
            FullName = "Taken User",
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
        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.Register(new RegisterDto
        {
            FullName = "New User",
            Email = "new@test.com",
            Password = "123456",
            Language = "it"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, await context.Users.CountAsync());
        var user = await context.Users.SingleAsync();
        Assert.Equal("New User", user.FullName);
        Assert.Equal("new@test.com", user.Email);
        Assert.Equal("it", user.Language);
        Assert.NotEqual("123456", user.PasswordHash);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Register_NormalizesInput_AndDefaultsLanguage()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Register_NormalizesInput_AndDefaultsLanguage));
        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.Register(new RegisterDto
        {
            FullName = "  New User  ",
            Email = "  NEW@TEST.COM  ",
            Password = "123456",
            Language = "   "
        });

        Assert.IsType<OkObjectResult>(result);

        var user = await context.Users.SingleAsync();
        Assert.Equal("New User", user.FullName);
        Assert.Equal("new@test.com", user.Email);
        Assert.Equal("en", user.Language);
    }

    [Fact]
    public async Task Login_ReturnsUnauthorized_WhenCredentialsAreInvalid()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Login_ReturnsUnauthorized_WhenCredentialsAreInvalid));
        context.Users.Add(new User
        {
            FullName = "Existing User",
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, CreateTokenService());

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
            FullName = "Existing User",
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.Login(new LoginDto
        {
            Email = "user@test.com",
            Password = "correct-password"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        var payload = okResult.Value!.GetType().GetProperty("user")!.GetValue(okResult.Value);
        Assert.NotNull(payload);
    }

    [Fact]
    public async Task Login_NormalizesEmailBeforeLookup()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(Login_NormalizesEmailBeforeLookup));
        context.Users.Add(new User
        {
            FullName = "Existing User",
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.Login(new LoginDto
        {
            Email = "  USER@TEST.COM  ",
            Password = "correct-password"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetProfile_ReturnsTheUserProfile_WhenUserExists()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(GetProfile_ReturnsTheUserProfile_WhenUserExists));
        context.Users.Add(new User
        {
            FullName = "Existing User",
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Weight = 72.5,
            Language = "it"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.GetProfile(1);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var profile = Assert.IsType<UserProfileDto>(okResult.Value);
        Assert.Equal("Beginner", profile.PreferredDifficulty);
        Assert.Equal("Core", profile.PreferredMuscleGroup);
        Assert.Equal(20, profile.PreferredWorkoutMinutes);
        Assert.Equal(3, profile.DefaultSets);
        Assert.Equal(45, profile.DefaultExerciseSeconds);
        Assert.Equal(60, profile.DefaultRestSeconds);
        Assert.Null(profile.PreferredEquipment);
    }

    [Fact]
    public async Task GetProfile_ReturnsNotFound_WhenUserDoesNotExist()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(GetProfile_ReturnsNotFound_WhenUserDoesNotExist));
        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.GetProfile(999);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task UpdateProfile_UpdatesWeightAndLanguage()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(UpdateProfile_UpdatesWeightAndLanguage));
        context.Users.Add(new User
        {
            FullName = "Existing User",
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Weight = null,
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.UpdateProfile(1, new UpdateProfileDto
        {
            Weight = 80.2,
            Language = "pt",
            PreferredDifficulty = "Advanced",
            PreferredMuscleGroup = "Upper",
            PreferredWorkoutMinutes = 35,
            PreferredEquipment = "Dumbbell",
            DefaultSets = 4,
            DefaultExerciseSeconds = 50,
            DefaultRestSeconds = 75
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        var updated = await context.Users.SingleAsync();
        Assert.Equal(80.2, updated.Weight);
        Assert.Equal("pt", updated.Language);
        Assert.Equal("Advanced", updated.PreferredDifficulty);
        Assert.Equal("Upper", updated.PreferredMuscleGroup);
        Assert.Equal(35, updated.PreferredWorkoutMinutes);
        Assert.Equal("Dumbbell", updated.PreferredEquipment);
        Assert.Equal(4, updated.DefaultSets);
        Assert.Equal(50, updated.DefaultExerciseSeconds);
        Assert.Equal(75, updated.DefaultRestSeconds);
    }

    [Fact]
    public async Task UpdateProfile_ReturnsNotFound_WhenUserDoesNotExist()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(UpdateProfile_ReturnsNotFound_WhenUserDoesNotExist));
        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.UpdateProfile(999, new UpdateProfileDto());

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task UpdateProfile_NormalizesAndClampsValues()
    {
        using var context = TestDbContextFactory.CreateContext(nameof(UpdateProfile_NormalizesAndClampsValues));
        context.Users.Add(new User
        {
            FullName = "Existing User",
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            Language = "en"
        });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, CreateTokenService());

        var result = await controller.UpdateProfile(1, new UpdateProfileDto
        {
            Weight = 91.1,
            Language = "   ",
            PreferredDifficulty = " something-else ",
            PreferredMuscleGroup = " mystery ",
            PreferredWorkoutMinutes = 999,
            PreferredEquipment = " none ",
            DefaultSets = 0,
            DefaultExerciseSeconds = 99999,
            DefaultRestSeconds = 0
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var profile = Assert.IsType<UserProfileDto>(okResult.Value);

        var updated = await context.Users.SingleAsync();
        Assert.Equal("en", updated.Language);
        Assert.Equal("Beginner", updated.PreferredDifficulty);
        Assert.Equal("Core", updated.PreferredMuscleGroup);
        Assert.Equal(180, updated.PreferredWorkoutMinutes);
        Assert.Null(updated.PreferredEquipment);
        Assert.Equal(1, updated.DefaultSets);
        Assert.Equal(3600, updated.DefaultExerciseSeconds);
        Assert.Equal(5, updated.DefaultRestSeconds);

        Assert.Equal("Beginner", profile.PreferredDifficulty);
        Assert.Equal("Core", profile.PreferredMuscleGroup);
        Assert.Equal(180, profile.PreferredWorkoutMinutes);
        Assert.Null(profile.PreferredEquipment);
        Assert.Equal(1, profile.DefaultSets);
        Assert.Equal(3600, profile.DefaultExerciseSeconds);
        Assert.Equal(5, profile.DefaultRestSeconds);
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "fitTrackBackend.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
