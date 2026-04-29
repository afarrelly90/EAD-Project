using Microsoft.EntityFrameworkCore;
using FitTrackApi.Data;
using FitTrackApi.Services;

var builder = WebApplication.CreateBuilder(args);

var sqlServerConnection = builder.Configuration.GetConnectionString("DefaultConnection");
var sqliteConnection =
    builder.Configuration.GetConnectionString("SqliteConnection") ??
    GetDefaultSqliteConnection(builder.Environment);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(sqlServerConnection))
    {
        options.UseSqlServer(sqlServerConnection);
        return;
    }

    options.UseSqlite(sqliteConnection);
});

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<ExerciseService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
var allowedOrigins = new[]
{
    "http://localhost:8100",
    "http://localhost:4200",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    "ionic://localhost"
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors("AllowFrontend");

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();

static string GetDefaultSqliteConnection(IHostEnvironment environment)
{
    if (environment.IsDevelopment())
    {
        return "Data Source=app.db";
    }

    var homeDirectory = Environment.GetEnvironmentVariable("HOME");
    if (!string.IsNullOrWhiteSpace(homeDirectory))
    {
        var dataDirectory = Path.Combine(homeDirectory, "data", "fittrack");
        Directory.CreateDirectory(dataDirectory);
        return $"Data Source={Path.Combine(dataDirectory, "app.db")}";
    }

    return $"Data Source={Path.Combine(AppContext.BaseDirectory, "app.db")}";
}
