import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TextInputComponent } from '../../text-input/text-input.component';
import { VoiceInputComponent } from '../../voice-input/voice-input.component';
import { RecentConversionsComponent } from '../recent-conversions/recent-conversions.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TextInputComponent, VoiceInputComponent,RecentConversionsComponent,CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  textInput = ""
  constructor(private authService: AuthService) {} // Add Router here

  logout() {
    this.authService.logout();
  }

}

