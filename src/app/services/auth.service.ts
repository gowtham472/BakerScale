import { Injectable, signal } from '@angular/core';
import { 
  Auth, signInWithPopup, GoogleAuthProvider, signOut, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, User 
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = signal<User | null>(this.getStoredUser()); // Load from localStorage if available

  constructor(private auth: Auth) {
    this.auth.onAuthStateChanged((user) => {
      this.user.set(user);
      this.storeUser(user);
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    this.storeUser(result.user);
  }

  async loginWithEmail(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this.storeUser(result.user);
  }

  async register(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    this.storeUser(result.user);
  }

  async logout() {
    await signOut(this.auth);
    this.user.set(null);
    localStorage.removeItem('user');
  }

  private storeUser(user: User | null) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
}
