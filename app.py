import datetime
import html
import re
from flask import Flask, jsonify, render_template, request
import requests
import feedparser
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_text(raw_html):
    """Strip tags and get clean plain text snippet for tweeting."""
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)
    return text

def parse_entry(entry):
    title = entry.get("title", "No Title")
    link = entry.get("link", "https://cloud.google.com/bigquery/docs/release-notes")
    updated = entry.get("updated", "")
    
    # Format date cleanly if possible
    formatted_date = updated
    if updated:
        try:
            # RSS / Atom ISO format parsing
            dt = datetime.datetime.fromisoformat(updated.replace("Z", "+00:00"))
            formatted_date = dt.strftime("%B %d, %Y")
        except Exception:
            formatted_date = updated[:10] if len(updated) >= 10 else updated

    # Extract full html content
    content_val = ""
    if "content" in entry and len(entry.content) > 0:
        content_val = entry.content[0].get("value", "")
    elif "summary" in entry:
        content_val = entry.summary

    plain_snippet = clean_html_text(content_val)
    if len(plain_snippet) > 200:
        tweet_summary = plain_snippet[:197] + "..."
    else:
        tweet_summary = plain_snippet

    # Categorize tag if present in title (e.g. FEATURE, CHANGED, FIXED, ANNOUNCEMENT)
    category = "UPDATE"
    tag_match = re.search(r'^\s*\[?(FEATURE|CHANGED|FIXED|ANNOUNCEMENT|DEPRECATED|SECURITY)\]?', title, re.IGNORECASE)
    if tag_match:
        category = tag_match.group(1).upper()

    return {
        "id": entry.get("id", link + str(updated)),
        "title": title,
        "category": category,
        "link": link,
        "date": formatted_date,
        "raw_date": updated,
        "content_html": content_val,
        "tweet_summary": tweet_summary
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        # Fetch RSS Feed with timeout
        resp = requests.get(FEED_URL, timeout=10, headers={"User-Agent": "BigQueryReleaseNotesApp/1.0"})
        resp.raise_for_status()
        
        feed = feedparser.parse(resp.content)
        entries = [parse_entry(e) for e in feed.entries]
        
        return jsonify({
            "status": "success",
            "count": len(entries),
            "feed_title": feed.feed.get("title", "BigQuery Release Notes"),
            "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "notes": entries
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
