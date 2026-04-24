using Microsoft.EntityFrameworkCore;
using FitTrackApi.Data;
using FitTrackApi.Services;

var builder = WebApplication.CreateBuilder(args);

var sqlServerConnection = builder.Configuration.GetConnectionString("DefaultConnection");
var sqliteConnection =
    builder.Configuration.GetConnectionString("SqliteConnection") ??
    "Data Source=app.db";

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
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:8100", "http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (db.Database.IsSqlServer())
    {
        // Azure SQL is a fresh database, so bootstrap the schema directly from the model.
        db.Database.EnsureCreated();
    }
    else
    {
        db.Database.Migrate();
    }
}

app.UseCors("AllowFrontend");

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();
