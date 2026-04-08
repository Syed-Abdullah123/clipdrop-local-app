import { useState, useEffect, useCallback, useRef } from 'react';
import { NetworkInfo } from 'react-native-network-info';
import { startHTTPServer, stopHTTPServer, HTTP_PORT, WS_PORT } from '../server/httpServer';
import { startWSServer, stopWSServer, sendToClients } from '../server/wsServer';
import { ClipItem, ServerState, WSMessage } from '../types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function detectType(msg: WSMessage): ClipItem['type'] {
  if (msg.type === 'image') return 'image';
  if (msg.type === 'file') return 'file';
  if (msg.type === 'link') return 'link';
  if (msg.type === 'audio') return 'audio'; // ✅ ADD THIS
  if (msg.type === 'video') return 'video'; // (optional but recommended)
  return 'text';
}

export function useLocalServer() {
  const [serverState, setServerState] = useState<ServerState>({
    isRunning: false,
    ipAddress: null,
    port: HTTP_PORT,
    connectedClients: 0,
  });

  const [clips, setClips] = useState<ClipItem[]>([]);
  const isStarted = useRef(false);

  // Add a clip item to the list
  const addClip = useCallback((msg: WSMessage, direction: ClipItem['direction']) => {
    const item: ClipItem = {
      id: msg.id || generateId(),
      type: detectType(msg),
      direction,
      content: msg.content ?? '',
      filename: msg.filename,
      mimeType: msg.mimeType,
      timestamp: Date.now(),
    };
    setClips((prev) => [item, ...prev]);
  }, []);

  // Called when browser sends something over WebSocket
  const handleIncomingMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'ping' || msg.type === 'pong') return;
    addClip(msg, 'received');
  }, [addClip]);

  // Called when browser sends a file over HTTP POST
  const handleFileReceived = useCallback((msg: WSMessage) => {
    addClip(msg, 'received');
    // Also push it to any other connected WS clients
    sendToClients(msg);
  }, [addClip]);

  // Update connected client count
  const handleClientCount = useCallback((count: number) => {
    setServerState((prev) => ({ ...prev, connectedClients: count }));
  }, []);

  // Start both servers
  const startServer = useCallback(async () => {
    if (isStarted.current) return;
    isStarted.current = true;

    const pickLocalIP = async (): Promise<string | null> => {
      const candidates = await Promise.all([
        NetworkInfo.getIPAddress(),
        NetworkInfo.getIPV4Address(),
      ]);

      // Prefer 192.168.x.x, then 10.x.x.x, then 172.16-31.x.x
      const local = candidates.find(
        (ip) =>
          ip &&
          (ip.startsWith("192.168.") ||
            ip.startsWith("10.") ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(ip)),
      );

      return local ?? candidates.find((ip) => ip !== null) ?? null;
    };

    try {
    //   const ip = await NetworkInfo.getIPAddress();
      const ip = await pickLocalIP();

      startHTTPServer(handleFileReceived);
      startWSServer(WS_PORT, handleIncomingMessage, handleClientCount);

      setServerState({
        isRunning: true,
        ipAddress: ip,
        port: HTTP_PORT,
        connectedClients: 0,
      });
    } catch (err) {
      console.error("Failed to start servers:", err);
      isStarted.current = false;
    }
  }, [handleFileReceived, handleIncomingMessage, handleClientCount]);

  // Stop both servers
  const stopServer = useCallback(() => {
    stopHTTPServer();
    stopWSServer();
    isStarted.current = false;
    setServerState((prev) => ({
      ...prev,
      isRunning: false,
      connectedClients: 0,
    }));
  }, []);

  // Send a clip from the phone to all browser clients
  const sendClip = useCallback((msg: Omit<WSMessage, 'id'>) => {
    const fullMsg: WSMessage = { ...msg, id: generateId() };
    sendToClients(fullMsg);
    addClip(fullMsg, 'sent');
  }, [addClip]);

  // Clear all clips
  const clearClips = useCallback(() => setClips([]), []);

  // Auto-start on mount, auto-stop on unmount
  useEffect(() => {
    startServer();
    return () => {
      stopServer();
    };
  }, []);

  return {
    serverState,
    clips,
    sendClip,
    clearClips,
    startServer,
    stopServer,
  };
}