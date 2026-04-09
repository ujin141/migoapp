import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Custom hook to handle App Tracking Transparency (ATT) on iOS.
 * Uses Capacitor's native bridge directly without the external plugin
 * to avoid peer dependency conflicts.
 */
export function useATT() {
  useEffect(() => {
    async function requestTrackingPermission() {
      if (Capacitor.getPlatform() !== 'ios') return;

      try {
        // Use the Capacitor native bridge to call ATT directly
        const { CapacitorHttp } = await import('@capacitor/core');
        void CapacitorHttp; // suppress unused warning

        // Dynamically attempt the native call — if the plugin is absent it silently skips
        const win = window as any;
        if (win?.webkit?.messageHandlers?.AppTrackingTransparency) {
          win.webkit.messageHandlers.AppTrackingTransparency.postMessage('requestPermission');
        }
      } catch {
        // ATT not available in this environment — silently ignore
      }
    }

    requestTrackingPermission();
  }, []);
}
