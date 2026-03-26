import TcpSocket from 'react-native-tcp-socket';
import { getWebUI } from './webUI';
import { WSMessage } from '../types';

const HTTP_PORT = 5500;
const WS_PORT = 5501;

let server: any = null;

function buildResponse(
  statusCode: number,
  statusText: string,
  contentType: string,
  body: string | Buffer
): Buffer {
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  const header = [
    `HTTP/1.1 ${statusCode} ${statusText}`,
    `Content-Type: ${contentType}`,
    `Content-Length: ${bodyBuffer.length}`,
    'Connection: close',
    'Access-Control-Allow-Origin: *',
    '\r\n',
  ].join('\r\n');

  return Buffer.concat([Buffer.from(header, 'utf8'), bodyBuffer]);
}

function parseRequest(data: Buffer): {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: Buffer;
} {
  const str = data.toString('utf8');
  const headerEnd = str.indexOf('\r\n\r\n');
  const headerSection = str.slice(0, headerEnd);
  const lines = headerSection.split('\r\n');
  const [method, path] = lines[0].split(' ');

  const headers: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const colonIdx = lines[i].indexOf(':');
    if (colonIdx !== -1) {
      const key = lines[i].slice(0, colonIdx).trim().toLowerCase();
      const val = lines[i].slice(colonIdx + 1).trim();
      headers[key] = val;
    }
  }

  const body = data.slice(headerEnd + 4);
  return { method, path, headers, body };
}

export function startHTTPServer(
  onFileReceived: (msg: WSMessage) => void
): void {
  server = TcpSocket.createServer((socket: any) => {
    let buffer = Buffer.alloc(0);

    socket.on('data', (data: Buffer) => {
      buffer = Buffer.concat([buffer, data]);

      // Wait until we have the full headers
      if (!buffer.toString('utf8').includes('\r\n\r\n')) return;

      const req = parseRequest(buffer);

      // GET / → serve web UI
      if (req.method === 'GET' && req.path === '/') {
        const html = getWebUI(WS_PORT);
        const response = buildResponse(200, 'OK', 'text/html; charset=utf-8', html);
        socket.write(response, () => socket.destroy());
        return;
      }

      // POST /clip → receive file/image from browser
      if (req.method === 'POST' && req.path === '/clip') {
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);

        // Wait for full body
        if (buffer.length < buffer.indexOf('\r\n\r\n') + 4 + contentLength) return;

        try {
          const bodyStr = req.body.toString('utf8');
          const msg: WSMessage = JSON.parse(bodyStr);
          onFileReceived(msg);
          const response = buildResponse(200, 'OK', 'application/json', '{"ok":true}');
          socket.write(response, () => socket.destroy());
        } catch (e) {
          const response = buildResponse(400, 'Bad Request', 'application/json', '{"error":"invalid json"}');
          socket.write(response, () => socket.destroy());
        }
        return;
      }

      // 404 for everything else
      const response = buildResponse(404, 'Not Found', 'text/plain', 'Not found');
      socket.write(response, () => socket.destroy());
    });

    socket.on('error', () => {});
  });

  server.listen({ port: HTTP_PORT, host: '0.0.0.0' }, () => {
    console.log(`HTTP server listening on port ${HTTP_PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('HTTP server error:', err);
  });
}

export function stopHTTPServer(): void {
  server?.close();
  server = null;
}

export { HTTP_PORT, WS_PORT };