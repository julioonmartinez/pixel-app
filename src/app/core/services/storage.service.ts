import { Injectable } from '@angular/core';
import { UserSettings } from '../models/user-settings.model';
import { PixelArtStyle, BackgroundType, AnimationType } from '../models/pixel-art.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly USER_SETTINGS_KEY = 'pixelforge_user_settings';
  private readonly SAVED_ARTS_KEY = 'pixelforge_saved_arts';
  
  constructor() {}
  
  getUserSettings(): UserSettings {
    const storedSettings = localStorage.getItem(this.USER_SETTINGS_KEY);
    
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
    
    // Default settings
    const defaultSettings: UserSettings = {
      id: 'default',
      pixelSize: 8,
      defaultStyle: PixelArtStyle.RETRO_8BIT,
      defaultPalette: 'gameboy',
      contrast: 50,
      sharpness: 70,
      defaultBackground: BackgroundType.TRANSPARENT,
      defaultAnimationType: AnimationType.NONE,
      theme: 'dark'
    };
    
    this.saveUserSettings(defaultSettings);
    return defaultSettings;
  }
  
  saveUserSettings(settings: UserSettings): void {
    localStorage.setItem(this.USER_SETTINGS_KEY, JSON.stringify(settings));
  }
  
  getSavedArtIds(): string[] {
    const savedArts = localStorage.getItem(this.SAVED_ARTS_KEY);
    return savedArts ? JSON.parse(savedArts) : [];
  }
  
  saveArtId(artId: string): void {
    const savedArts = this.getSavedArtIds();
    if (!savedArts.includes(artId)) {
      savedArts.push(artId);
      localStorage.setItem(this.SAVED_ARTS_KEY, JSON.stringify(savedArts));
    }
  }
  
  removeArtId(artId: string): void {
    const savedArts = this.getSavedArtIds().filter(id => id !== artId);
    localStorage.setItem(this.SAVED_ARTS_KEY, JSON.stringify(savedArts));
  }
}