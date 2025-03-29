import { Injectable, signal, computed, inject } from '@angular/core';
import { PixelArt, PixelArtStyle, BackgroundType, AnimationType } from '../models/pixel-art.model';
import { MockDataService } from './mock-data.service';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PixelArtService {
  private mockDataService = inject(MockDataService);
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/mongo/pixel-arts`;
  private apiBaseUrl = environment.apiBaseUrl;
  
  // Estado de error
  readonly error = signal<string | null>(null);
  
  // Estado de carga
  readonly isLoading = signal<boolean>(false);
  
  readonly isLoadingListImages = signal<boolean>(false);
  // Estado de procesamiento de imágenes
  readonly isProcessing = signal<boolean>(false);
  
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

  // Lista de pixel arts guardados
 savedPixelArts = signal<PixelArt[]>([]);
  
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

  // Función para construir URLs absolutas
private getFullUrl(url: string): string {
  // Si la URL ya es absoluta, la devolvemos como está
  if (url.startsWith('http')) {
    return url;
  }
  
  // Si estamos en desarrollo local con proxy, usamos la URL relativa
  if (environment.apiBaseUrl === '') {
    return url;
  }
  
  // En otro caso, construimos la URL absoluta
  return `${environment.apiBaseUrl}${url}`;
}
  
  // Public API
  getPixelArtExamples() {
    return this.mockDataService.getPixelArtExamples();
  }
  getPixelArts(){
    return this.savedPixelArts()
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
  
  // Procesar imagen utilizando el backend
  processImage() {
    if (!this.sourceImage()) {
      this.error.set('No hay imagen para procesar');
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);
    
    // Convertir dataURL a archivo
    const imageFile = this.dataURLtoFile(
      this.sourceImage()!, 
      `image_${Date.now()}.png`
    );
    
    // Crear FormData para enviar al backend
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('name', `Pixel Art ${new Date().toLocaleString()}`);
    formData.append('pixelSize', this.currentSettings().pixelSize.toString());
    formData.append('style', this.currentSettings().style);
    formData.append('paletteId', this.currentSettings().paletteId);
    formData.append('contrast', '50');
    formData.append('sharpness', '70');
    formData.append('backgroundType', this.currentSettings().backgroundType);
    formData.append('animationType', this.currentSettings().animationType);
    formData.append('tags', 'uploaded');

    console.log('🚀 Enviando imagen al backend para procesar');
    
    // Enviar al backend
    this.http.post<PixelArt>(`${this.apiUrl}/process-image`, formData).pipe(
      tap(result => {
        console.log('✅ Imagen procesada correctamente:', result);
        
        if (result.imageUrl) {
         // Usar la función getFullUrl
        const fullImageUrl = this.getFullUrl(result.imageUrl);
        this.resultImage.set(fullImageUrl);
          this.savedPixelArts.update(current => [result, ...current]);
        } else {
          console.error('⚠️ Respuesta sin imageUrl:', result);
          this.error.set('La respuesta no contiene una imagen válida');
        }
      }),
      catchError(error => {
        console.error('❌ Error al procesar la imagen:', error);
        this.error.set(`Error al procesar la imagen: ${error.message || error.statusText || 'Desconocido'}`);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isProcessing.set(false);
      })
    ).subscribe();
  }
  
  // Método para generar imagen desde prompt
  generateFromPrompt() {
    if (!this.sourcePrompt() || this.sourcePrompt().length < 3) {
      this.error.set('❌ El prompt es demasiado corto');
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    const request = {
      prompt: this.sourcePrompt(),
      settings: this.currentSettings()
    };

    console.log('🚀 Enviando solicitud al backend:', request);
    console.log('🌍 URL de destino:', `${this.apiUrl}/generate-from-prompt`);

    this.http.post<PixelArt>(`${this.apiUrl}/generate-from-prompt`, request, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(result => {
        console.log('✅ Respuesta del backend:', result);
        
        if (result.imageUrl) {
          // Asegúrate de que la URL es completa o constrúyela adecuadamente
          const fullImageUrl = this.getFullUrl(result.imageUrl);
          this.resultImage.set(fullImageUrl);
          this.savedPixelArts.update(current => [result, ...current]);
        } else {
          console.error('⚠️ Respuesta sin imageUrl:', result);
          this.error.set('La respuesta no contiene una imagen válida');
        }
      }),
      catchError(error => {
        console.error('❌ Error detallado:', error);
        this.error.set(`Error al generar la imagen: ${error.message || error.statusText || 'Desconocido'}`);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isProcessing.set(false);
      })
    ).subscribe();
  }
  
  // Utilidad para convertir dataURL a File
  private dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
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

  getPixelArtList() {
  console.log(this.apiUrl)
  this.isLoadingListImages.set(true)
    return this.http.get<any>(this.apiUrl).pipe(
      tap(result => {
        console.log('🎨 Datos obtenidos del backend:', result);
        const arts = result.items as PixelArt[];
        console.log(result)
        // Asegurarse de que todas las URLs son correctas
        arts.forEach(art => {
          if (art.imageUrl && !art.imageUrl.startsWith('http')) {
            art.imageUrl = this.getFullUrl(art.imageUrl);
          }
          if (art.thumbnailUrl && !art.thumbnailUrl.startsWith('http')) {
            art.thumbnailUrl = this.getFullUrl(art.thumbnailUrl);
          }
        });
        
        this.savedPixelArts.set(arts);
        
         setTimeout(()=>{
          this.isLoadingListImages.set(false)
         }, 0)

        console.log('📌 savedPixelArts actualizado:', this.savedPixelArts());
      }),
      catchError(error => {
        console.error('❌ Error al obtener la lista de pixel arts:', error);
        this.error.set(`Error al obtener la lista: ${error.message || error.statusText || 'Desconocido'}`);
        return throwError(() => error);
      })
    )  ;
  }
  


  
  
}
