import { Component, inject, NgZone } from '@angular/core';
import { VoiceService } from '../services/voice.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { UnitConversionService } from '../services/unit-conversion.service';
import { LoaderComponent } from '../components/loader/loader.component';

@Component({
  selector: 'app-voice-input',
  standalone: true,
  imports: [FormsModule, CommonModule,LoaderComponent],
  templateUrl: './voice-input.component.html',
  styleUrls: ['./voice-input.component.css']
})
export class VoiceInputComponent {
  recipeText: string = ''; 
  extractedData: any = []; 
  convertedData: any = []; 
  isListening: boolean = false;
  listeningText: string = 'Listening';
  intervalId: any;
  loading = false;

  selectedUnit: string = localStorage.getItem('selectedOutputUnit') || 'grams';
  selectedRegion: string = localStorage.getItem('selectedRegion') || 'US';

  availableUnits: string[] = ['grams', 'cups', 'tbsp', 'ml', 'oz', 'kg'];
  availableRegions: string[] = ['US', 'UK', 'India', 'Germany', 'France', 'Australia', 'China'];

  private functions = inject(Functions);
  private ngZone = inject(NgZone);
  private unitConversionService = inject(UnitConversionService);

  constructor(private voiceService: VoiceService) {}

  async startVoiceInput() {
    if (this.isListening) return;
    this.isListening = true;
    this.animateListeningText();

    await this.voiceService.startListening((transcript) => {
      this.recipeText = transcript;
    });
  }

  stopVoiceInput() {
    this.isListening = false;
    clearInterval(this.intervalId);
    this.voiceService.stopListening();

    if (this.recipeText.trim()) {
      this.extractIngredients();
    }
  }

  async extractIngredients() {
    if (!this.recipeText.trim()) return;
    
    this.ngZone.runOutsideAngular(async () => {
      try {
        const extractEntities = httpsCallable<{ text: string }, { ingredients: any }>(
          this.functions, 'extractEntities'
        );

        const response = await extractEntities({ text: this.recipeText });

        this.ngZone.run(() => {
          this.extractedData = response.data.ingredients;
        });

      } catch (error) {
        console.error("🔥 Error extracting ingredients:", error);
      }
    });
  }

  async convertIngredients() {
    this.loading = true;
    if (!this.extractedData.length) {
      console.warn("⚠️ No ingredients to convert.");
      return;
    }

    localStorage.setItem('selectedOutputUnit', this.selectedUnit);
    localStorage.setItem('selectedRegion', this.selectedRegion);

    this.convertedData = [];

    for (let item of this.extractedData) {
      const [quantity, inputUnit] = item.measure.split(" ");

      const convertedMeasure = await this.unitConversionService.convertUnits(
        item.ingredient,
        parseFloat(quantity),
        inputUnit,
        this.selectedUnit,
        this.selectedRegion
      );

      this.convertedData.push({
        ingredient: item.ingredient,
        measure: `${convertedMeasure} ${this.selectedUnit}`
      });
    }

    this.saveRecentConversions();
    this.loading = false;
  }

  saveRecentConversions() {
    const storedData = localStorage.getItem('recentConversions');
    let recentConversions = storedData ? JSON.parse(storedData) : [];
  
    const newConversion = {
      input: this.recipeText, // Stores the original input text
      output: this.convertedData.map((item: any) => ({
        ingredient: item.ingredient,
        measure: parseFloat(item.measure.split(" ")[0]),
        unit: this.selectedUnit,
        region: this.selectedRegion
      }))
    };
  
    recentConversions.push(newConversion);
    localStorage.setItem('recentConversions', JSON.stringify(recentConversions));
  }

  getRecentConversions() {
    const storedData = localStorage.getItem('recentConversions');
    return storedData ? JSON.parse(storedData) : [];
  }
  
  animateListeningText() {
    let dots = 0;
    this.intervalId = setInterval(() => {
      this.listeningText = 'Listening' + '.'.repeat((dots % 3) + 1);
      dots++;
    }, 500);
  }

  clearText() {
    this.recipeText = '';
    this.extractedData = [];
    this.convertedData = [];
  }

  clearRecentConversions() {
    localStorage.removeItem('recentConversions');
  }
}
