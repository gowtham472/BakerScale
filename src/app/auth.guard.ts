import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : this.authService.user();

    if (user) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
