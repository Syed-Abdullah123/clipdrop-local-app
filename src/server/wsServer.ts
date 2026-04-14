import TcpSocket from "react-native-tcp-socket";
import CryptoJS from "crypto-js";
import { WSMessage } from "../types";

// WebSocket frame parsing and building — we implement the WS protocol
// manually on top of raw TCP since react-native-tcp-socket gives us TCP only

const WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

// --- Helpers ---

function sha1Base64(str: string): string {
  const hash = CryptoJS.SHA1(str);
  return CryptoJS.enc.Base64.stringify(hash);
}

// Build a WebSocket frame from a string payload
function buildWSFrame(payload: string): Buffer {
  const data = Buffer.from(payload, "utf8");
  const len = data.length;

  let header: Buffer;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(len, 6);
  }

  return Buffer.concat([header, data]);
}

// Parse incoming WebSocket frames (handles masking from browser clients)
// function parseWSFrames(buffer: Buffer): {
//   messages: string[];
//   remaining: Buffer;
// } {
//   const messages: string[] = [];
//   let offset = 0;

//   while (offset < buffer.length) {
//     if (offset + 2 > buffer.length) break;

//     const byte1 = buffer[offset];
//     const byte2 = buffer[offset + 1];
//     const isMasked = (byte2 & 0x80) !== 0;
//     let payloadLen = byte2 & 0x7f;
//     let headerLen = 2;

//     if (payloadLen === 126) {
//       if (offset + 4 > buffer.length) break;
//       payloadLen = buffer.readUInt16BE(offset + 2);
//       headerLen = 4;
//     } else if (payloadLen === 127) {
//       if (offset + 10 > buffer.length) break;
//       // Read as two 32-bit numbers since JS doesn't do 64-bit int
//       const high = buffer.readUInt32BE(offset + 2);
//       const low = buffer.readUInt32BE(offset + 6);
//       payloadLen = high * 0x100000000 + low;
//       headerLen = 10;
//     }

//     const maskLen = isMasked ? 4 : 0;
//     const totalLen = headerLen + maskLen + payloadLen;

//     // Don't have the full frame yet — wait for more data
//     if (offset + totalLen > buffer.length) break;

//     const maskKey = isMasked
//       ? buffer.slice(offset + headerLen, offset + headerLen + 4)
//       : null;

//     const payload = Buffer.from(
//       buffer.slice(offset + headerLen + maskLen, offset + totalLen),
//     );

//     if (maskKey) {
//       for (let i = 0; i < payload.length; i++) {
//         payload[i] ^= maskKey[i % 4];
//       }
//     }

//     const opcode = byte1 & 0x0f;
//     if (opcode === 0x8) {
//       messages.push("__CLOSE__");
//     } else if (opcode === 0x1 || opcode === 0x2) {
//       messages.push(payload.toString("utf8"));
//     }

//     offset += totalLen;
//   }

//   // Return unprocessed remainder so it gets prepended to the next chunk
//   return { messages, remaining: buffer.slice(offset) };
// }

function parseWSFrames(buffer: Buffer, fragmentBuffer: Buffer | null): {
  messages: string[];
  remaining: Buffer;
  fragmentBuffer: Buffer | null
  startedFragment: boolean;
} {
  const messages: string[] = [];
  let offset = 0;
  let startedFragment = false;

  // Accumulate fragmented message fragments
  // let fragmentBuffer: Buffer | null = null;

  while (offset < buffer.length) {
    if (offset + 2 > buffer.length) break;

    const byte1 = buffer[offset];
    const byte2 = buffer[offset + 1];

    const fin = (byte1 & 0x80) !== 0;
    const opcode = byte1 & 0x0f;
    const isMasked = (byte2 & 0x80) !== 0;
    let payloadLen = byte2 & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      const high = buffer.readUInt32BE(offset + 2);
      const low = buffer.readUInt32BE(offset + 6);
      payloadLen = high * 0x100000000 + low;
      headerLen = 10;
    }

    const maskLen = isMasked ? 4 : 0;
    const totalLen = headerLen + maskLen + payloadLen;

    if (offset + totalLen > buffer.length) break;

    const maskKey = isMasked
      ? buffer.slice(offset + headerLen, offset + headerLen + 4)
      : null;

    const payload = Buffer.from(
      buffer.slice(offset + headerLen + maskLen, offset + totalLen)
    );

    if (maskKey) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    if (opcode === 0x8) {
      // Close frame
      messages.push('__CLOSE__');
    } else if (opcode === 0x1 || opcode === 0x2) {
      // Text or binary frame
      if (fin) {
        // Complete single-frame message
        messages.push(payload.toString('utf8'));
      } else {
        // First fragment of a multi-frame message
        fragmentBuffer = payload;
        startedFragment = true;
      }
    } else if (opcode === 0x0) {
      // Continuation frame
      if (fragmentBuffer) {
        fragmentBuffer = Buffer.concat([fragmentBuffer, payload]);
      }
      if (fin && fragmentBuffer) {
        // Last fragment — message is complete
        messages.push(fragmentBuffer.toString('utf8'));
        fragmentBuffer = null;
      }
    }
    // opcode 0x9 = ping, 0xA = pong — ignore both

    offset += totalLen;
  }

  return { messages, remaining: buffer.slice(offset), fragmentBuffer, startedFragment };
}

// --- WS Server ---

export type WSMessageHandler = (msg: WSMessage) => void;
export type ClientCountHandler = (count: number) => void;

interface WSClient {
  id: string;
  socket: any;
  handshakeDone: boolean;
  buffer: Buffer;
  fragmentBuffer: Buffer | null;
  pendingMsgId: string | null;  // tracks in-progress fragmented message
}

let server: any = null;
const clients: Map<string, WSClient> = new Map();
let messageHandler: WSMessageHandler | null = null;
let clientCountHandler: ClientCountHandler | null = null;

function broadcastToClients(msg: WSMessage, excludeId?: string) {
  const frame = buildWSFrame(JSON.stringify(msg));
  clients.forEach((client, id) => {
    if (id !== excludeId && client.handshakeDone) {
      try {
        client.socket.write(frame);
      } catch (e) {}
    }
  });
}

function handleHandshake(client: WSClient, data: Buffer): boolean {
  const request = data.toString("utf8");
  const keyMatch = request.match(/Sec-WebSocket-Key:\s*(.+)\r\n/i);
  if (!keyMatch) return false;

  const acceptKey = sha1Base64(keyMatch[1].trim() + WS_MAGIC);

  const response = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
    "\r\n",
  ].join("\r\n");

  client.socket.write(Buffer.from(response, "utf8"));
  return true;
}

export type WSProgressHandler = (
  id: string,
  type: string,
  filename?: string,
  mimeType?: string,
  bytesReceived?: number,
  totalBytes?: number,
) => void;

export function startWSServer(
  port: number,
  onMessage: WSMessageHandler,
  onClientCount: ClientCountHandler,
  onProgress?: WSProgressHandler,
): void {
  messageHandler = onMessage;
  clientCountHandler = onClientCount;

  server = TcpSocket.createServer((socket: any) => {
    const clientId = Math.random().toString(36).slice(2);
    const client: WSClient = {
      id: clientId,
      socket,
      handshakeDone: false,
      buffer: Buffer.alloc(0),
      fragmentBuffer: null,
      pendingMsgId: null, 
    };

    clients.set(clientId, client);
    clientCountHandler?.(clients.size);

    socket.on('data', (data: Buffer) => {
      client.buffer = Buffer.concat([client.buffer, data]);

      if (!client.handshakeDone) {
        const bufStr = client.buffer.toString('utf8');
        if (bufStr.includes('\r\n\r\n')) {
          const success = handleHandshake(client, client.buffer);
          if (success) {
            client.handshakeDone = true;
            client.buffer = Buffer.alloc(0);
          } else {
            socket.destroy();
            clients.delete(clientId);
          }
        }
        return;
      }
    
      const { messages, remaining, fragmentBuffer: newFragmentBuffer, startedFragment } =
        parseWSFrames(client.buffer, client.fragmentBuffer);
    
      client.buffer = remaining;
      client.fragmentBuffer = newFragmentBuffer;

      // Report fragment accumulation progress to UI
      if (client.pendingMsgId && newFragmentBuffer) {
        onProgress?.(
          client.pendingMsgId,
          '',
          undefined,
          undefined,
          newFragmentBuffer.length,
          undefined,
        );
      }
    
      // A new fragmented message just started — notify so UI can show pending card
      if (startedFragment && !client.pendingMsgId) {
        try {
          // Peek at the first bytes to extract id/type/filename from partial JSON
          const partial = newFragmentBuffer?.toString('utf8') ?? '';
          const idMatch = partial.match(/"id"\s*:\s*"([^"]+)"/);
          const typeMatch = partial.match(/"type"\s*:\s*"([^"]+)"/);
          const filenameMatch = partial.match(/"filename"\s*:\s*"([^"]+)"/);
          const mimeMatch = partial.match(/"mimeType"\s*:\s*"([^"]+)"/);
        
          if (idMatch && typeMatch) {
            client.pendingMsgId = idMatch[1];
            onProgress?.(
              idMatch[1],
              typeMatch[1],
              filenameMatch?.[1],
              mimeMatch?.[1],
            );
          }
        } catch {}
      }
    
      // If fragment completed, clear pending tracking
      if (client.pendingMsgId && messages.length > 0) {
        client.pendingMsgId = null;
      }
    
      messages.forEach((msg) => {
        if (msg === '__CLOSE__') {
          socket.destroy();
          return;
        }
        try {
          const parsed: WSMessage = JSON.parse(msg);
          if (parsed.type === 'pong') return;
          broadcastToClients(parsed, clientId);
          messageHandler?.(parsed);
        } catch (e) {}
      });
    });

    socket.on("close", () => {
      clients.delete(clientId);
      clientCountHandler?.(clients.size);
    });

    socket.on("error", () => {
      clients.delete(clientId);
      clientCountHandler?.(clients.size);
    });
  });

  server.listen({ port, host: "0.0.0.0" }, () => {
    console.log(`WS server listening on port ${port}`);
  });

  server.on("error", (err: any) => {
    console.error("WS server error:", err);
  });
}

export function stopWSServer(): void {
  clients.forEach((client) => {
    try {
      client.socket.destroy();
    } catch (e) {}
  });
  clients.clear();
  server?.close();
  server = null;
}

export function sendToClients(msg: WSMessage): void {
  broadcastToClients(msg);
}
