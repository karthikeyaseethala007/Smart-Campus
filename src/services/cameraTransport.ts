export interface CameraProbeResult {
  reachable: boolean;
  status: 'live' | 'offline' | 'simulation';
  error?: string;
}

export class CameraTransport {
  /**
   * Validates if a string is a properly formatted URL.
   */
  public static isValidUrl(url?: string): boolean {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url.trim());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Probes an external camera stream URL (such as an ESP32-CAM MJPEG endpoint: http://192.168.x.x:81/stream)
   * to verify whether real physical hardware is active and streaming.
   */
  public static async probeStream(url?: string, timeoutMs = 2500): Promise<CameraProbeResult> {
    if (!url || url.trim() === '') {
      return {
        reachable: false,
        status: 'simulation',
        error: 'No physical camera endpoint configured',
      };
    }

    const trimmedUrl = url.trim();

    return new Promise((resolve) => {
      let isSettled = false;
      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          resolve({
            reachable: false,
            status: 'offline',
            error: 'Camera stream unavailable (Connection timed out)',
          });
        }
      }, timeoutMs);

      // Attempt to load the stream or snapshot
      const testImg = new Image();

      testImg.onload = () => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          resolve({
            reachable: true,
            status: 'live',
          });
        }
      };

      testImg.onerror = () => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          resolve({
            reachable: false,
            status: 'offline',
            error: 'Camera stream unavailable (Endpoint unreachable or CORS blocked)',
          });
        }
      };

      // Add cache buster to test actual live stream connectivity
      const separator = trimmedUrl.includes('?') ? '&' : '?';
      testImg.src = `${trimmedUrl}${separator}_probe=${Date.now()}`;
    });
  }
}

export default CameraTransport;
