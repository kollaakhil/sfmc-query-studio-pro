// =============================================================================
// SFMC Query Studio Pro — Background Service Worker
// Handles keyboard commands, storage management, and extension lifecycle
// =============================================================================

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      if (command === 'format-sql') {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'format-sql' });
      } else if (command === 'save-snippet') {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'save-snippet' });
      }
    }
  });
});

// Install/update handler — set default settings
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      qspDarkMode: false,
      qspSnippets: [
        {
          id: 'default-1',
          name: 'Basic SELECT',
          sql: 'SELECT\n  SubscriberKey,\n  EmailAddress,\n  FirstName,\n  LastName\nFROM\n  [Your_Data_Extension]\nWHERE\n  Status = \'Active\'',
          createdAt: new Date().toISOString()
        },
        {
          id: 'default-2',
          name: 'JOIN Example',
          sql: 'SELECT\n  a.SubscriberKey,\n  a.EmailAddress,\n  b.OrderDate,\n  b.OrderTotal\nFROM\n  [Subscribers] a\nINNER JOIN\n  [Orders] b\n  ON a.SubscriberKey = b.SubscriberKey\nWHERE\n  b.OrderDate >= DATEADD(day, -30, GETDATE())',
          createdAt: new Date().toISOString()
        },
        {
          id: 'default-3',
          name: 'Deduplicate Records',
          sql: 'SELECT\n  SubscriberKey,\n  EmailAddress,\n  FirstName,\n  LastName\nFROM (\n  SELECT\n    *,\n    ROW_NUMBER() OVER (\n      PARTITION BY EmailAddress\n      ORDER BY DateAdded DESC\n    ) AS rn\n  FROM [Your_Data_Extension]\n) sub\nWHERE rn = 1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'default-4',
          name: 'Count by Segment',
          sql: 'SELECT\n  Segment,\n  COUNT(*) AS Total,\n  COUNT(CASE WHEN Status = \'Active\' THEN 1 END) AS ActiveCount\nFROM\n  [Your_Data_Extension]\nGROUP BY\n  Segment\nORDER BY\n  Total DESC',
          createdAt: new Date().toISOString()
        }
      ],
      qspHistory: []
    });
    console.log('[Query Studio Pro] Installed with default snippets');
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getSnippets') {
    chrome.storage.local.get({ qspSnippets: [] }, (data) => {
      sendResponse(data.qspSnippets);
    });
    return true;
  }

  if (msg.action === 'getHistory') {
    chrome.storage.local.get({ qspHistory: [] }, (data) => {
      sendResponse(data.qspHistory);
    });
    return true;
  }

  if (msg.action === 'clearHistory') {
    chrome.storage.local.set({ qspHistory: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (msg.action === 'exportSnippets') {
    chrome.storage.local.get({ qspSnippets: [] }, (data) => {
      sendResponse(JSON.stringify(data.qspSnippets, null, 2));
    });
    return true;
  }

  if (msg.action === 'importSnippets') {
    try {
      const snippets = JSON.parse(msg.data);
      chrome.storage.local.get({ qspSnippets: [] }, (data) => {
        const merged = [...data.qspSnippets, ...snippets];
        chrome.storage.local.set({ qspSnippets: merged }, () => {
          sendResponse({ success: true, count: snippets.length });
        });
      });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }
});
