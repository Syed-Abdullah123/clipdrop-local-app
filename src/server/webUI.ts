import { logoSvg } from './assets/logoSvg';
const faviconSvg = encodeURIComponent(logoSvg);
export const getWebUI = (wsPort: number): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${faviconSvg}" width="32" height="32" />
  <link href="https://fonts.cdnfonts.com/css/cabinet-grotesk" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
  <title>ClipDrop Local</title>
  <style>
    /* =========================================================
       RESET
       ========================================================= */
  
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
  
    :root {
      --font-primary: 'Manrope', sans-serif;
      --font-display: 'Cabinet Grotesk', sans-serif;
      --bg: #F4F0E8;
      --surface: #FFFFFF;
      --surface-alt: #FFF9E8;
      --black: #111111;
      --text: #111111;
      --muted: #666666;
      --muted-light: #888888;
      --blue: #4D7CFE;
      --green: #4ADE80;
      --yellow: #FFE14A;
      --pink: #FF6B6B;
      --purple: #C084FC;
      --border: 3px solid var(--black);
      --shadow-sm: 3px 3px 0px var(--black);
      --shadow-md: 5px 5px 0px var(--black);
      --shadow-lg: 7px 7px 0px var(--black);
    }
  
    /* =========================================================
       BODY
       ========================================================= */
  
    body {
      font-family: var(--font-primary);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
  
    /* =========================================================
       HEADER
       ========================================================= */
  
    header {
      padding: 18px 28px;
      background: var(--surface);
      border-bottom: var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
    }
  
    .app-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  
    .logo {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      background: var(--yellow);
      border: 2px solid var(--black);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .logo svg {
      width: 125%;
      height: 125%;
      display: block;
      transform: none;
    }
  
    .app-title h1 {
      margin: 0;
      font-size: 20px;
      font-family: var(--font-display);
      font-weight: 700;
      color: var(--black);
      letter-spacing: -0.5px;
    }
  
    .app-title h1 span {
      color: #42c773;
    }
  
    /* =========================================================
       SERVER STATUS
       ========================================================= */
  
    #status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--pink);
      display: inline-block;
      margin-right: 8px;
      border: 2px solid var(--black);
      transition: background 0.3s;
    }
  
    #status-dot.connected {
      background: var(--green);
    }
  
    #status-text {
      font-size: 11px;
      font-family: var(--font-primary);
      font-weight: 700;
      color: var(--black);
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
  
    /* =========================================================
       MAIN
       ========================================================= */
  
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-width: 760px;
      width: 100%;
      margin: 0 auto;
      padding: 30px 24px 50px;
      gap: 24px;
    }
  
    /* =========================================================
       INPUT CARD
       ========================================================= */
  
    .input-card {
      background: var(--surface);
      border: var(--border);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: var(--shadow-lg);
    }
  
    /* =========================================================
       TEXTAREA
       ========================================================= */
  
    textarea {
      width: 100%;
      min-height: 115px;
      background: var(--surface-alt);
      border: 2px solid var(--black);
      border-radius: 0;
      color: var(--black);
      font-size: 15px;
      font-family: var(--font-primary);
      font-weight: 500;
      padding: 14px;
      resize: vertical;
      outline: none;
      transition:
        background 0.15s ease,
        box-shadow 0.15s ease;
    }
  
    textarea:focus {
      background: #FFFFFF;
      box-shadow: 4px 4px 0px var(--yellow);
    }
  
    textarea::placeholder {
      color: #999999;
    }
  
    /* =========================================================
       ACTIONS
       ========================================================= */
  
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
  
    /* =========================================================
       BUTTON BASE
       ========================================================= */
  
    button {
      padding: 10px 18px;
      border-radius: 0;
      border: 2px solid var(--black);
      font-size: 12px;
      font-family: var(--font-primary);
      font-weight: 700;
      cursor: pointer;
      transition:
        transform 0.08s ease,
        box-shadow 0.08s ease,
        background 0.15s ease;
      box-shadow: var(--shadow-sm);
    }
  
    button:hover:not(:disabled) {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0px var(--black);
    }
  
    button:active:not(:disabled) {
      transform: translate(3px, 3px);
      box-shadow: 0px 0px 0px var(--black);
    }
  
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: 2px 2px 0px var(--black);
    }
  
    /* =========================================================
       SEND BUTTON
       ========================================================= */
  
    #send-btn {
      background: var(--green);
      color: var(--black);
      border-color: var(--black);
    }
  
    #send-btn:hover:not(:disabled) {
      background: #63ED91;
    }
  
    /* =========================================================
       FILE BUTTON
       ========================================================= */
  
    #file-btn {
      background: var(--yellow);
      color: var(--black);
      border-color: var(--black);
    }
  
    #file-btn:hover:not(:disabled) {
      background: #FFE96B;
    }
  
    #file-input {
      display: none;
    }
  
    /* =========================================================
       CLIP FEED HEADER
       ========================================================= */
  
    .feed-header {
      font-size: 12px;
      font-family: var(--font-primary);
      font-weight: 800;
      color: var(--black);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  
    .feed-header::before {
      content: '';
      width: 10px;
      height: 10px;
      background: var(--yellow);
      border: 2px solid var(--black);
    }
  
    /* =========================================================
       CLIP FEED
       ========================================================= */
  
    #clip-feed {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
  
    /* =========================================================
       CLIP CARD
       ========================================================= */
  
    .clip-item {
      background: var(--surface);
      border: var(--border);
      border-radius: 0;
      padding: 15px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-md);
      animation: fadeIn 0.2s ease;
      transition:
        transform 0.12s ease,
        box-shadow 0.12s ease;
    }
  
    .clip-item:hover {
      transform: translate(-1px, -1px);
      box-shadow: 7px 7px 0px var(--black);
    }
  
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
  
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  
    /* =========================================================
       SENT / RECEIVED
       ========================================================= */
  
    .clip-item.sent {
      border-left: 8px solid var(--blue);
    }
  
    .clip-item.received {
      border-left: 8px solid var(--green);
    }
  
    /* =========================================================
       CLIP META
       ========================================================= */
  
    .clip-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  
    /* =========================================================
       CLIP BADGES
       ========================================================= */
  
    .clip-badge {
      font-size: 9px;
      font-family: var(--font-primary);
      font-weight: 800;
      padding: 5px 8px;
      border: 2px solid var(--black);
      border-radius: 0;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--black);
    }
  
    .badge-text {
      background: #BFE0FF;
    }
  
    .badge-link {
      background: var(--green);
    }
  
    .badge-image {
      background: var(--purple);
    }
  
    .badge-file {
      background: var(--yellow);
    }
  
    /* =========================================================
       DIRECTION / TIME
       ========================================================= */
  
    .clip-direction {
      font-size: 10px;
      font-family: var(--font-primary);
      font-weight: 700;
      color: #555555;
      text-transform: uppercase;
    }
  
    .clip-time {
      font-size: 10px;
      font-family: var(--font-primary);
      font-weight: 500;
      color: #888888;
      margin-left: auto;
    }
  
    /* =========================================================
       CLIP CONTENT
       ========================================================= */
  
    .clip-content {
      font-size: 14px;
      color: var(--black);
      font-weight: 500;
      word-break: break-word;
      line-height: 1.6;
    }
  
    .clip-content a {
      color: #315DD8;
      font-weight: 700;
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 2px;
    }
  
    .clip-content a:hover {
      color: #1C46B0;
    }
  
    /* =========================================================
       IMAGES
       ========================================================= */
  
    .clip-image {
      background: #F4F0E8;
      border: 2px solid var(--black);
      padding: 6px;
    }
  
    .clip-image img {
      display: block;
      max-width: 100%;
      max-height: 320px;
      margin: 0 auto;
      object-fit: contain;
    }
  
    /* =========================================================
       COPY BUTTON
       ========================================================= */
  
    .copy-btn {
      align-self: flex-start;
      background: var(--yellow);
      color: var(--black);
      border: 2px solid var(--black);
      padding: 7px 13px;
      font-size: 10px;
      font-family: var(--font-primary);
      font-weight: 800;
      border-radius: 0;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      box-shadow: 2px 2px 0px var(--black);
    }
  
    .copy-btn:hover {
      color: var(--black);
      background: #FFE96B;
      box-shadow: 3px 3px 0px var(--black);
    }
  
    /* =========================================================
       DOWNLOAD BUTTON
       ========================================================= */
  
    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      align-self: flex-start;
      margin-top: 4px;
      padding: 8px 13px;
      background: var(--green);
      border: 2px solid var(--black);
      border-radius: 0;
      color: var(--black);
      font-size: 11px;
      font-family: var(--font-primary);
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 2px 2px 0px var(--black);
      transition:
        transform 0.08s ease,
        box-shadow 0.08s ease;
    }
  
    .download-btn:hover {
      background: #63ED91;
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0px var(--black);
    }
  
    .download-btn:active {
      transform: translate(2px, 2px);
      box-shadow: none;
    }
  
  
    /* =========================================================
       EMPTY STATE
       ========================================================= */
  
    .empty-state {
      text-align: center;
      color: #666666;
      font-size: 13px;
      font-family: var(--font-primary);
      padding: 48px 20px;
    }
  
    /* =========================================================
       DRAG & DROP OVERLAY
       ========================================================= */
  
    #drop-overlay {
      position: fixed;
      inset: 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(244, 240, 232, 0.94);
      border: 4px solid var(--black);
      box-shadow: 8px 8px 0 var(--black);
      color: var(--black);
      font-family: var(--font-primary);
      text-align: center;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition:
        opacity 0.15s ease,
        visibility 0.15s ease;
    }

    /* Inner drop card */
    #drop-overlay .drop-content {
      width: min(420px, calc(100% - 32px));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 36px 24px;
      background: var(--surface);
      border: var(--border);
      box-shadow: var(--shadow-lg);
      transform: translateY(8px) rotate(-1deg);
      transition: transform 0.15s ease;
    }

    /* Icon tile */
    #drop-overlay .drop-icon {
      width: 76px;
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--yellow);
      border: var(--border);
      box-shadow: var(--shadow-md);
      border-radius: 0;
      font-size: 36px;
      color: var(--black);
    }

    /* Main heading */
    #drop-overlay .drop-title {
      font-family: var(--font-display);
      font-size: clamp(24px, 4vw, 34px);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.8px;
      text-transform: uppercase;
    }

    /* Supporting text */
    #drop-overlay .drop-subtitle {
      max-width: 280px;
      font-family: var(--font-primary);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.7;
      color: var(--muted);
    }

    /* Small accent label */
    #drop-overlay .drop-content::after {
      content: "READY TO TRANSFER";
      display: inline-block;
      margin-top: 4px;
      padding: 7px 10px;
      background: var(--green);
      border: 2px solid var(--black);
      box-shadow: var(--shadow-sm);
      color: var(--black);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    /* Active drag state */
    #drop-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    #drop-overlay.visible .drop-content {
      transform: translateY(0) rotate(0deg);
    }

    /* Mobile adjustments */
    @media (max-width: 600px) {
      #drop-overlay {
        inset: 10px;
        border-width: 3px;
        box-shadow: 5px 5px 0 var(--black);
      }

      #drop-overlay .drop-content {
        padding: 28px 18px;
        gap: 12px;
        box-shadow: var(--shadow-md);
      }

      #drop-overlay .drop-icon {
        width: 64px;
        height: 64px;
        font-size: 30px;
      }

      #drop-overlay .drop-title {
        font-size: 25px;
      }
    }
  
    /* =========================================================
       UPLOAD PROGRESS
       ========================================================= */
  
    #upload-progress {
      display: none;
      flex-direction: column;
      gap: 7px;
      padding: 8px 0 2px;
    }
  
    #upload-progress.visible {
      display: flex;
    }
  
    .progress-label {
      font-size: 11px;
      font-family: var(--font-primary);
      font-weight: 700;
      color: #555555;
    }
  
    .progress-track {
      width: 100%;
      height: 10px;
      background: #FFFFFF;
      border: 2px solid var(--black);
      border-radius: 0;
      overflow: hidden;
    }
  
    .progress-fill {
      height: 100%;
      background: var(--green);
      transition: width 0.1s ease;
      width: 0%;
    }
  
    /* =========================================================
       INDETERMINATE PROGRESS
       ========================================================= */
  
    @keyframes indeterminate {
      0% {
        left: -40%;
        width: 40%;
      }
  
      100% {
        left: 100%;
        width: 40%;
      }
    }
  
    .progress-fill.indeterminate {
      position: relative;
      width: 40% !important;
      background: var(--yellow);
      animation: indeterminate 1s linear infinite;
    }
  
    /* =========================================================
       RESPONSIVE
       ========================================================= */
  
    @media (max-width: 600px) {
      header {
        padding: 16px 18px;
      }
  
      .app-title h1 {
        font-size: 18px;
      }
  
      main {
        padding: 22px 16px 40px;
        gap: 20px;
      }
  
      .input-card {
        padding: 14px;
        box-shadow: var(--shadow-md);
      }
  
      textarea {
        min-height: 100px;
        font-size: 14px;
      }
  
      .actions {
        gap: 8px;
      }
  
      button {
        padding: 9px 14px;
      }
  
      .clip-item {
        padding: 13px;
        box-shadow: 4px 4px 0px var(--black);
      }
  
      .clip-item:hover {
        transform: none;
        box-shadow: 4px 4px 0px var(--black);
      }
  
      .clip-image img {
        max-height: 240px;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="app-title">
      <div class="logo">
        ${logoSvg}
      </div>

      <h1>
        ClipDrop <span>Local</span>
      </h1>
    </div>

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

  <div id="drop-overlay">
    <div class="drop-content">
      <div class="drop-icon">↓</div>
      <div class="drop-title">Drop files here</div>
      <div class="drop-subtitle">
        Send files directly to your phone.
        Just drop them anywhere on the screen.
      </div>
    </div>
  </div>

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
    let dragCounter = 0;

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
    document.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer.types.length > 0) {
        dropOverlay.classList.add('visible');
      }
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        dropOverlay.classList.remove('visible');
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      dropOverlay.classList.remove('visible');
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
        return;
      }
      
      const text = e.dataTransfer.getData('text');
      if (text) {
        const isLink = /^https?:\/\//.test(text);
        sendMessage({
          type: isLink ? 'link' : 'text',
          content: text,
          id: generateId()
        });
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