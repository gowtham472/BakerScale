import { Component, computed, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  user = computed(() => this.authService.user()); // Reactive user state
  menuOpen = signal(false); // Track menu visibility

  constructor(private authService: AuthService, private router: Router) {}

  toggleMenu() {
    this.menuOpen.update(value => !value); // Toggle the menu state
  }

  closeMenu() {
    this.menuOpen.set(false); // Close the menu when navigating
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }

  login() {
    this.router.navigate(['/login']);
    this.closeMenu();
  }

  home() {
    this.router.navigate(['/home']);
    this.closeMenu();
  }

  recipies() {
    this.router.navigate(['/recipies']);
    this.closeMenu();
  }

  image(){
    this.router.navigate(['/find-by-image']);
    this.closeMenu();
  }
}
