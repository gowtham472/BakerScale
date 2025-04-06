import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  errorMessage: string = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.user();

  async loginGoogle() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  async loginEmail(email: string, password: string) {
    if (!email.trim()) {
      this.errorMessage = 'Email cannot be empty.';
      return;
    }
    if (!password.trim()) {
      this.errorMessage = 'Password cannot be empty.';
      return;
    }

    try {
      await this.authService.loginWithEmail(email, password);
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  register() {
    this.router.navigate(['/register']);
  }

  private handleLoginError(error: any) {
    console.error('Login Error:', error);

    if (error.code === 'auth/user-not-found') {
      this.errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      this.errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      this.errorMessage = 'Invalid email format. Please enter a valid email.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      this.errorMessage = 'Google sign-in was closed before completion.';
    } else {
      this.errorMessage = 'Login failed. Please try again later.';
    }
  }
}
