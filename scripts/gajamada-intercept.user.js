// ==UserScript==
// @name         Gajamada API Intercept
// @namespace    https://github.com/Kilodash/eLidik-Paminal
// @version      1.0
// @description  Intercept semua fetch/XHR ke API Gajamada. Tampilkan di overlay.
// @match        https://gajamada-propam.polri.go.id/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const MAX_LOGS = 50;
  const logs = [];
  let overlay = null;
  let panel = null;
  let visible = true;

  // --- Style ---
  const style = document.createElement('style');
  style.textContent = `
    #gji-overlay {
      position: fixed; top: 10px; right: 10px; z-index: 999999;
      width: 520px; max-height: 70vh; overflow: hidden;
      background: #1a1a2e; color: #e0e0e0; font-family: monospace; font-size: 11px;
      border: 1px solid #0f3460; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
    }
    #gji-overlay * { box-sizing: border-box; margin: 0; padding: 0; }
    #gji-header {
      background: #0f3460; color: #fff; padding: 6px 10px; font-weight: bold;
      display: flex; justify-content: space-between; align-items: center; cursor: move;
      font-size: 12px;
    }
    #gji-header button {
      background: none; border: none; color: #fff; cursor: pointer; font-size: 14px; padding: 0 4px;
    }
    #gji-toolbar {
      display: flex; gap: 4px; padding: 4px 8px; background: #16213e; border-bottom: 1px solid #0f3460;
    }
    #gji-toolbar button {
      background: #0f3460; border: none; color: #ccc; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;
    }
    #gji-toolbar button:hover { background: #1a4080; }
    #gji-toolbar .gji-filter {
      flex: 1; background: #0a0a1a; border: 1px solid #333; color: #e0e0e0; padding: 2px 6px; border-radius: 3px; font-size: 10px;
    }
    #gji-list {
      flex: 1; overflow-y: auto; padding: 4px;
    }
    #gji-list::-webkit-scrollbar { width: 6px; }
    #gji-list::-webkit-scrollbar-thumb { background: #0f3460; border-radius: 3px; }
    .gji-entry {
      margin-bottom: 4px; border: 1px solid #333; border-radius: 4px; overflow: hidden;
    }
    .gji-entry-head {
      padding: 4px 8px; cursor: pointer; display: flex; gap: 6px; align-items: center;
    }
    .gji-entry-head .gji-method {
      font-weight: bold; min-width: 45px; padding: 1px 4px; border-radius: 2px; font-size: 10px;
    }
    .gji-method.GET { background: #1a5276; color: #a9cce3; }
    .gji-method.POST { background: #1e8449; color: #abebc6; }
    .gji-method.PUT { background: #b7950b; color: #fdebd0; }
    .gji-method.DELETE { background: #922b21; color: #f5b7b1; }
    .gji-method.PATCH { background: #6c3483; color: #d2b4de; }
    .gji-entry-head .gji-status {
      min-width: 30px; font-weight: bold; font-size: 10px;
    }
    .gji-status.s2xx { color: #2ecc71; }
    .gji-status.s4xx { color: #f39c12; }
    .gji-status.s5xx { color: #e74c3c; }
    .gji-status.s0 { color: #95a5a6; }
    .gji-entry-head .gji-url {
      flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #aaa;
    }
    .gji-entry-head .gji-time { color: #666; font-size: 10px; }
    .gji-entry-body {
      display: none; padding: 6px 8px; background: #0d1117; border-top: 1px solid #333;
      max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;
    }
    .gji-entry.expanded .gji-entry-body { display: block; }
    .gji-section { color: #58a6ff; font-weight: bold; margin-top: 4px; }
    .gji-copy {
      float: right; background: #0f3460; border: none; color: #ccc; padding: 1px 6px; border-radius: 2px; cursor: pointer; font-size: 9px;
    }
    .gji-copy:hover { background: #1a4080; }
    .gji-highlight { border-color: #f39c12 !important; box-shadow: 0 0 4px rgba(243,156,18,0.3); }
  `;
  (document.head || document.documentElement).appendChild(style);

  // --- Overlay ---
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'gji-overlay';
    overlay.innerHTML = `
      <div id="gji-header">
        <span>Gajamada Intercept (<span id="gji-count">0</span>)</span>
        <div>
          <button id="gji-toggle" title="Minimize/Maximize">_</button>
          <button id="gji-clear" title="Clear">C</button>
        </div>
      </div>
      <div id="gji-toolbar">
        <input class="gji-filter" id="gji-filter-input" placeholder="Filter URL..." />
        <button id="gji-export" title="Export JSON">Export</button>
      </div>
      <div id="gji-list"></div>
    `;
    (document.body || document.documentElement).appendChild(overlay);
    panel = overlay.querySelector('#gji-list');

    overlay.querySelector('#gji-toggle').addEventListener('click', () => {
      visible = !visible;
      panel.style.display = visible ? 'block' : 'none';
      overlay.querySelector('#gji-toolbar').style.display = visible ? 'flex' : 'none';
    });
    overlay.querySelector('#gji-clear').addEventListener('click', () => {
      logs.length = 0;
      panel.innerHTML = '';
      updateCount();
    });
    overlay.querySelector('#gji-export').addEventListener('click', exportLogs);
    overlay.querySelector('#gji-filter-input').addEventListener('input', applyFilter);

    // Drag
    let dragging = false,
      dx = 0,
      dy = 0;
    const header = overlay.querySelector('#gji-header');
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      dx = e.clientX - overlay.offsetLeft;
      dy = e.clientY - overlay.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      overlay.style.left = e.clientX - dx + 'px';
      overlay.style.top = e.clientY - dy + 'px';
      overlay.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => {
      dragging = false;
    });
  }

  function updateCount() {
    const c = document.getElementById('gji-count');
    if (c) c.textContent = logs.length;
  }

  function applyFilter() {
    const q = (document.getElementById('gji-filter-input')?.value || '').toLowerCase();
    [...panel.children].forEach((entry) => {
      const url = entry.dataset.url || '';
      entry.style.display = url.toLowerCase().includes(q) ? 'block' : 'none';
    });
  }

  function exportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gajamada-requests-${Date.now()}.json`;
    a.click();
  }

  function fmtBody(body) {
    if (!body) return '';
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return String(body);
    }
  }

  function addEntry(log) {
    logs.push(log);
    if (logs.length > MAX_LOGS) logs.shift();

    const entry = document.createElement('div');
    entry.className = 'gji-entry';
    entry.dataset.url = log.url;

    const isApi = log.url.includes('/api/v1/');
    if (
      isApi &&
      (log.method === 'PUT' ||
        log.method === 'POST' ||
        log.method === 'DELETE' ||
        log.method === 'PATCH')
    ) {
      entry.classList.add('gji-highlight');
    }

    const statusClass =
      log.status === 0 ? 's0' : log.status < 300 ? 's2xx' : log.status < 500 ? 's4xx' : 's5xx';

    entry.innerHTML = `
      <div class="gji-entry-head">
        <span class="gji-method ${log.method}">${log.method}</span>
        <span class="gji-status ${statusClass}">${log.status || '...'}</span>
        <span class="gji-url">${log.url.replace(/^https?:\/\/[^/]+/, '')}</span>
        <span class="gji-time">${log.time}</span>
      </div>
      <div class="gji-entry-body">
        <div class="gji-section">URL</div>
        <button class="gji-copy" data-copy="${escapeHtml(log.url)}">Copy</button>
        ${escapeHtml(log.url)}
        <div class="gji-section">Request Headers</div>
        <pre>${escapeHtml(JSON.stringify(log.reqHeaders || {}, null, 2))}</pre>
        <div class="gji-section">Request Body</div>
        <button class="gji-copy" data-copy="${escapeHtml(log.reqBody || '')}">Copy</button>
        <pre>${escapeHtml(fmtBody(log.reqBody))}</pre>
        <div class="gji-section">Response Status: ${log.status}</div>
        <div class="gji-section">Response Body</div>
        <pre>${escapeHtml((log.resBody || '').slice(0, 2000))}</pre>
      </div>
    `;

    entry.querySelector('.gji-entry-head').addEventListener('click', () => {
      entry.classList.toggle('expanded');
    });

    // Copy buttons
    entry.querySelectorAll('.gji-copy').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.copy || '');
      });
    });

    panel.insertBefore(entry, panel.firstChild);
    updateCount();
    applyFilter();
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- Intercept fetch ---
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = (init?.method || 'GET').toUpperCase();
    const reqHeaders = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => {
          reqHeaders[k] = v;
        });
      } else if (typeof init.headers === 'object') {
        Object.assign(reqHeaders, init.headers);
      }
    }
    let reqBody = null;
    if (init?.body) {
      reqBody = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
    }
    const time = new Date().toLocaleTimeString('id-ID');
    const log = { url, method, reqHeaders, reqBody, status: 0, resBody: null, time };
    addEntry(log);

    try {
      const res = await origFetch.apply(this, args);
      log.status = res.status;
      try {
        const clone = res.clone();
        log.resBody = await clone.text();
      } catch {}
      updateEntryStatus(log);
      return res;
    } catch (err) {
      log.status = 0;
      log.resBody = String(err);
      updateEntryStatus(log);
      throw err;
    }
  };

  // --- Intercept XMLHttpRequest ---
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._gji = {
      method: method.toUpperCase(),
      url,
      reqHeaders: {},
      reqBody: null,
      status: 0,
      resBody: null,
      time: new Date().toLocaleTimeString('id-ID'),
    };
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
    if (this._gji) this._gji.reqHeaders[k] = v;
    return origSetHeader.apply(this, [k, v]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (this._gji) {
      this._gji.reqBody = typeof body === 'string' ? body : JSON.stringify(body);
      addEntry(this._gji);
      this.addEventListener('load', () => {
        this._gji.status = this.status;
        this._gji.resBody = this.responseText;
        updateEntryStatus(this._gji);
      });
      this.addEventListener('error', () => {
        this._gji.status = 0;
        this._gji.resBody = 'Network error';
        updateEntryStatus(this._gji);
      });
    }
    return origSend.apply(this, [body]);
  };

  function updateEntryStatus(log) {
    const entries = panel.children;
    for (let i = 0; i < entries.length; i++) {
      if (
        entries[i].dataset.url === log.url &&
        entries[i].querySelector('.gji-time')?.textContent === log.time
      ) {
        const statusEl = entries[i].querySelector('.gji-status');
        if (statusEl) {
          statusEl.textContent = log.status || '...';
          statusEl.className =
            'gji-status ' +
            (log.status === 0
              ? 's0'
              : log.status < 300
                ? 's2xx'
                : log.status < 500
                  ? 's4xx'
                  : 's5xx');
        }
        const resEl = entries[i].querySelector('.gji-entry-body pre:last-child');
        if (resEl) resEl.textContent = (log.resBody || '').slice(0, 2000);
      }
    }
  }

  // --- Init ---
  if (document.body) {
    createOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', createOverlay);
  }

  console.log('[GJI] Gajamada API Intercept loaded. Klik tombol aksi di Gajamada, lihat overlay.');
})();
