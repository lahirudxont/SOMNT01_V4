import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  getAPIPrefix(): string {
    // Implement logic based on environment (e.g., window.location.origin)
    return window.location.origin;
  }

  setDecimalFormat(value: any): string {
    if (!value) return '';
    return parseFloat(value).toFixed(2);
  }

  setDateFormat(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  setDateFormatForSave(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  getParameterFromURL(url: string, parameter: string): string | null {
    const regex = new RegExp(`[?&]${parameter}=([^&#]*)`);
    const results = regex.exec(url);
    return results ? decodeURIComponent(results[1].replace(/\+/g, ' ')) : null;
  }
}
