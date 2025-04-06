import { Component, inject, NgZone, OnInit } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitConversionService } from '../services/unit-conversion.service';
import { LoaderComponent } from '../components/loader/loader.component';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.css']
})
export class TextInputComponent implements OnInit {
  recipeText: string = '';
  convertedData: any = {}; // Stores final converted ingredients
  selectedOutputUnit: string = 'grams';
  selectedRegion: string = 'US';
  availableUnits: string[] = ['grams', 'cups', 'tbsp', 'ml', 'oz', 'kg'];
  availableRegions: string[] = ['US', 'UK', 'India', 'Australia', 'Germany', 'France', 'China'];
  showPopup: boolean = false;
  recentConversions: any[] = [];
  loading = false;

  private functions = inject(Functions);
  private ngZone = inject(NgZone);
  private unitConversionService = inject(UnitConversionService);

  ngOnInit() {
    this.loadRecentConversions();
  }

  async convertRecipe() {

    this.loading = true;
    if(this.recipeText.trim() === ''){
      alert("Please enter a recipe to convert");
      return;
    }
    this.ngZone.runOutsideAngular(async () => { 
      try {
        const extractEntities = httpsCallable<{ text: string }, any>(
          this.functions, 'extractEntities'
        );

        const response = await extractEntities({ text: this.recipeText });

        this.ngZone.run(async () => {
          const extractedIngredients = response.data.ingredients;

          if (!extractedIngredients.length) {
            console.warn("⚠️ No ingredients extracted.");
            return;
          }

          console.log("✅ Extracted Ingredients:", extractedIngredients);

          // 🔹 Convert each ingredient to the selected unit & region
          for (let item of extractedIngredients) {
            const [quantity, inputUnit] = item.measure.split(" ");
            const convertedMeasure = await this.unitConversionService.convertUnits(
              item.ingredient,
              parseFloat(quantity),
              inputUnit,
              this.selectedOutputUnit,
              this.selectedRegion
            );
            item.measure = `${convertedMeasure} ${this.selectedOutputUnit}`;
          }

          this.convertedData = extractedIngredients;
          this.saveToLocalStorage();
          this.showPopup = true;
          this.loading = false;
        });

      } catch (error) {
        console.error("🔥 Error in conversion process:", error);
      }
    });
  }

  saveToLocalStorage() {
    const storedData = localStorage.getItem('recentConversions');
    let recentConversions = storedData ? JSON.parse(storedData) : [];
  
    const newConversion = {
      input: this.recipeText, // Stores the original input text
      output: this.convertedData.map((item: any) => ({
        ingredient: item.ingredient,
        measure: parseFloat(item.measure.split(" ")[0]),
        unit: this.selectedOutputUnit,
        region: this.selectedRegion
      }))
    };
  
    recentConversions.push(newConversion);
    localStorage.setItem('recentConversions', JSON.stringify(recentConversions));
  }

  loadRecentConversions() {
    const storedData = localStorage.getItem('recentConversions');
    if (storedData) {
      this.recentConversions = JSON.parse(storedData);
    }
  }

  clearRecentConversions() {
    localStorage.removeItem('recentConversions');
    this.recentConversions = [];
  }

  closePopup() {
    this.showPopup = false;
  }
}
