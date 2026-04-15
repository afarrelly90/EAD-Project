import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then( m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then( m => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then( m => m.HomeComponent)
  },
  {
    path: 'exercises/create',
    loadComponent: () => import('./pages/create-exercise/create-exercise.component').then( m => m.CreateExerciseComponent)
  },
];
