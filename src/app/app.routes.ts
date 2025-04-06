import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { RecipiesComponent } from './components/recipies/recipes.component';
import { ImageInputComponent } from './image-input/image-input.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] }, // Protected route
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'recipies', component: RecipiesComponent, canActivate: [AuthGuard] },// Protected route
  { path: 'find-by-image', component: ImageInputComponent, canActivate: [AuthGuard] }
];
