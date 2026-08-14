# BigQuery Release Notes Web Application

A modern, responsive Flask web application that fetches live Google Cloud BigQuery Release Notes from the official RSS feed ([`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml)), cleans and categorizes updates, and enables instant sharing on Twitter/X, clipboard copying, CSV data export, and dark/light theme customization.

---

## 🌟 Key Features

- **Live RSS Fetching & Refresh**: Parses the official Google Cloud BigQuery Atom/XML feed in real-time. Includes an interactive refresh button with loading spinners.
- **Auto-Categorization & Filtering**: Automatically tags updates (`FEATURE`, `CHANGED`, `FIXED`, `ANNOUNCEMENT`) and provides category filter pills and live search.
- **Tweet Composer Integration**: Instant modal pre-populating clean text summaries, release title, links, and hashtags (`#GoogleCloud #BigQuery`) with character counting.
- **Utility Tools**:
  - **Copy to Clipboard**: Quick copy of release summaries for teams and notes.
  - **Export to CSV**: Downloads the currently filtered release notes feed into a clean CSV spreadsheet file.
- **Dark & Light Mode Toggle**: Smooth theme switching using dynamic CSS root variables (`:root` / `[data-theme="light"]`).

---

## 🏗 Architecture & Stack

- **Backend**: Python 3.14 + Flask (`app.py`), `requests`, `feedparser`, `beautifulsoup4`
- **Frontend**: HTML5, Vanilla JavaScript (`static/js/main.js`), Vanilla CSS3 (`static/css/main.css`)
- **Styling & Design System**: Custom HSL/HEX color tokens, glassmorphism cards, Google Fonts (*Plus Jakarta Sans*).

---

## 🚀 Quick Start & Installation

### 1. Clone Repository
```bash
git clone https://github.com/abdullahgill1172-stack/abdullahgill1172-stack-event-talks-app.git
cd abdullahgill1172-stack-event-talks-app
```

### 2. Set Up Virtual Environment & Dependencies
```bash
# Create venv
python -m venv .venv

# Activate venv (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate venv (Linux/macOS)
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 3. Run the Flask Web Application
```bash
python app.py
```
Open your browser and navigate to: **`http://127.0.0.1:5000`**

---

## 📜 Project Structure

```
bq-releases-notes/
├── app.py                  # Flask backend server & RSS feed parser endpoint
├── requirements.txt        # Python dependency declarations
├── .gitignore              # Ignored files for Git version control
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Main HTML structure and Twitter modal composer
└── static/
    ├── css/
    │   └── main.css        # CSS design system & light/dark theme variables
    └── js/
        └── main.js         # Client-side feed rendering, filters, theme toggle, export & Tweet logic
```

---

## 🛠 API Endpoints

### `GET /`
Renders the primary web interface (`index.html`).

### `GET /api/release-notes`
Fetches and returns parsed release notes as JSON:
```json
{
  "status": "success",
  "count": 30,
  "feed_title": "BigQuery release notes",
  "last_updated": "2026-08-14 20:30:00",
  "notes": [
    {
      "id": "...",
      "title": "[FEATURE] BigQuery Vector Search Enhancement",
      "category": "FEATURE",
      "date": "August 14, 2026",
      "link": "https://cloud.google.com/bigquery/docs/release-notes",
      "tweet_summary": "...",
      "content_html": "..."
    }
  ]
}
```

---

## 🤝 Author & License

Developed for BigQuery Release Tracking and Community Updates. Open-source under the MIT License.
