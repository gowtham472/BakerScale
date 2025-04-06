import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recent-conversions',
  imports: [CommonModule,FormsModule],
  templateUrl: './recent-conversions.component.html',
  styleUrl: './recent-conversions.component.css'
})
export class RecentConversionsComponent {
  getRecentConversions(): any[] {
    const stored = localStorage.getItem('recentConversions');
    return stored ? JSON.parse(stored) : [];
  }
  
  clearRecentConversions() {
    localStorage.removeItem('recentConversions');
  }
  
}
