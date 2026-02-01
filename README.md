# ⚡ SFMC Query Studio Pro

The ultimate SQL editor for Salesforce Marketing Cloud developers.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Chrome%20Extension%20%2B%20Standalone-orange)
![SFMC](https://img.shields.io/badge/Salesforce-Marketing%20Cloud-00A1E0)

## ✨ Features

### SQL Editor
- 🎨 **Syntax Highlighting** — SQL keywords, SFMC functions, strings, numbers, comments
- 📝 **Smart Autocomplete** — Context-aware suggestions for keywords, functions, and DE patterns
- 🔧 **SQL Formatter** — One-click beautification with proper indentation
- 📊 **Line Numbers** — Full gutter with line numbering
- ⌨️ **Keyboard Shortcuts** — Format, save, copy, and more
- 🌙 **Dark/Light Mode** — Eye-friendly themes for any environment

### SFMC-Specific
- 📋 **15+ Query Templates** — Pre-built for common SFMC tasks (dedup, engagement, bounces, journeys...)
- 🔍 **SFMC Function Highlighting** — DATEADD, CONVERT, ROW_NUMBER, and all SFMC SQL functions
- 📖 **System Data Views Reference** — Complete field reference for _Subscribers, _Open, _Click, _Bounce, _Sent, _Unsubscribe, _Complaint, _Job
- ⚠️ **SFMC SQL Validation** — Catches common mistakes (missing TOP, LIMIT vs TOP, SELECT *)

### Productivity
- 💾 **Snippet Library** — Save, organize, and reuse your queries
- 📜 **Query History** — Auto-saves your last 30 queries
- 📋 **Copy to Clipboard** — One-click copy
- 📥 **Import/Export** — Load and save .sql files
- 🔎 **Find & Replace** — Search within your queries

## 🚀 Installation

### Chrome Extension
1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer Mode** (top right)
4. Click **Load unpacked**
5. Select the `query-studio-pro` folder
6. Navigate to any SFMC Query Activity page — the editor auto-enhances!

### Standalone (No Extension Needed)
1. Open `standalone/index.html` in any browser
2. Or host it on an **SFMC CloudPage** for team-wide access
3. Works 100% offline — zero external dependencies

### Test Environment
Don't have SFMC access? No problem:
1. Open `test/index.html` — a realistic SFMC Query Activity simulator
2. The Chrome extension will detect and enhance it automatically

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+F` | Format SQL |
| `Ctrl+Shift+S` | Save as snippet |
| `Ctrl+Shift+C` | Copy to clipboard |
| `Ctrl+F` | Find & Replace |
| `Tab` | Insert spaces |
| `Escape` | Close autocomplete/panels |

## 📋 Included SFMC Templates

| Template | Description |
|----------|-------------|
| Deduplicate Subscribers | Remove duplicate emails keeping latest |
| Open Activity (30 days) | Subscribers who opened recently |
| Click No Convert | Clicked but didn't convert |
| Engagement Scoring | Score subscribers by engagement |
| Bounce Analysis | Analyze bounce types and trends |
| Unsubscribe Trends | Track unsubscribe patterns |
| Journey Entry Audience | Build journey entry segments |
| DE Cleanup | Remove nulls and duplicates |
| Date Segmentation | Segment by date ranges |
| Cross-DE Lookup | Join data across extensions |
| Send Performance | Email send metrics summary |
| A/B Test Results | Compare A/B test variants |
| Preference Center | Subscriber preference data |
| Win-Back Audience | Identify lapsed subscribers |
| Subscriber Lifecycle | Full subscriber journey analysis |

## 🏗️ Project Structure

```
query-studio-pro/
├── manifest.json          # Chrome Extension manifest (V3)
├── content.js             # Content script — editor enhancement
├── background.js          # Service worker
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── styles.css             # Editor styles
├── icons/                 # Extension icons
├── standalone/
│   └── index.html         # Standalone editor (single file, no deps)
├── test/
│   ├── index.html         # SFMC simulator for testing
│   └── run-test.sh        # Test runner script
└── README.md
```

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built by [Akhil Kolla](https://github.com/kollaakhil) — SFMC Developer & Architect
