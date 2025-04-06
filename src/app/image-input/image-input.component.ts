import { Component, NgZone,ElementRef, ViewChild } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDocs, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { LoaderComponent } from '../components/loader/loader.component';

@Component({
  selector: 'app-image-input',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './image-input.component.html',
  styleUrls: ['./image-input.component.css']
})
export class ImageInputComponent {
  @ViewChild('detectedResult') detectedResultRef!: ElementRef;
  imageFile: File | null = null;
  imageUrl: string = ''; 
  detecting: boolean = false; 
  detectedInfo: any = null; 
  localRecipes: any[] = [];
  loading:boolean = false;
  
  private functions = inject(Functions);
  private ngZone = inject(NgZone);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = getStorage(); // Firebase Storage instance
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.loadLocalRecipes();
  }

  onFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.imageFile = target.files[0];
      this.imageUrl = URL.createObjectURL(this.imageFile);
    }
  }

  captureImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.addEventListener('change', (event: any) => {
      if (event.target.files.length > 0) {
        this.onFileSelect(event);
      }
    });

    input.click();
  }

  async uploadImage(): Promise<string | null> {
    if (!this.imageFile) return null;

    const currentUser = await firstValueFrom(user(this.auth));
    if (!currentUser) {
      alert("You must be logged in to upload images!");
      return null;
    }

    const userId = currentUser.uid; // Get user ID
    const filePath = `uploads/${userId}/${Date.now()}-${this.imageFile.name}`;
    const storageRef = ref(this.storage, filePath);

    try {
      await uploadBytes(storageRef, this.imageFile);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("❌ Image Upload Error:", error);
      return null;
    }
  }

  async detectIngredientOrProduct() {
    if (!this.imageFile) {
      alert('Please select or capture an image first!');
      return;
    }

    this.loading = false; // Set loading to true when detection starts
    this.detecting = true;

    try {
      const imageUrl = await this.uploadImage();
      if (!imageUrl) throw new Error('Image upload failed!');

      const detectFunction = httpsCallable<{ imageUrl: string }, any>(
        this.functions, 'detectIngredientOrProduct'
      );

      const response = await detectFunction({ imageUrl });

      this.ngZone.run(() => {
        if (!response.data || !response.data.detectedData) {
          console.error('❌ No detected data received!');
          alert('AI detection failed! Please try again.');
          return;
        }
        this.detectedInfo = response.data.detectedData;
        this.cdr.detectChanges(); // Ensure UI updates
      });
    } catch (error) {
      console.error('🔥 Error in Image Detection:', error);
      alert(error);
    } finally {
      this.detecting = false;
      this.loading = true;
      this.cdr.detectChanges(); 
      this.scrollToDetectedResult();
    }
  }

  async saveRecipeToFirestore(recipeData: any, imageUrl: string) {
    const userId = (await user(this.auth).toPromise())?.uid;
    if (!userId) {
      alert("User not logged in!");
      return;
    }

    const recipeRef = doc(this.firestore, `users/${userId}/local_recipes/${Date.now()}`);
    await setDoc(recipeRef, {
      name: recipeData.name,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      imageUrl,
      createdAt: new Date()
    });

    this.loadLocalRecipes();
  }

  async loadLocalRecipes() {
    this.loading = true;

    const userId = (await user(this.auth).toPromise())?.uid;
    if (!userId) {
      this.loading = true;
      return;
    }

    const querySnapshot = await getDocs(collection(this.firestore, `users/${userId}/local_recipes`));
    this.localRecipes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    this.loading = false; // Set loading to false after loading recipes
  }
  
  scrollToDetectedResult() {
    if (this.detectedResultRef) {
      this.detectedResultRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

