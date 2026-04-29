using FitTrackApi.Models;
using FitTrackApi.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace fitTrackBackend.Tests.Services;

public class TokenServiceTests
{
    [Fact]
    public void CreateToken_UsesDevelopmentFallbackKey_WhenJwtKeyIsMissingInDevelopment()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "fitTrackApi",
                ["Jwt:Audience"] = "fitTrackApp"
            })
            .Build();
        var service = new TokenService(
            configuration,
            new TestHostEnvironment { EnvironmentName = Environments.Development });

        var token = service.CreateToken(new User
        {
            Id = 1,
            FullName = "Test User",
            Email = "test@test.com",
            PasswordHash = "hash",
            Language = "en"
        });

        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public void CreateToken_Throws_WhenJwtKeyIsMissingOutsideDevelopment()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "fitTrackApi",
                ["Jwt:Audience"] = "fitTrackApp"
            })
            .Build();
        var service = new TokenService(
            configuration,
            new TestHostEnvironment { EnvironmentName = Environments.Production });

        var exception = Assert.Throws<InvalidOperationException>(() =>
            service.CreateToken(new User
            {
                Id = 1,
                FullName = "Test User",
                Email = "test@test.com",
                PasswordHash = "hash",
                Language = "en"
            }));

        Assert.Equal("JWT signing key is not configured.", exception.Message);
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "fitTrackBackend.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
