import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [FormsModule, CommonModule, LoaderComponent],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.css']
})
export class RecipiesComponent implements OnInit {
  recipes$!: Observable<any[]>; // Firestore data
  selectedRecipe: any = null; // Original recipe data
  userServings: number = 1; // User-selected servings
  adjustedRecipe: any = null; // AI-scaled recipe
  private firestore = inject(Firestore);
  private functions = getFunctions();
  private cache: Map<string, any> = new Map();
  loading = true; // ✅ Start with loading state

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const recipesCollection = collection(this.firestore, 'recipes');
    this.recipes$ = collectionData(recipesCollection, { idField: 'id' });

    this.recipes$.subscribe(
      () => {
        this.loading = false; // ✅ Set loading to false when data is loaded
        this.cdr.detectChanges();
      },
      (error) => {
        console.error("Error fetching recipes:", error);
        this.loading = false; // ✅ Stop loading even if there's an error
        this.cdr.detectChanges();
      }
    );
  }

  openRecipe(recipe: any) {
    this.selectedRecipe = { ...recipe };
    this.userServings = recipe.servings; // Default to original servings
    this.adjustRecipe();
  }

  async adjustRecipe() {
    if (!this.selectedRecipe) return;

    const cacheKey = `${this.selectedRecipe.id}-${this.userServings}`;

    if (this.cache.has(cacheKey)) {
      this.adjustedRecipe = this.cache.get(cacheKey);
      this.cdr.detectChanges();
      return;
    }

    const scaleRecipeFunction = httpsCallable<{ recipe: any; newServings: number }, { scaledRecipe?: any; error?: string }>(this.functions, 'scaleRecipe');

    try {
      this.loading = true; // ✅ Show loading while fetching scaled recipe
      const response = await scaleRecipeFunction({
        recipe: this.selectedRecipe,
        newServings: this.userServings,
      });

      if (response.data.scaledRecipe) {
        this.adjustedRecipe = response.data.scaledRecipe;
        this.cache.set(cacheKey, this.adjustedRecipe);
      } else {
        console.error("Failed to scale recipe:", response.data.error);
      }
    } catch (error) {
      console.error("Error calling AI function:", error);
    } finally {
      this.loading = false; // ✅ Stop loading after request completes
      this.cdr.detectChanges();
    }
  }

  closeRecipe() {
    this.selectedRecipe = null;
    this.adjustedRecipe = null;
  }
}
