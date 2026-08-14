let allNotes = [];
let activeCategory = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchReleaseNotes);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderNotes);
    }

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    setupCategoryFilters();
    setupModalListeners();
});

async function fetchReleaseNotes() {
    const refreshBtn = document.getElementById('refreshBtn');
    const feedContainer = document.getElementById('feedContainer');
    const lastUpdated = document.getElementById('lastUpdated');

    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    }

    if (!allNotes.length && feedContainer) {
        feedContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner-lg"></div>
                <p>Fetching latest BigQuery release notes...</p>
            </div>
        `;
    }

    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();

        if (data.status === 'success') {
            allNotes = data.notes;
            if (lastUpdated) {
                lastUpdated.textContent = `Updated ${data.last_updated.split(' ')[1]}`;
            }
            filterAndRenderNotes();
        } else {
            showError('Failed to fetch release notes: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        showError('Network error while connecting to server. Please try again.');
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

function setupCategoryFilters() {
    const filterContainer = document.getElementById('filterContainer');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
            document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.getAttribute('data-category');
            filterAndRenderNotes();
        }
    });
}

function filterAndRenderNotes() {
    const feedContainer = document.getElementById('feedContainer');
    const searchInput = document.getElementById('searchInput');
    const searchFilter = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!feedContainer) return;

    const filtered = allNotes.filter(note => {
        const matchesCategory = (activeCategory === 'ALL') || 
            (note.category.toUpperCase() === activeCategory.toUpperCase());

        const matchesSearch = !searchFilter || 
            note.title.toLowerCase().includes(searchFilter) ||
            note.tweet_summary.toLowerCase().includes(searchFilter);

        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <p>No release notes found matching your current filter.</p>
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = filtered.map(note => createNoteCardHTML(note)).join('');
}

function createNoteCardHTML(note) {
    const badgeClass = getBadgeClass(note.category);
    
    // Escaped title and summary for safe inline attribute
    const escapedSummary = escapeHtml(note.tweet_summary);
    const escapedTitle = escapeHtml(note.title);
    const escapedLink = escapeHtml(note.link);

    return `
        <article class="note-card" id="note-${escapeHtml(note.id)}">
            <div class="note-header">
                <div class="note-meta">
                    <span class="badge ${badgeClass}">${escapeHtml(note.category)}</span>
                    <span class="note-date">${escapeHtml(note.date)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-utility" onclick="copyNoteContent(this, '${escapedTitle}', '${escapedSummary}', '${escapedLink}')" title="Copy update snippet to clipboard">
                        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        <span>Copy</span>
                    </button>
                    <button class="btn-tweet" onclick="openTweetModal('${escapedTitle}', '${escapedSummary}', '${escapedLink}')">
                        <svg viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z"/></svg>
                        <span>Tweet</span>
                    </button>
                </div>
            </div>
            <h2 class="note-title">
                <a href="${escapedLink}" target="_blank" rel="noopener noreferrer">${escapedTitle}</a>
            </h2>
            <div class="note-body">
                ${note.content_html}
            </div>
        </article>
    `;
}

function getBadgeClass(category) {
    const cat = category.toUpperCase();
    if (cat.includes('FEATURE')) return 'badge-feature';
    if (cat.includes('CHANGED')) return 'badge-changed';
    if (cat.includes('FIXED')) return 'badge-fixed';
    if (cat.includes('DEPRECATED')) return 'badge-deprecated';
    return 'badge-default';
}

function openTweetModal(title, summary, link) {
    const tweetTextarea = document.getElementById('tweetTextarea');
    const modalBackdrop = document.getElementById('modalBackdrop');
    
    // Construct default tweet message
    const defaultTweet = `🚀 BigQuery Update: ${title}\n\n${summary}\n\n🔗 ${link} #GoogleCloud #BigQuery`;
    
    if (tweetTextarea) {
        tweetTextarea.value = defaultTweet;
        updateCharCounter();
    }
    
    if (modalBackdrop) {
        modalBackdrop.classList.add('active');
    }
}

function closeTweetModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) {
        modalBackdrop.classList.remove('active');
    }
}

function setupModalListeners() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const tweetTextarea = document.getElementById('tweetTextarea');
    const btnPostTweet = document.getElementById('btnPostTweet');

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeTweetModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) closeTweetModal();
        });
    }

    if (tweetTextarea) {
        tweetTextarea.addEventListener('input', updateCharCounter);
    }

    if (btnPostTweet) {
        btnPostTweet.addEventListener('click', () => {
            const text = tweetTextarea.value;
            const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(twitterIntentUrl, '_blank');
            closeTweetModal();
        });
    }
}

function updateCharCounter() {
    const tweetTextarea = document.getElementById('tweetTextarea');
    const charCounter = document.getElementById('charCounter');
    if (!tweetTextarea || !charCounter) return;

    const count = tweetTextarea.value.length;
    const remaining = 280 - count;
    charCounter.textContent = `${remaining} characters remaining`;

    charCounter.className = 'char-counter';
    if (remaining < 0) {
        charCounter.classList.add('danger');
    } else if (remaining < 30) {
        charCounter.classList.add('warning');
    }
}

function showError(message) {
    const feedContainer = document.getElementById('feedContainer');
    if (feedContainer) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <p style="color: #ef4444;">⚠️ ${escapeHtml(message)}</p>
            </div>
        `;
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (newTheme === 'light') {
            // Sun icon for light mode
            themeIcon.innerHTML = `<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>`;
        } else {
            // Moon icon for dark mode
            themeIcon.innerHTML = `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/>`;
        }
    }
}

async function copyNoteContent(btnElement, title, summary, link) {
    const textToCopy = `${title}\n\n${summary}\n\nLink: ${link}`;
    try {
        await navigator.clipboard.writeText(textToCopy);
        const span = btnElement.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        btnElement.style.borderColor = '#10b981';
        btnElement.style.color = '#10b981';
        setTimeout(() => {
            span.textContent = originalText;
            btnElement.style.borderColor = '';
            btnElement.style.color = '';
        }, 2000);
    } catch (err) {
        alert('Failed to copy text to clipboard');
    }
}

function exportToCSV() {
    const searchInput = document.getElementById('searchInput');
    const searchFilter = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = allNotes.filter(note => {
        const matchesCategory = (activeCategory === 'ALL') || 
            (note.category.toUpperCase() === activeCategory.toUpperCase());
        const matchesSearch = !searchFilter || 
            note.title.toLowerCase().includes(searchFilter) ||
            note.tweet_summary.toLowerCase().includes(searchFilter);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        alert('No notes available to export for the current view.');
        return;
    }

    const headers = ['Category', 'Date', 'Title', 'Summary', 'Link'];
    const csvRows = [headers.join(',')];

    filtered.forEach(note => {
        const row = [
            escapeCSV(note.category),
            escapeCSV(note.date),
            escapeCSV(note.title),
            escapeCSV(note.tweet_summary),
            escapeCSV(note.link)
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `BigQuery_Release_Notes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

function escapeCSV(str) {
    if (str === null || str === undefined) return '""';
    const escaped = String(str).replace(/"/g, '""');
    return `"${escaped}"`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
