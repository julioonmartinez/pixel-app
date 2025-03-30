//src/core/services/pixel-art.services.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { PixelArt, PixelArtStyle, BackgroundType, AnimationType, PixelArtUpdateWithImage, PixelArtVersion } from '../models/pixel-art.model';
import { MockDataService } from './mock-data.service';
import { catchError, finalize, tap, throwError, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  resultPixelArt = signal<PixelArt | null>(null);

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

  getPixelArtById(id: string): Observable<PixelArt> {
    return this.http.get<PixelArt>(`${this.apiUrl}/${id}`).pipe(
      tap(result => {
        console.log('📋 Pixel art cargado:', result);
        
        // Convertir timestamps de version history a fechas
        if (result.versionHistory) {
          result.versionHistory = result.versionHistory.map(version => ({
            ...version,
            timestamp: version.timestamp // Mantener como string
          }));
        }
        
        // Convertir dates a objetos Date
        if (typeof result.createdAt === 'string') {
          result.createdAt = new Date(result.createdAt);
        }
        if (result.updatedAt && typeof result.updatedAt === 'string') {
          result.updatedAt = new Date(result.updatedAt);
        }
        
        // Asegurarse de que las URLs sean completas
        if (result.imageUrl && !result.imageUrl.startsWith('http')) {
          result.imageUrl = this.getFullUrl(result.imageUrl);
        }
        if (result.thumbnailUrl && !result.thumbnailUrl.startsWith('http')) {
          result.thumbnailUrl = this.getFullUrl(result.thumbnailUrl);
        }

        // También actualizar URLs en el historial de versiones
        if (result.versionHistory) {
          result.versionHistory.forEach(version => {
            if (version.imageUrl && !version.imageUrl.startsWith('http')) {
              version.imageUrl = this.getFullUrl(version.imageUrl);
            }
            if (version.thumbnailUrl && !version.thumbnailUrl.startsWith('http')) {
              version.thumbnailUrl = this.getFullUrl(version.thumbnailUrl);
            }
          });
        }
        
        // Actualizar el pixel art actual
        this.resultPixelArt.set(result);
      }),
      catchError(error => {
        console.error('❌ Error al cargar el pixel art:', error);
        this.error.set(`Error al cargar el pixel art: ${error.message || error.statusText || 'Desconocido'}`);
        return throwError(() => error);
      })
    );
  }
  
  setSourcePrompt(prompt: string) {
    this.sourcePrompt.set(prompt);
    if (prompt.length > 10) {
      this.generateFromPrompt();
    }
  }
  
// Actualizar un pixel art existente con un nuevo prompt visual
updatePixelArtWithPrompt(id: string, prompt: string) {
  if (!prompt || prompt.length < 5) {
    this.error.set('❌ El prompt es demasiado corto');
    return;
  }

  this.isProcessing.set(true);
  this.error.set(null);

  // Obtener los ajustes actuales
  const settings = this.currentSettings();
  
  // Preparar los datos de actualización alineados con lo que espera FastAPI
  const requestBody = {
    // Este objeto será asignado a pixel_art_update
    "pixel_art_update": {
      "pixelSize": settings.pixelSize,
      "style": settings.style,
      "backgroundType": settings.backgroundType,
      "animationType": settings.animationType,
      "paletteId": settings.paletteId
    },
    // Estos serán asignados a los parámetros individuales
    "prompt": prompt,
    "apply_changes_to_image": true
  };

  console.log('🚀 Enviando solicitud de actualización:', requestBody);

  return this.http.put<PixelArt>(`${this.apiUrl}/${id}`, requestBody,
    {
      // Asegúrate de tener el Content-Type correcto
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ).pipe(
    tap(result => {
      console.log('✅ Pixel art actualizado:', result);
      
      // Asegurarse de que las URLs son completas
      if (result.imageUrl) {
        const fullImageUrl = this.getFullUrl(result.imageUrl);
        result.imageUrl = fullImageUrl;
        this.resultImage.set(fullImageUrl);
      }
      if (result.thumbnailUrl) {
        result.thumbnailUrl = this.getFullUrl(result.thumbnailUrl);
      }
      
      // Actualizar historial de versiones
      if (result.versionHistory) {
        result.versionHistory.forEach(version => {
          if (version.imageUrl && !version.imageUrl.startsWith('http')) {
            version.imageUrl = this.getFullUrl(version.imageUrl);
          }
          if (version.thumbnailUrl && !version.thumbnailUrl.startsWith('http')) {
            version.thumbnailUrl = this.getFullUrl(version.thumbnailUrl);
          }
        });
      }
      
      // Actualizar pixel art actual
      this.resultPixelArt.set(result);
      
      // Actualizar lista si existe en ella
      this.savedPixelArts.update(arts => {
        const index = arts.findIndex(art => art.id === result.id);
        if (index >= 0) {
          const updatedArts = [...arts];
          updatedArts[index] = result;
          return updatedArts;
        }
        return arts;
      });
    }),
    catchError(error => {
      console.error('❌ Error al actualizar el pixel art:', error);
      
      // Intentar extraer un mensaje de error más detallado
      let errorMsg = 'Desconocido';
      if (error.error && error.error.detail) {
        errorMsg = error.error.detail;
      } else if (error.message) {
        errorMsg = error.message;
      } else if (error.statusText) {
        errorMsg = error.statusText;
      }
      
      this.error.set(`Error al actualizar: ${errorMsg}`);
      return throwError(() => error);
    }),
    finalize(() => {
      this.isProcessing.set(false);
    })
  );
}
  
  // Restaurar una versión anterior del historial
  restoreVersion(pixelArtId: string, version: PixelArtVersion) {
    this.isProcessing.set(true);
    this.error.set(null);

    // Crear una actualización simple para restaurar la versión
    const updateRequest = {
      imageUrl: version.imageUrl,
      thumbnailUrl: version.thumbnailUrl,
      restoredFromVersion: version.timestamp
    };

    console.log('🔄 Restaurando versión anterior:', version.timestamp);

    this.http.put<PixelArt>(`${this.apiUrl}/${pixelArtId}`, updateRequest).pipe(
      tap(result => {
        console.log('✅ Versión restaurada:', result);
        
        // Asegurarse de que las URLs son completas
        if (result.imageUrl) {
          const fullImageUrl = this.getFullUrl(result.imageUrl);
          result.imageUrl = fullImageUrl;
          this.resultImage.set(fullImageUrl);
        }
        if (result.thumbnailUrl) {
          result.thumbnailUrl = this.getFullUrl(result.thumbnailUrl);
        }
        
        // Actualizar pixel art actual
        this.resultPixelArt.set(result);
        
        // Actualizar lista si existe en ella
        this.savedPixelArts.update(arts => {
          const index = arts.findIndex(art => art.id === result.id);
          if (index >= 0) {
            const updatedArts = [...arts];
            updatedArts[index] = result;
            return updatedArts;
          }
          return arts;
        });
      }),
      catchError(error => {
        console.error('❌ Error al restaurar la versión:', error);
        this.error.set(`Error al restaurar: ${error.message || error.statusText || 'Desconocido'}`);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isProcessing.set(false);
      })
    ).subscribe();
  }
  
  // Procesar imagen utilizando el backend
  processImage(additionalPrompt?: string) {
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
    
    // Añadir prompt si se proporciona
    if (additionalPrompt) {
      formData.append('prompt', additionalPrompt);
      console.log(`🔖 Añadiendo prompt a la imagen: "${additionalPrompt}"`);
    }

    console.log('🚀 Enviando imagen al backend para procesar');
    
    // Enviar al backend
    this.http.post<PixelArt>(`${this.apiUrl}/process-image`, formData).pipe(
      tap(result => {
        console.log('✅ Imagen procesada correctamente:', result);
        
        if (result.imageUrl) {
          // Usar la función getFullUrl
          const fullImageUrl = this.getFullUrl(result.imageUrl);
          result.imageUrl = fullImageUrl;
          this.resultImage.set(fullImageUrl);
          
          // Convertir fechas si es necesario
          if (typeof result.createdAt === 'string') {
            result.createdAt = new Date(result.createdAt);
          }
          if (result.updatedAt && typeof result.updatedAt === 'string') {
            result.updatedAt = new Date(result.updatedAt);
          }
          
          // Guardar el resultado actual
          this.resultPixelArt.set(result);
          
          // Actualizar la lista de pixel arts
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
          result.imageUrl = fullImageUrl;
          this.resultImage.set(fullImageUrl);
          
          // Convertir fechas si es necesario
          if (typeof result.createdAt === 'string') {
            result.createdAt = new Date(result.createdAt);
          }
          if (result.updatedAt && typeof result.updatedAt === 'string') {
            result.updatedAt = new Date(result.updatedAt);
          }
          
          // Guardar el resultado actual
          this.resultPixelArt.set(result);
          
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
      animationType: this.currentSettings().animationType,
      prompt: this.sourcePrompt() || undefined
    };
    
    this.mockDataService.addPixelArt(newArt);
    return newArt;
  }

  getPixelArtList() {
    console.log(this.apiUrl);
    this.isLoadingListImages.set(true);
    return this.http.get<any>(this.apiUrl).pipe(
      tap(result => {
        console.log('🎨 Datos obtenidos del backend:', result);
        const arts = result.items as PixelArt[];
        
        // Asegurarse de que todas las URLs son correctas y convertir fechas
        arts.forEach(art => {
          // Convertir dates a objetos Date
          if (typeof art.createdAt === 'string') {
            art.createdAt = new Date(art.createdAt);
          }
          if (art.updatedAt && typeof art.updatedAt === 'string') {
            art.updatedAt = new Date(art.updatedAt);
          }
          
          // Asegurarse de que las URLs son completas
          if (art.imageUrl && !art.imageUrl.startsWith('http')) {
            art.imageUrl = this.getFullUrl(art.imageUrl);
          }
          if (art.thumbnailUrl && !art.thumbnailUrl.startsWith('http')) {
            art.thumbnailUrl = this.getFullUrl(art.thumbnailUrl);
          }
          
          // Actualizar también el historial de versiones
          if (art.versionHistory) {
            art.versionHistory.forEach(version => {
              if (version.imageUrl && !version.imageUrl.startsWith('http')) {
                version.imageUrl = this.getFullUrl(version.imageUrl);
              }
              if (version.thumbnailUrl && !version.thumbnailUrl.startsWith('http')) {
                version.thumbnailUrl = this.getFullUrl(version.thumbnailUrl);
              }
            });
          }
        });
        
        this.savedPixelArts.set(arts);
        
        setTimeout(() => {
          this.isLoadingListImages.set(false);
        }, 0);

        console.log('📌 savedPixelArts actualizado:', this.savedPixelArts());
      }),
      catchError(error => {
        console.error('❌ Error al obtener la lista de pixel arts:', error);
        this.error.set(`Error al obtener la lista: ${error.message || error.statusText || 'Desconocido'}`);
        this.isLoadingListImages.set(false);
        return throwError(() => error);
      })
    );
  }
}
