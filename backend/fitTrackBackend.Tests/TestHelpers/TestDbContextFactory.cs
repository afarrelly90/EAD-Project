using FitTrackApi.Data;
using Microsoft.EntityFrameworkCore;

namespace fitTrackBackend.Tests.TestHelpers;

internal static class TestDbContextFactory
{
    public static AppDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new AppDbContext(options);
    }
}
