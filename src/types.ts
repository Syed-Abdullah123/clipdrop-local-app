export type ClipItemType = 'text' | 'link' | 'image' | 'video' | 'audio' | 'file';

export type ClipDirection = 'received' | 'sent';

export interface ClipItem {
  id: string;
  type: ClipItemType;
  direction: ClipDirection;
  content: string;        // text or link content, base64 string for images
  filename?: string;      // for images and files
  mimeType?: string;      // for images and files
  timestamp: number;
}

export interface ServerState {
  isRunning: boolean;
  ipAddress: string | null;
  port: number;
  connectedClients: number;
}

// WebSocket message shape — both phone and browser use this same structure
export interface WSMessage {
  type: 'text' | 'link' | 'image' | 'video' | 'audio' | 'file' | 'ping' | 'pong';
  content?: string;
  filename?: string;
  mimeType?: string;
  id: string;
}