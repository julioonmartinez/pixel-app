// src/app/core/models/pixel-art.model.ts

/**
 * Representa una imagen de arte en píxeles generada con IA.
 */
export interface PixelArt {
  /** Identificador único de la imagen */
  id: string;

  /** Nombre o título del arte en píxeles */
  name: string;

  /** URL de la imagen en alta resolución */
  imageUrl: string;

  /** URL de la miniatura de la imagen */
  thumbnailUrl: string;

  /** Fecha y hora de creación del arte en píxeles */
  createdAt: Date;

  /** Fecha y hora de última actualización del arte en píxeles */
  updatedAt?: Date;

  /** Ancho de la imagen en número de píxeles */
  width: number;

  /** Alto de la imagen en número de píxeles */
  height: number;

  /** Tamaño de cada píxel en la imagen (ej. 1x1, 2x2, etc.) */
  pixelSize: number;

  /** Estilo artístico del pixel art */
  style: PixelArtStyle;

  /** Tipo de fondo utilizado en la imagen */
  backgroundType: BackgroundType;

  /** Paleta de colores utilizada en la imagen */
  palette: ColorPalette;

  /** Lista de etiquetas asociadas al pixel art para categorización */
  tags: string[];

  /** Indica si la imagen contiene animación */
  isAnimated: boolean;

  /** Tipo de animación aplicada (opcional, solo si es animado) */
  animationType?: AnimationType;

  /** Prompt utilizado para generar o modificar la imagen (opcional) */
  prompt?: string;

  /** Historial de versiones anteriores de esta imagen (opcional) */
  versionHistory?: PixelArtVersion[];
}

/**
 * Representa una versión anterior de un PixelArt.
 */
export interface PixelArtVersion {
  /** Marca de tiempo de cuando se creó esta versión */
  timestamp: string;
  
  /** URL de la imagen de esta versión */
  imageUrl: string;
  
  /** URL de la miniatura de esta versión */
  thumbnailUrl: string;
  
  /** Prompt utilizado para crear esta versión (si aplica) */
  prompt?: string;
  
  /** Cambios aplicados en esta versión */
  changes: Record<string, any>;
}

/**
* Estilos posibles para el pixel art.
*/
export enum PixelArtStyle {
  RETRO_8BIT = 'retro', // Estilo clásico de juegos de 8 bits
  MODERN_16BIT = 'modern', // Estilo más detallado, similar a juegos de 16 bits
  MINIMALIST = 'minimalist', // Estilo simple con pocos colores y detalles
  DITHERED = 'dithered', // Uso de tramado para simular más colores o texturas
  ISOMETRIC = 'isometric' // Perspectiva isométrica en la composición
}

/**
* Tipos de fondos disponibles para el pixel art.
*/
export enum BackgroundType {
  TRANSPARENT = 'transparent', // Fondo sin color (transparente)
  SOLID = 'solid', // Un solo color uniforme como fondo
  GRADIENT = 'gradient', // Fondo con degradado de colores
  PATTERN = 'pattern' // Fondo con patrones repetitivos
}

/**
* Tipos de animaciones posibles para un pixel art animado.
*/
export enum AnimationType {
  NONE = 'none', // Sin animación
  BREATHING = 'breathing', // Efecto de pulsación o respiración
  FLICKERING = 'flickering', // Efecto de parpadeo
  FLOATING = 'floating' // Movimiento de flotación
}

/**
* Representa una paleta de colores utilizada en el pixel art.
*/
export interface ColorPalette {
  /** Identificador único de la paleta */
  id: string;

  /** Nombre de la paleta de colores */
  name: string;

  /** Lista de colores en formato hexadecimal */
  colors: string[];
}

/**
 * Configuración para actualizar un pixel art existente con cambios visuales.
 */
export interface PixelArtUpdateWithImage {
  /** Datos a actualizar del pixel art */
  updates: Partial<PixelArt>;
  
  /** Prompt que describe las modificaciones a realizar */
  prompt: string;
  
  /** Indica si se debe aplicar el prompt para modificar la imagen */
  applyChangesToImage: boolean;
}

/**
 * Configuración para procesar una imagen con un prompt adicional.
 */
export interface PixelArtProcessRequest {
  /** Archivo de imagen a procesar */
  file: File;
  
  /** Nombre o título del arte en píxeles */
  name: string;
  
  /** Tamaño de cada píxel en la imagen */
  pixelSize: number;
  
  /** Estilo artístico del pixel art */
  style: PixelArtStyle;
  
  /** ID de la paleta de colores a utilizar */
  paletteId: string;
  
  /** Nivel de contraste a aplicar (0-100) */
  contrast: number;
  
  /** Nivel de nitidez a aplicar (0-100) */
  sharpness: number;
  
  /** Tipo de fondo a utilizar */
  backgroundType: BackgroundType;
  
  /** Tipo de animación a aplicar */
  animationType: AnimationType;
  
  /** Prompt opcional para mejorar o modificar la imagen con IA */
  prompt?: string;
  
  /** Lista de etiquetas separadas por coma */
  tags: string;
}