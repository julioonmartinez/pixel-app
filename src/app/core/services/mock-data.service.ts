import { Injectable, signal } from '@angular/core';
import { PixelArt, ColorPalette, PixelArtStyle, BackgroundType, AnimationType } from '../models/pixel-art.model';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly palettes = signal<ColorPalette[]>([
    { id: 'gameboy', name: 'GameBoy', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
    { id: 'nes', name: 'NES', colors: ['#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc'] },
    { id: 'cga', name: 'CGA', colors: ['#000000', '#555555', '#aaaaaa', '#ffffff'] },
    { id: 'pico8', name: 'PICO-8', colors: ['#000000', '#1D2B53', '#7E2553', '#008751'] },
    { id: 'moody', name: 'Moody Purple', colors: ['#5e315b', '#8c3f5d', '#ba6156', '#f2a65a'] }
  ]);

  private readonly pixelArtExamples = signal<PixelArt[]>([]);

  constructor() {
    this.pixelArtExamples.set([
      {
        id: '1',
        name: 'Pixel Dragon',
        imageUrl: '/assets/images/pixel-dragon.jpeg',
        thumbnailUrl: '/assets/images/pixel-dragon-thumb.webp',
        createdAt: new Date('2025-02-15'),
        width: 64,
        height: 64,
        pixelSize: 8,
        style: PixelArtStyle.RETRO_8BIT,
        backgroundType: BackgroundType.TRANSPARENT,
        palette: this.palettes()[0], // Ahora es seguro
        tags: ['dragon', 'fantasy', 'creature'],
        isAnimated: false,
        animationType: AnimationType.NONE
      },
      {
        id: '2',
        name: 'Cyberpunk City',
        imageUrl: '/assets/images/cyberpunk-city.jpeg',
        thumbnailUrl: '/assets/images/cyberpunk-city-thumb.webp',
        createdAt: new Date('2025-03-01'),
        width: 128,
        height: 96,
        pixelSize: 4,
        style: PixelArtStyle.MODERN_16BIT,
        backgroundType: BackgroundType.GRADIENT,
        palette: this.palettes()[2], // Ahora es seguro
        tags: ['city', 'cyberpunk', 'futuristic'],
        isAnimated: true,
        animationType: AnimationType.BREATHING
      }
    ]);
    console.log('MockDataService inicializado con:', this.pixelArtExamples());
  }

  getPalettes() {
    return this.palettes;
  }

  getPixelArtExamples() {
    return this.pixelArtExamples;
  }

  getPixelArtById(id: string) {
    return this.pixelArtExamples().find(art => art.id === id);
  }

  addPixelArt(pixelArt: PixelArt) {
    this.pixelArtExamples.update(arts => [...arts, pixelArt]);
  }
}