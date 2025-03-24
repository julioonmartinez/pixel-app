// src/app/core/utils/image-processor.ts
export class ImageProcessor {
    static pixelate(imageData: ImageData, pixelSize: number): ImageData {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      
      // Create a new ImageData with the same dimensions
      const result = new ImageData(width, height);
      const resultData = result.data;
      
      // Perform pixelation
      for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
          // Get the color of the first pixel in the block
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Apply this color to all pixels in the block
          for (let blockY = 0; blockY < pixelSize && y + blockY < height; blockY++) {
            for (let blockX = 0; blockX < pixelSize && x + blockX < width; blockX++) {
              const blockI = ((y + blockY) * width + (x + blockX)) * 4;
              resultData[blockI] = r;
              resultData[blockI + 1] = g;
              resultData[blockI + 2] = b;
              resultData[blockI + 3] = a;
            }
          }
        }
      }
      
      return result;
    }
    
    static applyPalette(imageData: ImageData, palette: string[]): ImageData {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      
      // Create a new ImageData with the same dimensions
      const result = new ImageData(width, height);
      const resultData = result.data;
      
      // Helper function to find the closest color in the palette
      const findClosestColor = (r: number, g: number, b: number): [number, number, number] => {
        let minDistance = Number.MAX_VALUE;
        let closestColor: [number, number, number] = [0, 0, 0];
        
        for (const hexColor of palette) {
          const rgb = this.hexToRgb(hexColor);
          if (!rgb) continue;
          
          const distance = 
            Math.pow(rgb[0] - r, 2) + 
            Math.pow(rgb[1] - g, 2) + 
            Math.pow(rgb[2] - b, 2);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestColor = rgb;
          }
        }
        
        return closestColor;
      };
      
      // Apply palette to each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // If pixel is not transparent
        if (a > 0) {
          const [newR, newG, newB] = findClosestColor(r, g, b);
          resultData[i] = newR;
          resultData[i + 1] = newG;
          resultData[i + 2] = newB;
        }
        
        // Keep original alpha
        resultData[i + 3] = a;
      }
      
      return result;
    }
    
    static applyDithering(imageData: ImageData, palette: string[]): ImageData {
      // Floyd-Steinberg dithering algorithm
      const width = imageData.width;
      const height = imageData.height;
      const data = new Uint8ClampedArray(imageData.data);
      
      // Create a copy for tracking errors
      const result = new ImageData(width, height);
      const resultData = result.data;
      
      // Copy the original data first
      for (let i = 0; i < data.length; i++) {
        resultData[i] = data[i];
      }
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          
          // Get current pixel value
          const r = resultData[i];
          const g = resultData[i + 1];
          const b = resultData[i + 2];
          
          // Find the closest color in the palette
          const [newR, newG, newB] = this.findClosestColor([r, g, b], palette);
          
          // Calculate the error for each channel
          const errorR = r - newR;
          const errorG = g - newG;
          const errorB = b - newB;
          
          // Set the new pixel value
          resultData[i] = newR;
          resultData[i + 1] = newG;
          resultData[i + 2] = newB;
          
          // Distribute the error to neighboring pixels
          this.distributeError(resultData, width, height, x, y, errorR, errorG, errorB);
        }
      }
      
      return result;
    }
    
    private static distributeError(
      data: Uint8ClampedArray, 
      width: number, 
      height: number, 
      x: number, 
      y: number, 
      errorR: number, 
      errorG: number, 
      errorB: number
    ) {
      // Error distribution matrix for Floyd-Steinberg
      // [ - - * 7 ]
      // [ 3 5 1 - ]
      // * is the current pixel
      const distribution = [
        [1, 0, 7/16],  // right
        [-1, 1, 3/16], // left down
        [0, 1, 5/16],  // down
        [1, 1, 1/16]   // right down
      ];
      
      for (const [dx, dy, factor] of distribution) {
        const nx = x + dx;
        const ny = y + dy;
        
        // Check if the neighbor is within bounds
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 4;
          
          // Add the distributed error to the neighbor
          data[ni] = Math.max(0, Math.min(255, data[ni] + errorR * factor));
          data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + errorG * factor));
          data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + errorB * factor));
        }
      }
    }
    
    private static findClosestColor(rgb: [number, number, number], palette: string[]): [number, number, number] {
      let minDistance = Number.MAX_VALUE;
      let closestColor: [number, number, number] = [0, 0, 0];
      
      for (const hexColor of palette) {
        const paletteRgb = this.hexToRgb(hexColor);
        if (!paletteRgb) continue;
        
        const distance = 
          Math.pow(paletteRgb[0] - rgb[0], 2) + 
          Math.pow(paletteRgb[1] - rgb[1], 2) + 
          Math.pow(paletteRgb[2] - rgb[2], 2);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestColor = paletteRgb;
        }
      }
      
      return closestColor;
    }
    
    static hexToRgb(hex: string): [number, number, number] | null {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result 
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
          ]
        : null;
    }
}