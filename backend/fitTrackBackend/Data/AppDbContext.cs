using Microsoft.EntityFrameworkCore;
using FitTrackApi.Models;

namespace FitTrackApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) {}

    public DbSet<User> Users { get; set; }
    public DbSet<Exercise> Exercises { get; set; }
}
