export const getWebUI = (wsPort: number): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ClipDrop Local</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #e8e8e8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      padding: 20px 24px;
      border-bottom: 1px solid #1e1e1e;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    header h1 {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      letter-spacing: -0.3px;
    }

    #status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff4444;
      display: inline-block;
      margin-right: 8px;
      transition: background 0.3s;
    }

    #status-dot.connected { background: #4ade80; }

    #status-text {
      font-size: 13px;
      color: #666;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-width: 720px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      gap: 20px;
    }

    /* Input area */
    .input-card {
      background: #161616;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    textarea {
      width: 100%;
      min-height: 100px;
      background: #0f0f0f;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #e8e8e8;
      font-size: 15px;
      font-family: inherit;
      padding: 12px;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }

    textarea:focus { border-color: #444; }
    textarea::placeholder { color: #444; }

    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    button {
      padding: 9px 18px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }

    button:active { transform: scale(0.97); }
    button:disabled { opacity: 0.4; cursor: not-allowed; }

    #send-btn {
      background: #fff;
      color: #0f0f0f;
    }

    #send-btn:hover:not(:disabled) { opacity: 0.88; }

    #file-btn {
      background: #1e1e1e;
      color: #e8e8e8;
      border: 1px solid #2a2a2a;
    }

    #file-btn:hover { background: #252525; }

    #file-input { display: none; }

    /* Clip feed */
    .feed-header {
      font-size: 12px;
      font-weight: 500;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    #clip-feed {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .clip-item {
      background: #161616;
      border: 1px solid #1e1e1e;
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .clip-item.sent { border-left: 2px solid #3b82f6; }
    .clip-item.received { border-left: 2px solid #4ade80; }

    .clip-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .clip-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-text     { background: #1e2a3a; color: #60a5fa; }
    .badge-link     { background: #1a2e1a; color: #4ade80; }
    .badge-image    { background: #2a1e2e; color: #c084fc; }
    .badge-file     { background: #2a2a1e; color: #facc15; }

    .clip-direction {
      font-size: 11px;
      color: #444;
    }

    .clip-time {
      font-size: 11px;
      color: #444;
      margin-left: auto;
    }

    .clip-content {
      font-size: 14px;
      color: #ccc;
      word-break: break-all;
      line-height: 1.5;
    }

    .clip-content a {
      color: #60a5fa;
      text-decoration: none;
    }

    .clip-content a:hover { text-decoration: underline; }

    .clip-image img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 6px;
      margin-top: 4px;
      object-fit: contain;
    }

    .copy-btn {
      align-self: flex-start;
      background: #1e1e1e;
      color: #888;
      border: 1px solid #2a2a2a;
      padding: 4px 12px;
      font-size: 12px;
      border-radius: 6px;
    }

    .copy-btn:hover { color: #e8e8e8; background: #252525; }

    .empty-state {
      text-align: center;
      color: #333;
      font-size: 14px;
      padding: 40px 0;
    }

    /* Drop overlay */
    #drop-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(59, 130, 246, 0.08);
      border: 2px dashed #3b82f6;
      border-radius: 0;
      z-index: 100;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #3b82f6;
      pointer-events: none;
    }

    #drop-overlay.visible { display: flex; }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 6px 14px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 7px;
      color: #4ade80;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
    }

    .download-btn:hover { background: #252525; }

     #upload-progress {
      display: none;
      flex-direction: column;
      gap: 6px;
      padding: 10px 0 4px;
    }

    #upload-progress.visible { display: flex; }

    .progress-label {
      font-size: 12px;
      color: #666;
    }

    .progress-track {
      width: 100%;
      height: 4px;
      background: #1e1e1e;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #4ade80;
      border-radius: 2px;
      transition: width 0.1s ease;
      width: 0%;
    }

    @keyframes indeterminate {
      0%   { left: -40%; width: 40%; }
      100% { left: 100%; width: 40%; }
    }

    .progress-fill.indeterminate {
      position: relative;
      width: 40% !important;
      animation: indeterminate 1s linear infinite;
    }
  </style>
</head>
<body>
  <header>
    <h1>📋 ClipDrop Local</h1>
    <div style="display:flex;align-items:center;gap:6px">
      <span id="status-dot"></span>
      <span id="status-text">Connecting...</span>
    </div>
  </header>

  <main>
    <div class="input-card">
      <textarea id="text-input" placeholder="Paste text, links, or drop files anywhere on the page..."></textarea>
      <div class="actions">
        <button id="send-btn" disabled>Send to Phone</button>
        <button id="file-btn">Attach Image / File</button>
        <input type="file" id="file-input" accept="*/*" />
      </div>

      <div id="upload-progress">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="progress-label" id="progress-label">Reading file...</span>
          <span class="progress-label" id="progress-pct">0%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
      </div>
    </div>

    <div class="feed-header">Clip feed</div>
    <div id="clip-feed">
      <div class="empty-state" id="empty-state">Nothing yet — send something from your phone or type above</div>
    </div>
  </main>

  <div id="drop-overlay">Drop to send to phone</div>

  <script>
    const WS_URL = 'ws://' + location.hostname + ':${wsPort}';
    let ws = null;
    let reconnectTimer = null;

    const statusDot  = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const sendBtn    = document.getElementById('send-btn');
    const textInput  = document.getElementById('text-input');
    const clipFeed   = document.getElementById('clip-feed');
    const emptyState = document.getElementById('empty-state');
    const fileInput  = document.getElementById('file-input');
    const dropOverlay = document.getElementById('drop-overlay');

    // --- WebSocket ---
    function connect() {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        sendBtn.disabled = false;
        clearTimeout(reconnectTimer);
      };

      ws.onclose = () => {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Reconnecting...';
        sendBtn.disabled = true;
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ping') { ws.send(JSON.stringify({ type: 'pong', id: msg.id })); return; }
          addClipItem(msg, 'received');
        } catch(e) {}
      };
    }

    // --- Send ---
    function sendMessage(msg) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
        addClipItem(msg, 'sent');
      }
    }

    function generateId() {
      return Math.random().toString(36).slice(2, 10);
    }

    sendBtn.addEventListener('click', () => {
      const text = textInput.value.trim();
      if (!text) return;
      const isLink = /^https?:\\/\\//.test(text);
      sendMessage({ type: isLink ? 'link' : 'text', content: text, id: generateId() });
      textInput.value = '';
    });

    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendBtn.click();
    });

    // --- File / Image ---
    document.getElementById('file-btn').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) handleFile(fileInput.files[0]);
    });

    function handleFile(file) {
      const uploadProgress = document.getElementById('upload-progress');
      const progressFill   = document.getElementById('progress-fill');
      const progressLabel  = document.getElementById('progress-label');
      const progressPct    = document.getElementById('progress-pct');

      if (!uploadProgress || !progressFill || !progressLabel || !progressPct) {
        console.error('Progress elements not found');
        return;
      }

      // Reset and show
      progressFill.classList.remove('indeterminate');
      progressFill.style.width = '0%';
      progressLabel.textContent = 'Reading ' + file.name + '...';
      progressPct.textContent = '0%';
      uploadProgress.classList.add('visible');
      sendBtn.disabled = true;

      const reader = new FileReader();

      // Show real read percentage
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = pct + '%';
          progressPct.textContent = pct + '%';
        }
      };

      reader.onload = () => {
        // Reading done — switch to indeterminate for send phase
        progressLabel.textContent = 'Sending ' + file.name + '...';
        progressPct.textContent = '';
        progressFill.classList.add('indeterminate');

        const base64 = reader.result.split(',')[1];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');

        let type = 'file';
        if (isImage) type = 'image';
        else if (isVideo) type = 'video';
        else if (isAudio) type = 'audio';

        sendMessage({
          type,
          content: base64,
          filename: file.name,
          mimeType: file.type,
          id: generateId(),
        });

        // Done
        progressFill.classList.remove('indeterminate');
        progressFill.style.width = '100%';
        progressLabel.textContent = 'Sent!';
        progressPct.textContent = '✓';

        setTimeout(() => {
          uploadProgress.classList.remove('visible');
          progressFill.style.width = '0%';
          progressPct.textContent = '';
          sendBtn.disabled = false;
        }, 1200);
      };

      reader.onerror = () => {
        uploadProgress.classList.remove('visible');
        progressFill.style.width = '0%';
        progressFill.classList.remove('indeterminate');
        progressLabel.textContent = 'Failed to read file';
        progressPct.textContent = '';
        sendBtn.disabled = false;
      };

      reader.readAsDataURL(file);
    }

    // --- Drag & Drop ---
    document.addEventListener('dragover', (e) => { e.preventDefault(); dropOverlay.classList.add('visible'); });
    document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) dropOverlay.classList.remove('visible'); });
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      dropOverlay.classList.remove('visible');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
      const text = e.dataTransfer.getData('text');
      if (text && !file) {
        const isLink = /^https?:\\/\\//.test(text);
        sendMessage({ type: isLink ? 'link' : 'text', content: text, id: generateId() });
      }
    });

    // --- Clip feed rendering ---
    function addClipItem(msg, direction) {
      if (emptyState) emptyState.remove();

      const item = document.createElement('div');
      item.className = 'clip-item ' + direction;

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dirLabel = direction === 'sent' ? '↑ To phone' : '↓ From phone';

      let contentHTML = '';
      let downloadHTML = '';

      if (msg.type === 'image') {
        const src = 'data:' + msg.mimeType + ';base64,' + msg.content;
        contentHTML = '<div class="clip-image"><img src="' + src + '" alt="' + (msg.filename || 'image') + '"/></div>';
        downloadHTML = '<a class="download-btn" href="' + src + '" download="' + (msg.filename || 'image') + '">⬇ Download image</a>';
      } else if (msg.type === 'video') {
        const src = 'data:' + msg.mimeType + ';base64,' + msg.content;
        contentHTML =
          '<video controls style="width:100%;max-height:300px;border-radius:6px;margin-top:4px;background:#000">' +
            '<source src="' + src + '" type="' + msg.mimeType + '">' +
          '</video>';
        downloadHTML = '<a class="download-btn" href="' + src + '" download="' + (msg.filename || 'video') + '">⬇ Download video</a>';
      } else if (msg.type === 'audio') {
        const src = 'data:' + msg.mimeType + ';base64,' + msg.content;
        contentHTML =
          '<audio controls style="width:100%;margin-top:4px">' +
            '<source src="' + src + '" type="' + msg.mimeType + '">' +
          '</audio>';
        downloadHTML = '<a class="download-btn" href="' + src + '" download="' + (msg.filename || 'audio') + '">⬇ Download audio</a>';
      } else if (msg.type === 'file') {
        const src = 'data:' + (msg.mimeType || 'application/octet-stream') + ';base64,' + msg.content;
        contentHTML = '<div class="clip-content">📎 ' + (msg.filename || 'File') + '</div>';
        downloadHTML = '<a class="download-btn" href="' + src + '" download="' + (msg.filename || 'file') + '">⬇ Download file</a>';
      } else if (msg.type === 'link') {
        contentHTML = '<div class="clip-content"><a href="' + msg.content + '" target="_blank" rel="noopener">' + msg.content + '</a></div>';
      } else {
        contentHTML = '<div class="clip-content">' + msg.content + '</div>';
      }

      const showCopy = msg.type === 'text' || msg.type === 'link';

      item.innerHTML =
        '<div class="clip-meta">' +
          '<span class="clip-badge badge-' + msg.type + '">' + msg.type + '</span>' +
          '<span class="clip-direction">' + dirLabel + '</span>' +
          '<span class="clip-time">' + time + '</span>' +
        '</div>' +
        contentHTML +
        downloadHTML +
        (showCopy ? '<button class="copy-btn">Copy</button>' : '');

      if (showCopy) {
        const copyBtn = item.querySelector('.copy-btn');
        const contentToCopy = msg.content || '';
        copyBtn.addEventListener('click', function() {
          const ta = document.createElement('textarea');
          ta.value = contentToCopy;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          ta.style.top = '-9999px';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          const success = document.execCommand('copy');
          document.body.removeChild(ta);
          if (success) {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
          } else {
            copyBtn.textContent = 'Failed';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
          }
        });
      }

      clipFeed.prepend(item);
    }

    function copyContent(btn, text) {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      });
    }

    connect();
  </script>
</body>
</html>`;