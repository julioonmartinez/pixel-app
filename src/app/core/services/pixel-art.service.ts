import { Injectable, signal, computed, inject } from '@angular/core';
import { PixelArt, PixelArtStyle, BackgroundType, AnimationType, PixelArtVersion } from '../models/pixel-art.model';
import { MockDataService } from './mock-data.service';
import { catchError, finalize, tap, throwError, Observable, switchMap, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Tipo para los ajustes de pixel art
export interface PixelArtSettings {
  pixelSize: number;
  style: PixelArtStyle;
  paletteId: string;
  contrast: number;
  sharpness: number;
  backgroundType: BackgroundType;
  animationType: AnimationType;
}

// Tipo para estados de carga
export type LoadingState = {
  list: boolean;
  processing: boolean;
  saving: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class PixelArtService {
  private mockDataService = inject(MockDataService);
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/mongo/pixel-arts`;
  
  // Estado consolidado de carga para diferentes operaciones
  private readonly loadingState = signal<LoadingState>({
    list: false,
    processing: false,
    saving: false
  });
  
  // Estados públicos derivados para mejor encapsulamiento
  readonly isProcessing = computed(() => this.loadingState().processing);
  readonly isLoadingList = computed(() => this.loadingState().list);
  readonly isSaving = computed(() => this.loadingState().saving);
  
  // Estado de error
  readonly error = signal<string | null>(null);
  
  // Ajustes actuales usando signal
  private readonly currentSettings = signal<PixelArtSettings>({
    pixelSize: 8,
    style: PixelArtStyle.RETRO_8BIT,
    paletteId: 'gameboy',
    contrast: 50,
    sharpness: 70,
    backgroundType: BackgroundType.TRANSPARENT,
    animationType: AnimationType.NONE
  });

  // Lista de pixel arts guardados
  readonly savedPixelArts = signal<PixelArt[]>([]);
  
  // Valores computed
  readonly currentPalette = computed(() => {
    const paletteId = this.currentSettings().paletteId;
    return this.mockDataService.getPalettes()().find(p => p.id === paletteId);
  });
  
  // Datos de imagen fuente
  readonly sourceImage = signal<string | null>(null);
  readonly sourcePrompt = signal<string>('');
  
  // Imágenes de resultado
  readonly resultImage = signal<string | null>(null);
  readonly resultPixelArt = signal<PixelArt | null>(null);

  // Método para normalizar URLs
  private getFullUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (environment.apiBaseUrl === '') return url;
    return `${environment.apiBaseUrl}${url}`;
  }
  
  // Método para normalizar fechas
  private normalizeDate(date: string | Date | undefined): Date | undefined {
    if (!date) return undefined;
    return typeof date === 'string' ? new Date(date) : date;
  }
  
  // Método para normalizar los datos de PixelArt recibidos del backend
  private normalizePixelArt(art: PixelArt): PixelArt {
    // Crear copia para no mutar el original
    const normalized: PixelArt = { ...art };
    
    // Normalizar URLs
    normalized.imageUrl = this.getFullUrl(art.imageUrl) || '';
    normalized.thumbnailUrl = this.getFullUrl(art.thumbnailUrl) || '';
    
    // Normalizar fechas
    normalized.createdAt = this.normalizeDate(art.createdAt) || new Date();
    if (art.updatedAt) {
      normalized.updatedAt = this.normalizeDate(art.updatedAt);
    }
    
    // Normalizar historial de versiones
    if (normalized.versionHistory) {
      normalized.versionHistory = normalized.versionHistory.map(version => ({
        ...version,
        imageUrl: this.getFullUrl(version.imageUrl) || '',
        thumbnailUrl: this.getFullUrl(version.thumbnailUrl) || ''
      }));
    }
    
    return normalized;
  }
  
  // Método unificado para manejar errores HTTP
  private handleHttpError(error: HttpErrorResponse, operation: string): Observable<never> {
    console.error(`❌ Error en ${operation}:`, error);
    
    let errorMsg = 'Error desconocido';
    if (error.error?.detail) {
      errorMsg = error.error.detail;
    } else if (error.message) {
      errorMsg = error.message;
    } else if (error.statusText) {
      errorMsg = error.statusText;
    }
    
    this.error.set(`Error al ${operation}: ${errorMsg}`);
    return throwError(() => error);
  }
  
  // Método para actualizar el estado de carga
  private updateLoadingState(key: keyof LoadingState, value: boolean): void {
    this.loadingState.update(state => ({
      ...state,
      [key]: value
    }));
  }
  
  // Actualizar la lista de PixelArts si el resultado es nuevo o modificado
  private updateArtworksList(artwork: PixelArt): void {
    this.savedPixelArts.update(arts => {
      const index = arts.findIndex(art => art.id === artwork.id);
      
      if (index >= 0) {
        // Actualizar existente
        const updatedArts = [...arts];
        updatedArts[index] = artwork;
        return updatedArts;
      } else {
        // Añadir nuevo al inicio
        return [artwork, ...arts];
      }
    });
  }
  
  // API pública
  
  /**
   * Obtiene ejemplos de PixelArt desde el servicio de datos mock
   */
  getPixelArtExamples() {
    return this.mockDataService.getPixelArtExamples();
  }
  
  /**
   * Retorna los PixelArts guardados
   */
  getPixelArts(): PixelArt[] {
    return this.savedPixelArts();
  }
  
  /**
   * Obtiene los ajustes actuales de generación de PixelArt
   */
  getSettings() {
    return this.currentSettings;
  }
  
  /**
   * Actualiza los ajustes de generación de PixelArt
   * @param settings Ajustes parciales a actualizar
   */
  updateSettings(settings: Partial<PixelArtSettings>): void {
    this.currentSettings.update(current => ({...current, ...settings}));
  }
  
  /**
   * Establece la imagen fuente y la procesa automáticamente
   * @param imageDataUrl URL de datos de la imagen (base64)
   * @param processImmediately Si debe procesarse inmediatamente
   */
  setSourceImage(imageDataUrl: string, processImmediately = true): void {
    this.sourceImage.set(imageDataUrl);
    
    if (processImmediately) {
      this.processImage();
    }
  }

  /**
   * Obtiene un PixelArt por su ID
   * @param id ID del PixelArt
   */
  getPixelArtById(id: string): Observable<PixelArt> {
    return this.http.get<PixelArt>(`${this.apiUrl}/${id}`).pipe(
      tap(result => {
        console.log('📋 Pixel art cargado:', result);
        
        // Normalizar y actualizar estado
        const normalizedArt = this.normalizePixelArt(result);
        this.resultPixelArt.set(normalizedArt);
      }),
      catchError(error => this.handleHttpError(error, 'cargar el pixel art'))
    );
  }
  
  /**
   * Establece el prompt fuente y genera una imagen si es válido
   * @param prompt Texto del prompt
   * @param generateImmediately Si debe generarse inmediatamente
   */
  setSourcePrompt(prompt: string, generateImmediately = true): void {
    this.sourcePrompt.set(prompt);
    
    if (generateImmediately && prompt.length > 10) {
      this.generateFromPrompt().subscribe() ;
    }
  }
  
  /**
   * Actualiza un PixelArt existente con un nuevo prompt
   * @param id ID del PixelArt
   * @param prompt Nuevo prompt para actualizar
   */
  updatePixelArtWithPrompt(id: string, prompt: string): Observable<PixelArt | null> {
    if (!prompt || prompt.length < 5) {
      this.error.set('❌ El prompt es demasiado corto');
      return of(null);
    }

    this.updateLoadingState('processing', true);
    this.error.set(null);

    const settings = this.currentSettings();
    
    const requestBody = {
      "pixel_art_update": {
        "pixelSize": settings.pixelSize,
        "style": settings.style,
        "backgroundType": settings.backgroundType,
        "animationType": settings.animationType,
        "paletteId": settings.paletteId
      },
      "prompt": prompt,
      "apply_changes_to_image": true
    };

    console.log('🚀 Enviando solicitud de actualización:', requestBody);

    return this.http.put<PixelArt>(
      `${this.apiUrl}/${id}`, 
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(result => {
        console.log('✅ Pixel art actualizado:', result);
        
        // Normalizar y actualizar estado
        const normalizedArt = this.normalizePixelArt(result);
        this.resultImage.set(normalizedArt.imageUrl);
        this.resultPixelArt.set(normalizedArt);
        
        // Actualizar lista
        this.updateArtworksList(normalizedArt);
      }),
      catchError(error => this.handleHttpError(error, 'actualizar el pixel art')),
      finalize(() => this.updateLoadingState('processing', false))
    );
  }
  
  /**
   * Restaura una versión anterior de un PixelArt
   * @param pixelArtId ID del PixelArt
   * @param version Versión a restaurar
   */
  restoreVersion(pixelArtId: string, version: PixelArtVersion): Observable<PixelArt> {
    this.updateLoadingState('processing', true);
    this.error.set(null);

    const updateRequest = {
      imageUrl: version.imageUrl,
      thumbnailUrl: version.thumbnailUrl,
      restoredFromVersion: version.timestamp
    };

    console.log('🔄 Restaurando versión anterior:', version.timestamp);

    return this.http.put<PixelArt>(`${this.apiUrl}/${pixelArtId}`, updateRequest).pipe(
      tap(result => {
        console.log('✅ Versión restaurada:', result);
        
        // Normalizar y actualizar estado
        const normalizedArt = this.normalizePixelArt(result);
        this.resultImage.set(normalizedArt.imageUrl);
        this.resultPixelArt.set(normalizedArt);
        
        // Actualizar lista
        this.updateArtworksList(normalizedArt);
      }),
      catchError(error => this.handleHttpError(error, 'restaurar la versión')),
      finalize(() => this.updateLoadingState('processing', false))
    );
  }
  
  /**
   * Procesa una imagen utilizando el backend
   * @param additionalPrompt Prompt adicional opcional
   */
  processImage(additionalPrompt?: string): Observable<PixelArt | null> {
    if (!this.sourceImage()) {
      this.error.set('No hay imagen para procesar');
      return of(null);
    }

    this.updateLoadingState('processing', true);
    this.error.set(null);
    
    // Convertir dataURL a archivo
    const imageFile = this.dataURLtoFile(
      this.sourceImage()!, 
      `image_${Date.now()}.png`
    );
    
    // Crear FormData
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('name', `Pixel Art ${new Date().toLocaleString()}`);
    formData.append('pixelSize', this.currentSettings().pixelSize.toString());
    formData.append('style', this.currentSettings().style);
    formData.append('paletteId', this.currentSettings().paletteId);
    formData.append('contrast', this.currentSettings().contrast.toString());
    formData.append('sharpness', this.currentSettings().sharpness.toString());
    formData.append('backgroundType', this.currentSettings().backgroundType);
    formData.append('animationType', this.currentSettings().animationType);
    formData.append('tags', 'uploaded');
    
    // Añadir prompt si se proporciona
    if (additionalPrompt) {
      formData.append('prompt', additionalPrompt);
      console.log(`🔖 Añadiendo prompt a la imagen: "${additionalPrompt}"`);
    }

    console.log('🚀 Enviando imagen al backend para procesar');
    
    return this.http.post<PixelArt>(`${this.apiUrl}/process-image`, formData).pipe(
      tap(result => {
        console.log('✅ Imagen procesada correctamente:', result);
        
        if (result.imageUrl) {
          // Normalizar y actualizar estado
          const normalizedArt = this.normalizePixelArt(result);
          this.resultImage.set(normalizedArt.imageUrl);
          this.resultPixelArt.set(normalizedArt);
          
          // Actualizar lista
          this.updateArtworksList(normalizedArt);
        } else {
          console.error('⚠️ Respuesta sin imageUrl:', result);
          this.error.set('La respuesta no contiene una imagen válida');
        }
      }),
      catchError(error => this.handleHttpError(error, 'procesar la imagen')),
      finalize(() => this.updateLoadingState('processing', false))
    );
  }
  
  /**
   * Genera una imagen desde un prompt
   */
  generateFromPrompt(): Observable<PixelArt | null> {
    if (!this.sourcePrompt() || this.sourcePrompt().length < 3) {
      this.error.set('❌ El prompt es demasiado corto');
      return of(null);
    }

    this.updateLoadingState('processing', true);
    this.error.set(null);

    const request = {
      prompt: this.sourcePrompt(),
      settings: this.currentSettings()
    };

    console.log('🚀 Enviando solicitud al backend:', request);

    return this.http.post<PixelArt>(
      `${this.apiUrl}/generate-from-prompt`, 
      request, 
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(result => {
        console.log('✅ Respuesta del backend:', result);
        
        if (result.imageUrl) {
          // Normalizar y actualizar estado
          const normalizedArt = this.normalizePixelArt(result);
          this.resultImage.set(normalizedArt.imageUrl);
          this.resultPixelArt.set(normalizedArt);
          
          // Actualizar lista
          this.updateArtworksList(normalizedArt);
        } else {
          console.error('⚠️ Respuesta sin imageUrl:', result);
          this.error.set('La respuesta no contiene una imagen válida');
        }
      }),
      catchError(error => this.handleHttpError(error, 'generar la imagen')),
      finalize(() => this.updateLoadingState('processing', false))
    );
  }
  
  /**
   * Convierte dataURL a File
   * @param dataurl URL de datos (base64)
   * @param filename Nombre del archivo
   */
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
  
  /**
   * Guarda un PixelArt
   * @param name Nombre del PixelArt
   * @param tags Etiquetas opcionales
   */
  savePixelArt(name: string, tags: string[] = []): PixelArt | null {
    if (!this.resultImage()) return null;
    
    const newArt: PixelArt = {
      id: Date.now().toString(),
      name: name,
      imageUrl: this.resultImage()!,
      thumbnailUrl: this.resultImage()!,
      createdAt: new Date(),
      width: 64,
      height: 64,
      pixelSize: this.currentSettings().pixelSize,
      style: this.currentSettings().style,
      backgroundType: this.currentSettings().backgroundType,
      palette: this.currentPalette()!,
      tags: tags,
      isAnimated: this.currentSettings().animationType !== AnimationType.NONE,
      animationType: this.currentSettings().animationType,
      prompt: this.sourcePrompt() || undefined
    };
    
    this.mockDataService.addPixelArt(newArt);
    this.updateArtworksList(newArt);
    return newArt;
  }

  /**
   * Obtiene la lista de PixelArts desde el backend
   */
  getPixelArtList(): Observable<PixelArt[]> {
    this.updateLoadingState('list', true);
    
    return this.http.get<{items: PixelArt[]}>(this.apiUrl).pipe(
      tap(result => {
        console.log('🎨 Datos obtenidos del backend:', result);
        
        // Normalizar todos los PixelArts
        const normalizedArts = (result.items || []).map(art => this.normalizePixelArt(art));
        this.savedPixelArts.set(normalizedArts);
        
        console.log('📌 savedPixelArts actualizado:', this.savedPixelArts());
      }),
      switchMap(result => of(result.items)), // Convertir a Observable<PixelArt[]>
      catchError(error => {
        this.handleHttpError(error, 'obtener la lista');
        return of([]); // Devolver array vacío en caso de error
      }),
      finalize(() => this.updateLoadingState('list', false))
    );
  }
  
  /**
   * Limpia todos los datos temporales (reset)
   */
  resetState(): void {
    this.sourceImage.set(null);
    this.sourcePrompt.set('');
    this.resultImage.set(null);
    this.resultPixelArt.set(null);
    this.error.set(null);
  }
}