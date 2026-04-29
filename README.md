# FitTrack

## Smart Gym Progress App

X00203931 - Aaron Farrelly  
X00195027 - Marco Nocerino

FitTrack is a mobile fitness app and ASP.NET Core Web API project built for Android. The app lets users register, browse exercises, create and edit their own exercise entries, run workout timers, generate guided workouts, and manage profile-based workout preferences. The backend exposes the exercise and user data through a REST API backed by Entity Framework Code First.

## Features

- User registration, login, and profile management
- Exercise library with create, edit, delete, and detail views
- Searchable and filterable exercise browsing
- Single-exercise workout timer
- Workout generator based on difficulty, muscle group, equipment, and target duration
- Guided workout flow built from generated workout plans
- Profile workout preferences such as preferred difficulty, target workout length, sets, and timer presets
- English and Italian language support
- Frontend unit tests and Android end-to-end Appium tests

## Tech Stack

- Frontend: Ionic + Angular + Capacitor
- Backend: ASP.NET Core Web API
- ORM: Entity Framework Core with Code First migrations
- Databases:
  - Local development: SQLite
  - Deployment: Azure SQL
- CI/CD: GitHub Actions + Azure App Service

## Project Structure

- [frontend/fitTrack](/C:/Users/lacki/Desktop/EAD_Project/fitTrack/frontend/fitTrack)  
  Ionic Angular mobile app
- [backend/fitTrackBackend](/C:/Users/lacki/Desktop/EAD_Project/fitTrack/backend/fitTrackBackend)  
  ASP.NET Core Web API and EF Core migrations
- [.github/workflows](/C:/Users/lacki/Desktop/EAD_Project/fitTrack/.github/workflows)  
  CI/CD workflows for frontend and backend

## Running Locally

### Backend

From [backend/fitTrackBackend](/C:/Users/lacki/Desktop/EAD_Project/fitTrack/backend/fitTrackBackend):

```powershell
dotnet restore
dotnet run
```

The API runs locally using SQLite by default. Swagger is available at:

`http://localhost:5240/swagger`

### Frontend

From [frontend/fitTrack](/C:/Users/lacki/Desktop/EAD_Project/fitTrack/frontend/fitTrack):

```powershell
npm install
npm start
```

The Angular/Ionic app runs at:

`http://localhost:4200`

Note: for local frontend testing, [environment.ts](/C:/Users/lacki/Desktop/EAD_Project/fitTrack/frontend/fitTrack/src/environments/environment.ts:1) should point to the local backend. For deployed testing, it should point to the Azure API.

## Testing

### Frontend unit tests

```powershell
cd frontend/fitTrack
npm test -- --watch=false --browsers=ChromeHeadless
```

### Mobile end-to-end tests

```powershell
cd frontend/fitTrack
npm run test:e2e:all
```

Available Appium flows include:

- login
- register
- home
- timer
- workout builder

## Deployment

The backend is deployed to Azure App Service through GitHub Actions. The deployed API is available at:

[Swagger](https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/swagger)

## Notes

- The project uses two main entities: `Users` and `Exercises`
- Workout generation is built dynamically from existing exercise data rather than storing workout history in a separate database table
- Startup logic includes Azure SQL migration baselining so existing deployed tables can be brought under EF migration tracking safely
