import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  constructor(private firestore: Firestore) {} // ✅ Constructor injection

  getRecipes(): Observable<any[]> {
    console.log("Fetching recipes from Firestore..."); // Debugging ✅
    const recipesCollection = collection(this.firestore, 'recipes');
    return collectionData(recipesCollection, { idField: 'id' });
  }
}
