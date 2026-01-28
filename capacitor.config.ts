import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9eb1bc327d674330b27a36a057f315d7',
  appName: 'app-elisa-portas',
  webDir: 'dist',
  server: {
    // Para desenvolvimento com hot-reload
    url: 'https://9eb1bc32-7d67-4330-b27a-36a057f315d7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
