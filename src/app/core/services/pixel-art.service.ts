import { Injectable, signal, computed, inject } from '@angular/core';
import { PixelArt, PixelArtStyle, BackgroundType, AnimationType } from '../models/pixel-art.model';
import { MockDataService } from './mock-data.service';
import { delay, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PixelArtService {
  private mockDataService = inject(MockDataService);
  
  // Mock image processing delay
  private processingDelay = 1500;
  
  // Current editing state using signals
  private currentSettings = signal({
    pixelSize: 8,
    style: PixelArtStyle.RETRO_8BIT,
    paletteId: 'gameboy',
    contrast: 50,
    sharpness: 70,
    backgroundType: BackgroundType.TRANSPARENT,
    animationType: AnimationType.NONE
  });
  
  // Computed values
  currentPalette = computed(() => {
    const paletteId = this.currentSettings().paletteId;
    return this.mockDataService.getPalettes()().find(p => p.id === paletteId);
  });
  
  // Source image data
  sourceImage = signal<string | null>(null);
  sourcePrompt = signal<string>('');
  
  // Result image
  resultImage = signal<string | null>(null);
  
  // Processing state
  isProcessing = signal(false);
  
  // Public API
  getPixelArtExamples() {
    return this.mockDataService.getPixelArtExamples();
  }
  
  getSettings() {
    return this.currentSettings;
  }
  
  updateSettings(settings: Partial<ReturnType<typeof this.currentSettings>>) {
    this.currentSettings.update(current => ({...current, ...settings}));
  }
  
  setSourceImage(imageDataUrl: string) {
    this.sourceImage.set(imageDataUrl);
    this.processImage();
  }
  
  setSourcePrompt(prompt: string) {
    this.sourcePrompt.set(prompt);
    if (prompt.length > 10) {
      this.generateFromPrompt();
    }
  }
  
  // Mock image processing
  processImage() {
    this.isProcessing.set(true);
    
    // Simulate processing delay
    of(null).pipe(delay(this.processingDelay)).subscribe(() => {
      // Here we would actually process the image
      // For the mock, we'll just set a placeholder
      this.resultImage.set(this.sourceImage());
      this.isProcessing.set(false);
    });
    
    return this.resultImage;
  }
  
  // Mock AI generation
  generateFromPrompt() {
    this.isProcessing.set(true);
    
    // Simulate AI generation delay
    of(null).pipe(delay(this.processingDelay * 2)).subscribe(() => {
      // Here we would actually call an AI service
      // For the mock, we'll just select a random example
      const examples = this.mockDataService.getPixelArtExamples();
      const randomIndex = Math.floor(Math.random() * examples().length);
      this.resultImage.set(examples()[randomIndex].imageUrl);
      this.isProcessing.set(false);
    });
    
    return this.resultImage;
  }
  
  // Save pixel art
  savePixelArt(name: string) {
    if (!this.resultImage()) return;
    
    const newArt: PixelArt = {
      id: Date.now().toString(),
      name: name,
      imageUrl: this.resultImage()!,
      thumbnailUrl: this.resultImage()!, // In a real app, we'd generate a thumbnail
      createdAt: new Date(),
      width: 64, // In a real app, these would be actual dimensions
      height: 64,
      pixelSize: this.currentSettings().pixelSize,
      style: this.currentSettings().style,
      backgroundType: this.currentSettings().backgroundType,
      palette: this.currentPalette()!,
      tags: [],
      isAnimated: this.currentSettings().animationType !== AnimationType.NONE,
      animationType: this.currentSettings().animationType
    };
    
    this.mockDataService.addPixelArt(newArt);
    return newArt;
  }
}
