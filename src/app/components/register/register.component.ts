import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  errorMessage: string = ''; // To store and display error messages

  constructor(private authService: AuthService, private router: Router) {}

  async register(email: string, password: string) {
    try {
      await this.authService.register(email, password);
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.handleRegisterError(error);
    }
  }

  async loginGoogle() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  login() {
    this.router.navigate(['/login']);
  }

  private handleRegisterError(error: any) {
    console.error('Registration Error:', error);

    if (error.code === 'auth/email-already-in-use') {
      this.errorMessage = 'This email is already in use. Try logging in.';
    } else if (error.code === 'auth/invalid-email') {
      this.errorMessage = 'Invalid email format. Please enter a valid email.';
    } else if (error.code === 'auth/weak-password') {
      this.errorMessage = 'Weak password. Please use a stronger password.';
    } else {
      this.errorMessage = 'Registration failed. Please try again later.';
    }
  }

  private handleLoginError(error: any) {
    console.error('Google Login Error:', error);

    if (error.code === 'auth/popup-closed-by-user') {
      this.errorMessage = 'Google sign-in was closed before completion.';
    } else {
      this.errorMessage = 'Google login failed. Please try again.';
    }
  }
}
