// =============================================================================
// SFMC Query Studio Pro v2.0 — Popup Script
// Manages snippets, history, settings, and quick actions
// =============================================================================

(function () {
  'use strict';

  let isDarkMode = false;
  let settings = {
    fontSize: 13,
    tabSize: 2,
    autoFormatOnPaste: false
  };

  // ---------- Tab Navigation ----------
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // ---------- Dark Mode ----------
  function applyDarkMode(dark) {
    isDarkMode = dark;
    document.body.classList.toggle('dark', dark);
    const toggle = document.getElementById('dark-toggle');
    if (toggle) toggle.classList.toggle('on', dark);
    document.getElementById('toggle-dark').textContent = dark ? '☀️' : '🌙';
  }

  chrome.storage.local.get({ qspDarkMode: false, qspSettings: settings }, (data) => {
    applyDarkMode(data.qspDarkMode);
    settings = { ...settings, ...data.qspSettings };
    applySettings();
  });

  document.getElementById('toggle-dark').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyDarkMode(isDarkMode);
    chrome.storage.local.set({ qspDarkMode: isDarkMode });
  });

  document.getElementById('dark-toggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyDarkMode(isDarkMode);
    chrome.storage.local.set({ qspDarkMode: isDarkMode });
  });

  // ---------- Settings ----------
  function applySettings() {
    document.getElementById('font-size-slider').value = settings.fontSize;
    document.getElementById('font-size-value').textContent = settings.fontSize + 'px';
    document.getElementById('tab-size-select').value = settings.tabSize;
    document.getElementById('autoformat-toggle').classList.toggle('on', settings.autoFormatOnPaste);
  }

  function saveSettings() {
    chrome.storage.local.set({ qspSettings: settings });
  }

  document.getElementById('font-size-slider').addEventListener('input', (e) => {
    settings.fontSize = parseInt(e.target.value);
    document.getElementById('font-size-value').textContent = settings.fontSize + 'px';
    saveSettings();
  });

  document.getElementById('tab-size-select').addEventListener('change', (e) => {
    settings.tabSize = parseInt(e.target.value);
    saveSettings();
  });

  document.getElementById('autoformat-toggle').addEventListener('click', () => {
    settings.autoFormatOnPaste = !settings.autoFormatOnPaste;
    document.getElementById('autoformat-toggle').classList.toggle('on', settings.autoFormatOnPaste);
    saveSettings();
  });

  // ---------- Stats ----------
  function updateStats() {
    chrome.storage.local.get({ qspSnippets: [], qspHistory: [] }, (data) => {
      document.getElementById('snippet-count').textContent = data.qspSnippets.length;
      document.getElementById('history-count').textContent = data.qspHistory.length;
    });
  }

  updateStats();

  // ---------- Snippets ----------
  function loadSnippets(filter = '') {
    chrome.runtime.sendMessage({ action: 'getSnippets' }, (snippets) => {
      const list = document.getElementById('snippet-list');

      if (!snippets || snippets.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <div class="emoji">📝</div>
            <p>No snippets yet.<br>Save queries from the editor!</p>
          </div>
        `;
        return;
      }

      const filtered = filter
        ? snippets.filter(s =>
            s.name.toLowerCase().includes(filter.toLowerCase()) ||
            s.sql.toLowerCase().includes(filter.toLowerCase())
          )
        : snippets;

      if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>No matching snippets.</p></div>`;
        return;
      }

      list.innerHTML = filtered.map(s => `
        <div class="snippet-item" data-id="${s.id}">
          <div class="snippet-name">${escapeHtml(s.name)}</div>
          <div class="snippet-preview">${escapeHtml(s.sql.substring(0, 120))}</div>
          <div class="snippet-meta">
            <span>${formatDate(s.createdAt)}</span>
            <div class="snippet-actions">
              <button class="small-btn copy-snippet" data-sql="${encodeURIComponent(s.sql)}" title="Copy to clipboard">📋 Copy</button>
              <button class="small-btn danger delete-snippet" data-id="${s.id}" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');

      // Copy handlers
      list.querySelectorAll('.copy-snippet').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(decodeURIComponent(btn.dataset.sql));
          btn.textContent = '✅ Copied';
          setTimeout(() => btn.textContent = '📋 Copy', 1500);
        });
      });

      // Delete handlers
      list.querySelectorAll('.delete-snippet').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.storage.local.get({ qspSnippets: [] }, (data) => {
            const updated = data.qspSnippets.filter(s => s.id !== btn.dataset.id);
            chrome.storage.local.set({ qspSnippets: updated }, () => {
              loadSnippets(document.getElementById('snippet-search').value);
              updateStats();
            });
          });
        });
      });
    });
  }

  document.getElementById('snippet-search').addEventListener('input', (e) => {
    loadSnippets(e.target.value);
  });

  loadSnippets();

  // ---------- History ----------
  function loadHistory() {
    chrome.runtime.sendMessage({ action: 'getHistory' }, (history) => {
      const list = document.getElementById('history-list');
      const count = document.getElementById('history-count-label');

      if (!history || history.length === 0) {
        count.textContent = '0 queries';
        list.innerHTML = `
          <div class="empty-state">
            <div class="emoji">🕐</div>
            <p>No query history yet.</p>
          </div>
        `;
        return;
      }

      count.textContent = `${history.length} queries`;

      list.innerHTML = history.map(h => `
        <div class="history-item" data-sql="${encodeURIComponent(h.sql)}" title="Click to copy">
          ${escapeHtml(h.sql.substring(0, 140))}
          <div class="history-time">${formatDate(h.timestamp)}</div>
        </div>
      `).join('');

      list.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          navigator.clipboard.writeText(decodeURIComponent(item.dataset.sql));
          item.style.borderColor = 'var(--success)';
          item.style.background = 'var(--bg-hover)';
          setTimeout(() => {
            item.style.borderColor = '';
            item.style.background = '';
          }, 1500);
        });
      });
    });
  }

  loadHistory();

  // ---------- Quick Actions ----------
  document.getElementById('format-last').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getHistory' }, (history) => {
      if (history && history.length > 0) {
        navigator.clipboard.writeText(formatSQL(history[0].sql));
        document.getElementById('format-last').querySelector('span:last-child').textContent = 'Copied! ✅';
        setTimeout(() => {
          document.getElementById('format-last').querySelector('span:last-child').textContent = 'Format Last Query';
        }, 1500);
      }
    });
  });

  document.getElementById('clear-history-quick').addEventListener('click', () => {
    if (confirm('Clear all query history?')) {
      chrome.runtime.sendMessage({ action: 'clearHistory' }, () => {
        loadHistory();
        updateStats();
      });
    }
  });

  document.getElementById('clear-history').addEventListener('click', () => {
    if (confirm('Clear all query history?')) {
      chrome.runtime.sendMessage({ action: 'clearHistory' }, () => {
        loadHistory();
        updateStats();
      });
    }
  });

  // ---------- Import/Export ----------
  document.getElementById('export-snippets').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'exportSnippets' }, (json) => {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qsp-snippets.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  document.getElementById('import-snippets').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      chrome.runtime.sendMessage(
        { action: 'importSnippets', data: ev.target.result },
        (resp) => {
          if (resp && resp.success) {
            loadSnippets();
            updateStats();
            alert(`Imported ${resp.count} snippets!`);
          } else {
            alert('Import failed: ' + (resp ? resp.error : 'Unknown error'));
          }
        }
      );
    };
    reader.readAsText(file);
  });

  // Rate link placeholder
  document.getElementById('rate-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Rating will be available once published to the Chrome Web Store!');
  });

  // ---------- Simple SQL Formatter (for quick action) ----------
  function formatSQL(sql) {
    if (!sql || !sql.trim()) return sql;
    let f = sql.trim().replace(/\s+/g, ' ');
    const clauses = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'INNER JOIN', 'ORDER BY', 'GROUP BY', 'HAVING', 'UNION ALL', 'UNION',
      'ON', 'AND', 'OR', 'SET'
    ].sort((a, b) => b.length - a.length);
    for (const c of clauses) {
      f = f.replace(new RegExp(`\\b(${c.replace(/ /g, '\\s+')})\\b`, 'gi'), '\n' + c.toUpperCase());
    }
    return f.split('\n').filter(l => l.trim()).map(l => {
      const u = l.trim().toUpperCase();
      if (['ON', 'AND', 'OR', 'SET'].some(k => u.startsWith(k))) return '  ' + l.trim();
      return l.trim();
    }).join('\n');
  }

  // ---------- Utilities ----------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  }
})();
