import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root' // Makes the service available app-wide
})
export class UnitConversionService {
  private functions = inject(Functions);

  /**
   * Converts an ingredient's quantity from one unit to another.
   * @param ingredient Ingredient name (e.g., "Flour")
   * @param quantity Numeric value (e.g., 1.5)
   * @param inputUnit The unit to convert from (e.g., "cup")
   * @param outputUnit The unit to convert to (e.g., "grams")
   * @param region Measurement system (e.g., "US", "UK", "India")
   * @returns Converted quantity as a string
   */
  async convertUnits(
    ingredient: string,
    quantity: number,
    inputUnit: string,
    outputUnit: string,
    region: string
  ): Promise<string> {
    try {
      const convertUnits = httpsCallable<{ 
        ingredient: string, quantity: number, inputUnit: string, outputUnit: string, region: string
      }, { convertedQuantity: string }>(
        this.functions, 'convertUnits'
      );

      const response = await convertUnits({
        ingredient, quantity, inputUnit, outputUnit, region
      });

      return response.data.convertedQuantity;
    } catch (error) {
      console.error("❌ Conversion Error:", error);
      return "Conversion Failed";
    }
  }
}
