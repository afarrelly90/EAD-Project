using FitTrackApi.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fitTrack.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260429090000_AddWorkoutPreferencesToUser")]
    public partial class AddWorkoutPreferencesToUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DefaultExerciseSeconds",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 45);

            migrationBuilder.AddColumn<int>(
                name: "DefaultRestSeconds",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.AddColumn<int>(
                name: "DefaultSets",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<string>(
                name: "PreferredDifficulty",
                table: "Users",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "Beginner");

            migrationBuilder.AddColumn<string>(
                name: "PreferredEquipment",
                table: "Users",
                type: "TEXT",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredMuscleGroup",
                table: "Users",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "Core");

            migrationBuilder.AddColumn<int>(
                name: "PreferredWorkoutMinutes",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 20);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "DefaultExerciseSeconds", table: "Users");
            migrationBuilder.DropColumn(name: "DefaultRestSeconds", table: "Users");
            migrationBuilder.DropColumn(name: "DefaultSets", table: "Users");
            migrationBuilder.DropColumn(name: "PreferredDifficulty", table: "Users");
            migrationBuilder.DropColumn(name: "PreferredEquipment", table: "Users");
            migrationBuilder.DropColumn(name: "PreferredMuscleGroup", table: "Users");
            migrationBuilder.DropColumn(name: "PreferredWorkoutMinutes", table: "Users");
        }
    }
}
