using Microsoft.EntityFrameworkCore;
using FitTrackApi.Data;
using FitTrackApi.Services;
using System.Data.Common;

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
    await BaselineExistingSqlServerSchemaAsync(db);
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

static async Task BaselineExistingSqlServerSchemaAsync(AppDbContext db)
{
    if (!db.Database.IsSqlServer())
    {
        return;
    }

    var connection = db.Database.GetDbConnection();
    var shouldCloseConnection = connection.State != System.Data.ConnectionState.Open;

    if (shouldCloseConnection)
    {
        await connection.OpenAsync();
    }

    try
    {
        await EnsureMigrationHistoryTableExistsAsync(connection);

        if (await CountRowsAsync(connection, "SELECT COUNT(*) FROM [__EFMigrationsHistory];") > 0)
        {
            return;
        }

        var hasUsersTable = await TableExistsAsync(connection, "Users");
        if (!hasUsersTable)
        {
            return;
        }

        var hasExercisesTable = await TableExistsAsync(connection, "Exercises");
        var hasFullName = await ColumnExistsAsync(connection, "Users", "FullName");
        var hasWorkoutPreferences =
            await ColumnExistsAsync(connection, "Users", "DefaultExerciseSeconds") &&
            await ColumnExistsAsync(connection, "Users", "DefaultRestSeconds") &&
            await ColumnExistsAsync(connection, "Users", "DefaultSets") &&
            await ColumnExistsAsync(connection, "Users", "PreferredDifficulty") &&
            await ColumnExistsAsync(connection, "Users", "PreferredEquipment") &&
            await ColumnExistsAsync(connection, "Users", "PreferredMuscleGroup") &&
            await ColumnExistsAsync(connection, "Users", "PreferredWorkoutMinutes");

        await RecordMigrationAsync(connection, "20260414165301_InitialCreate");

        if (hasExercisesTable)
        {
            await RecordMigrationAsync(connection, "20260415110000_AddExercise");
        }

        if (hasFullName)
        {
            await RecordMigrationAsync(connection, "20260416190000_AddUserFullName");
        }

        if (hasWorkoutPreferences)
        {
            await RecordMigrationAsync(connection, "20260429090000_AddWorkoutPreferencesToUser");
        }
    }
    finally
    {
        if (shouldCloseConnection)
        {
            await connection.CloseAsync();
        }
    }
}

static async Task EnsureMigrationHistoryTableExistsAsync(DbConnection connection)
{
    await ExecuteNonQueryAsync(
        connection,
        """
        IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
        BEGIN
            CREATE TABLE [__EFMigrationsHistory] (
                [MigrationId] nvarchar(150) NOT NULL,
                [ProductVersion] nvarchar(32) NOT NULL,
                CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
            );
        END
        """);
}

static async Task<bool> TableExistsAsync(DbConnection connection, string tableName)
{
    return await CountRowsAsync(
               connection,
               "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName;",
               ("@tableName", tableName))
           > 0;
}

static async Task<bool> ColumnExistsAsync(DbConnection connection, string tableName, string columnName)
{
    return await CountRowsAsync(
               connection,
               """
               SELECT COUNT(*)
               FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = @tableName AND COLUMN_NAME = @columnName;
               """,
               ("@tableName", tableName),
               ("@columnName", columnName))
           > 0;
}

static async Task RecordMigrationAsync(DbConnection connection, string migrationId)
{
    await ExecuteNonQueryAsync(
        connection,
        """
        IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = @migrationId)
        BEGIN
            INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
            VALUES (@migrationId, '8.0.5');
        END
        """,
        ("@migrationId", migrationId));
}

static async Task<int> CountRowsAsync(
    DbConnection connection,
    string commandText,
    params (string Name, object? Value)[] parameters)
{
    await using var command = CreateCommand(connection, commandText, parameters);
    var result = await command.ExecuteScalarAsync();
    return result is null or DBNull ? 0 : Convert.ToInt32(result);
}

static async Task ExecuteNonQueryAsync(
    DbConnection connection,
    string commandText,
    params (string Name, object? Value)[] parameters)
{
    await using var command = CreateCommand(connection, commandText, parameters);
    await command.ExecuteNonQueryAsync();
}

static DbCommand CreateCommand(
    DbConnection connection,
    string commandText,
    params (string Name, object? Value)[] parameters)
{
    var command = connection.CreateCommand();
    command.CommandText = commandText;

    foreach (var (name, value) in parameters)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    return command;
}
