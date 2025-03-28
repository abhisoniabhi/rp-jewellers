import html2canvas from 'html2canvas';
import { RateInfo } from '@/components/ui/rate-card';

interface ScreenshotOptions {
  includeShopName?: boolean;
  includeTimestamp?: boolean;
  includeWatermark?: boolean;
  backgroundColor?: string;
}

const defaultOptions: ScreenshotOptions = {
  includeShopName: true,
  includeTimestamp: true,
  includeWatermark: true,
  backgroundColor: '#ffffff',
};

export async function generateRatesScreenshot(
  ratesData: RateInfo[],
  elementId: string,
  options: ScreenshotOptions = defaultOptions
): Promise<string> {
  try {
    // Find the element to screenshot
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    // Generate screenshot with html2canvas
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor,
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
    });

    // Convert canvas to data URL (PNG image)
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating screenshot:', error);
    throw error;
  }
}

export function downloadScreenshot(dataUrl: string, fileName: string = 'gold-rates.png'): void {
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
}

export function shareScreenshot(dataUrl: string, title: string = 'Today\'s Gold & Silver Rates'): Promise<void> {
  return new Promise((resolve, reject) => {
    // Convert data URL to blob for sharing
    const blob = dataURLtoBlob(dataUrl);
    const file = new File([blob], 'gold-rates.png', { type: 'image/png' });
    
    if (navigator.share) {
      navigator.share({
        title: title,
        files: [file],
      })
      .then(() => resolve())
      .catch((error) => reject(error));
    } else {
      // Fallback if Web Share API is not available
      downloadScreenshot(dataUrl);
      resolve();
    }
  });
}

// Helper to convert data URL to Blob
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}