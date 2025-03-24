import { AnimationType, BackgroundType, PixelArtStyle } from "./pixel-art.model";

export interface UserSettings {
    id: string;
    pixelSize: number;
    defaultStyle: PixelArtStyle;
    defaultPalette: string;
    contrast: number;
    sharpness: number;
    defaultBackground: BackgroundType;
    defaultAnimationType: AnimationType;
    theme: 'dark' | 'light';
  }