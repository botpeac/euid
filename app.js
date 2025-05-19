const body = document.body;
const modeRadios = document.querySelectorAll('input[name="colorMode"]');
const fileInput = document.getElementById('fileInput');
const loadButton = document.getElementById('loadButton');
const contentDiv = document.getElementById('content');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const showTextPosts = document.getElementById('showTextPosts');
const showLinkPosts = document.getElementById('showLinkPosts');
const sortBy = document.getElementById('sortBy');
const searchInput = document.getElementById('searchInput');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const lineHeightSelect = document.getElementById('lineHeightSelect');
const postCountDiv = document.getElementById('postCount');
const paginationDiv = document.querySelector('.pagination');

// New global variables for enhanced functionality
let readPosts = new Set();
let savedPosts = new Set();
let readingProgress = {};
let lastReadPosition = null;

let rawData = [];
let filteredData = [];
let currentPage = 1;
const pageSize = 10;
let lastScrollY = 0;

// Load stored data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    addSavedFilter();
    addResumeReadingButton();
    setupTouchGestures();
});

// Function to load stored data from localStorage
function loadStoredData() {
    if (localStorage.getItem('readPosts')) {
        readPosts = new Set(JSON.parse(localStorage.getItem('readPosts')));
    }
    
    if (localStorage.getItem('savedPosts')) {
        savedPosts = new Set(JSON.parse(localStorage.getItem('savedPosts')));
    }
    
    if (localStorage.getItem('readingProgress')) {
        readingProgress = JSON.parse(localStorage.getItem('readingProgress'));
    }
    
    if (localStorage.getItem('lastReadPosition')) {
        lastReadPosition = JSON.parse(localStorage.getItem('lastReadPosition'));
    }
}

modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        body.classList.remove('dark-gray', 'true-black');
        if (radio.checked) {
            if (radio.value === 'dark-gray') body.classList.add('dark-gray');
            if (radio.value === 'true-black') body.classList.add('true-black');
        }
    });
});

fileInput.addEventListener('change', () => {
    loadButton.disabled = !fileInput.files[0];
});

loadButton.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split('\n').filter(line => line.trim());
        rawData = [];
        let skipped = 0;
        for (const line of lines) {
            try {
                rawData.push(JSON.parse(line));
            } catch {
                skipped++;
            }
        }
        contentDiv.innerHTML = skipped > 0 ? `⚠️ Skipped ${skipped} malformed entries.<br><br>` : '';
        applyFilters();
    };
    reader.readAsText(file);
});

function applyFilters() {
    const showText = showTextPosts.checked;
    const showLink = showLinkPosts.checked;
    const showSavedOnly = document.getElementById('showSavedOnly')?.checked;
    const query = searchInput.value.toLowerCase();
    
    filteredData = rawData.filter(item => {
        const isText = ('is_self' in item) ? item.is_self : !!item.selftext;
        const isLink = ('is_self' in item) ? !item.is_self : (!!item.url && !item.selftext);
        const isComment = 'body' in item && !('title' in item);
        const showType = (isText && showText) || (isLink && showLink) || (isComment && showText);
        
        if (!showType) return false;
        
        // Filter for saved posts if that option is checked
        if (showSavedOnly && !savedPosts.has(getPostId(item))) return false;
        
        const content = `${item.title || ''} ${item.selftext || ''} ${item.body || ''} ${item.author || ''}`.toLowerCase();
        return content.includes(query);
    });
    
    applySorting();
    currentPage = 1;
    renderPage(currentPage);
}

function applySorting() {
    const mode = sortBy.value;
    filteredData.sort((a, b) => {
        const lenA = (a.selftext || a.body || '').length;
        const lenB = (b.selftext || b.body || '').length;
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        const dateA = a.created_utc || a.created || 0;
        const dateB = b.created_utc || b.created || 0;
        switch (mode) {
            case 'textLength': return lenB - lenA;
            case 'scoreAsc': return scoreA - scoreB;
            case 'scoreDesc': return scoreB - scoreA;
            case 'dateAsc': return dateA - dateB;
            case 'dateDesc': return dateB - dateA;
            default: return 0;
        }
    });
}

function updatePostCount() {
    postCountDiv.textContent = `Showing ${filteredData.length} post${filteredData.length !== 1 ? 's' : ''}`;
}

// Helper function to shorten text
function shortenText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Generate a unique ID for each post
function getPostId(post) {
    return `${post.id || (post.author + post.created_utc + (post.title || post.body?.substring(0, 20) || ''))}`;
}

// Mark post as read
function markAsRead(post) {
    const postId = getPostId(post);
    readPosts.add(postId);
    localStorage.setItem('readPosts', JSON.stringify([...readPosts]));
}

// Toggle read status
function toggleRead(post, element) {
    const postId = getPostId(post);
    if (readPosts.has(postId)) {
        readPosts.delete(postId);
        element.classList.remove('read-post');
        element.querySelector('.read-toggle').textContent = '○';
        element.querySelector('.read-toggle').title = 'Mark as read';
    } else {
        readPosts.add(postId);
        element.classList.add('read-post');
        element.querySelector('.read-toggle').textContent = '✓';
        element.querySelector('.read-toggle').title = 'Mark as unread';
    }
    localStorage.setItem('readPosts', JSON.stringify([...readPosts]));
}

// Toggle saved status
function toggleSaved(post, element) {
    const postId = getPostId(post);
    if (savedPosts.has(postId)) {
        savedPosts.delete(postId);
        element.classList.remove('saved-post');
        element.querySelector('.save-toggle').textContent = '☆';
        element.querySelector('.save-toggle').title = 'Save for later';
    } else {
        savedPosts.add(postId);
        element.classList.add('saved-post');
        element.querySelector('.save-toggle').textContent = '★';
        element.querySelector('.save-toggle').title = 'Unsave';
    }
    localStorage.setItem('savedPosts', JSON.stringify([...savedPosts]));
}

// Updated renderPage function with shortened posts
function renderPage(page) {
    contentDiv.innerHTML = '';
    const start = (page - 1) * pageSize;
    const items = filteredData.slice(start, start + pageSize);
    
    if (items.length === 0) {
        contentDiv.innerHTML = '<p>No entries to display for current filter.</p>';
    } else {
        items.forEach((post, index) => {
            const div = document.createElement('div');
            div.className = 'post';
            
            // Add classes for read and saved posts
            if (readPosts.has(getPostId(post))) {
                div.classList.add('read-post');
            }
            if (savedPosts.has(getPostId(post))) {
                div.classList.add('saved-post');
            }
            
            const dateStr = new Date((post.created_utc || post.created || 0) * 1000).toLocaleString();
            
            // Create shortened preview content
            if (post.body && !post.title) {
                // For comments
                const shortBody = shortenText(post.body, 150);
                div.innerHTML = `
                    <div class="post-meta">
                        <span class="post-author">${post.author || 'unknown'}</span> in 
                        <span class="post-subreddit">r/${post.subreddit || 'unknown'}</span>
                        <span class="post-score">${post.score ?? 0} pts</span>
                        <span class="post-date">${dateStr}</span>
                    </div>
                    <div class="post-preview">${shortBody}</div>
                    <div class="post-actions">
                        <button class="action-button read-toggle" title="${readPosts.has(getPostId(post)) ? 'Mark as unread' : 'Mark as read'}">
                            ${readPosts.has(getPostId(post)) ? '✓' : '○'}
                        </button>
                        <button class="action-button save-toggle" title="${savedPosts.has(getPostId(post)) ? 'Unsave' : 'Save for later'}">
                            ${savedPosts.has(getPostId(post)) ? '★' : '☆'}
                        </button>
                    </div>`;
            } else {
                // For posts
                const shortText = post.selftext ? shortenText(post.selftext, 150) : '';
                div.innerHTML = `
                    <h3>${post.title || '(No Title)'}</h3>
                    <div class="post-meta">
                        <span class="post-author">${post.author || 'unknown'}</span> in 
                        <span class="post-subreddit">r/${post.subreddit || 'unknown'}</span>
                        <span class="post-score">${post.score ?? 0} pts</span>
                        <span class="post-date">${dateStr}</span>
                    </div>
                    <div class="post-preview">
                        ${(post.is_self !== false || post.selftext)
                            ? shortText
                            : `<a href="${post.url || '#'}" target="_blank">${post.url || '(No link)'}</a>`}
                    </div>
                    <div class="post-actions">
                        <button class="action-button read-toggle" title="${readPosts.has(getPostId(post)) ? 'Mark as unread' : 'Mark as read'}">
                            ${readPosts.has(getPostId(post)) ? '✓' : '○'}
                        </button>
                        <button class="action-button save-toggle" title="${savedPosts.has(getPostId(post)) ? 'Unsave' : 'Save for later'}">
                            ${savedPosts.has(getPostId(post)) ? '★' : '☆'}
                        </button>
                    </div>`;
            }

            // Attach click handlers for the whole post and the action buttons
            div.querySelector('.post-actions').addEventListener('click', e => {
                e.stopPropagation(); // Prevent triggering post open
            });
            
            div.querySelector('.read-toggle').addEventListener('click', e => {
                e.stopPropagation();
                toggleRead(post, div);
            });
            
            div.querySelector('.save-toggle').addEventListener('click', e => {
                e.stopPropagation();
                toggleSaved(post, div);
            });
            
            div.addEventListener('click', () => {
                markAsRead(post);
                div.classList.add('read-post');
                renderSinglePost(post, start + index);
            });
            
            contentDiv.appendChild(div);
        });
    }

    updatePostCount();

    pageInfo.textContent = `Page ${page}`;
    prevBtn.disabled = page === 1;
    nextBtn.disabled = page * pageSize >= filteredData.length;

    paginationDiv.style.display = '';
    postCountDiv.style.display = '';

    // Apply font size and line height
    contentDiv.style.fontSize = fontSizeSelect.value;
    contentDiv.style.lineHeight = lineHeightSelect.value;
}

// Updated renderSinglePost function with navigation and reading progress
function renderSinglePost(post, currentIndex) {
    lastScrollY = window.scrollY;
    contentDiv.innerHTML = '';
    
    // Create nav controls for blog mode
    const navControls = document.createElement('div');
    navControls.className = 'blog-nav';
    
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back to List';
    backBtn.className = 'back-button';
    backBtn.onclick = () => {
        renderPage(currentPage);
        window.scrollTo(0, lastScrollY);
        paginationDiv.style.display = '';
        postCountDiv.style.display = '';
    };
    
    const prevPostBtn = document.createElement('button');
    prevPostBtn.textContent = '← Previous Post';
    prevPostBtn.className = 'nav-button prev-post';
    prevPostBtn.disabled = currentIndex <= 0;
    prevPostBtn.onclick = () => {
        if (currentIndex > 0) {
            const prevPost = filteredData[currentIndex - 1];
            markAsRead(prevPost);
            renderSinglePost(prevPost, currentIndex - 1);
        }
    };
    
    const nextPostBtn = document.createElement('button');
    nextPostBtn.textContent = 'Next Post →';
    nextPostBtn.className = 'nav-button next-post';
    nextPostBtn.disabled = currentIndex >= filteredData.length - 1;
    nextPostBtn.onclick = () => {
        if (currentIndex < filteredData.length - 1) {
            const nextPost = filteredData[currentIndex + 1];
            markAsRead(nextPost);
            renderSinglePost(nextPost, currentIndex + 1);
        }
    };
    
    navControls.appendChild(backBtn);
    navControls.appendChild(prevPostBtn);
    navControls.appendChild(nextPostBtn);
    
    // Create post content
    const div = document.createElement('div');
    div.className = 'post single-post';
    const dateStr = new Date((post.created_utc || post.created || 0) * 1000).toLocaleString();
    
    // Add action buttons for single post view
    const actionBar = document.createElement('div');
    actionBar.className = 'single-post-actions';
    
    const readToggle = document.createElement('button');
    readToggle.className = 'action-button read-toggle';
    readToggle.textContent = readPosts.has(getPostId(post)) ? '✓ Read' : '○ Mark as read';
    readToggle.onclick = () => {
        const postId = getPostId(post);
        if (readPosts.has(postId)) {
            readPosts.delete(postId);
            readToggle.textContent = '○ Mark as read';
        } else {
            readPosts.add(postId);
            readToggle.textContent = '✓ Read';
        }
        localStorage.setItem('readPosts', JSON.stringify([...readPosts]));
    };
    
    const saveToggle = document.createElement('button');
    saveToggle.className = 'action-button save-toggle';
    saveToggle.textContent = savedPosts.has(getPostId(post)) ? '★ Saved' : '☆ Save for later';
    saveToggle.onclick = () => {
        const postId = getPostId(post);
        if (savedPosts.has(postId)) {
            savedPosts.delete(postId);
            saveToggle.textContent = '☆ Save for later';
        } else {
            savedPosts.add(postId);
            saveToggle.textContent = '★ Saved';
        }
        localStorage.setItem('savedPosts', JSON.stringify([...savedPosts]));
    };
    
    actionBar.appendChild(readToggle);
    actionBar.appendChild(saveToggle);
    
    // Create post content
    if (post.body && !post.title) {
        div.innerHTML = `
            <p class="post-meta">
                <strong>Author:</strong> ${post.author || 'unknown'}<br>
                <strong>Subreddit:</strong> ${post.subreddit || 'unknown'}<br>
                <strong>Score:</strong> ${post.score ?? 0}<br>
                <strong>Date:</strong> ${dateStr}
            </p>
            <div class="post-content"><strong>Comment:</strong><br>${post.body}</div>`;
    } else {
        div.innerHTML = `
            <h3>${post.title || '(No Title)'}</h3>
            <p class="post-meta">
                <strong>Author:</strong> ${post.author || 'unknown'}<br>
                <strong>Subreddit:</strong> ${post.subreddit || 'unknown'}<br>
                <strong>Score:</strong> ${post.score ?? 0}<br>
                <strong>Date:</strong> ${dateStr}
            </p>
            ${(post.is_self !== false || post.selftext)
                ? `<div class="post-content"><strong>Text Post:</strong><br>${post.selftext || '(No content)'}</div>`
                : `<div class="post-content"><strong>Link Post:</strong><br><a href="${post.url || '#'}" target="_blank">${post.url || '(No link)'}</a></div>`}`;
    }
    
    // Save reading position
    lastReadPosition = {
        postId: getPostId(post),
        index: currentIndex,
        page: currentPage
    };
    localStorage.setItem('lastReadPosition', JSON.stringify(lastReadPosition));
    
    // Add everything to the page
    contentDiv.appendChild(navControls);
    contentDiv.appendChild(actionBar);
    contentDiv.appendChild(div);
    
    paginationDiv.style.display = 'none';
    postCountDiv.style.display = 'none';
    
    // Save scroll position within post
    setupReadingProgressTracking(post);
}

// Track reading progress within a post
function setupReadingProgressTracking(post) {
    const postId = getPostId(post);
    const postContent = document.querySelector('.post-content');
    
    if (!postContent) return;
    
    // Restore scroll position if we have it
    if (readingProgress[postId]) {
        setTimeout(() => {
            window.scrollTo(0, readingProgress[postId]);
        }, 100);
    }
    
    // Save scroll position periodically
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            readingProgress[postId] = window.scrollY;
            localStorage.setItem('readingProgress', JSON.stringify(readingProgress));
        }, 500);
    });
}

// Add a "Resume Reading" button to the top of the page
function addResumeReadingButton() {
    if (!lastReadPosition) return;
    
    const resumeDiv = document.createElement('div');
    resumeDiv.className = 'resume-reading';
    
    const resumeBtn = document.createElement('button');
    resumeBtn.textContent = 'Resume Reading';
    resumeBtn.onclick = () => {
        currentPage = lastReadPosition.page;
        renderPage(currentPage);
        setTimeout(() => {
            const post = filteredData[lastReadPosition.index];
            if (post) {
                renderSinglePost(post, lastReadPosition.index);
            }
        }, 100);
    };
    
    resumeDiv.appendChild(resumeBtn);
    
    // Add after controls but before content
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        controlsDiv.parentNode.insertBefore(resumeDiv, controlsDiv.nextSibling);
    }
}

// Add a filter for saved posts
function addSavedFilter() {
    const filterControls = document.querySelector('.controls');
    
    const savedFilter = document.createElement('label');
    savedFilter.className = 'toggle';
    savedFilter.innerHTML = '<input type="checkbox" id="showSavedOnly"> Saved Only';
    
    const savedCheckbox = savedFilter.querySelector('input');
    savedCheckbox.addEventListener('change', () => {
        applyFilters();
    });
    
    filterControls.appendChild(savedFilter);
}

// Setup touch gestures for navigation
function setupTouchGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        const minSwipeDistance = 100;
        
        // Check if we're in blog mode
        const singlePost = document.querySelector('.single-post');
        
        if (singlePost) {
            // In blog mode
            if (swipeDistance > minSwipeDistance) {
                // Right swipe - previous post
                const prevBtn = document.querySelector('.prev-post');
                if (prevBtn && !prevBtn.disabled) {
                    prevBtn.click();
                }
            } else if (swipeDistance < -minSwipeDistance) {
                // Left swipe - next post
                const nextBtn = document.querySelector('.next-post');
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                }
            }
        } else {
            // In list mode
            if (swipeDistance > minSwipeDistance) {
                // Right swipe - previous page
                if (!prevBtn.disabled) {
                    prevBtn.click();
                }
            } else if (swipeDistance < -minSwipeDistance) {
                // Left swipe - next page
                if (!nextBtn.disabled) {
                    nextBtn.click();
                }
            }
        }
    }
}

// Exit blog mode if clicking outside single post content
document.addEventListener('click', (e) => {
    if (
        contentDiv.querySelector('.single-post') && 
        !e.target.closest('.single-post') && 
        !e.target.classList.contains('back-button') &&
        !e.target.closest('.blog-nav') &&
        !e.target.closest('.single-post-actions') &&
        e.target.closest('#wrapper')
    ) {
        renderPage(currentPage);
        window.scrollTo(0, lastScrollY);
        paginationDiv.style.display = '';
        postCountDiv.style.display = '';
    }
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentPage * pageSize < filteredData.length) {
        currentPage++;
        renderPage(currentPage);
    }
});

showTextPosts.addEventListener('change', applyFilters);
showLinkPosts.addEventListener('change', applyFilters);
sortBy.addEventListener('change', () => {
    applySorting();
    renderPage(currentPage);
});
searchInput.addEventListener('input', () => {
    applyFilters();
});
fontSizeSelect.addEventListener('change', () => {
    contentDiv.style.fontSize = fontSizeSelect.value;
});
lineHeightSelect.addEventListener('change', () => {
    contentDiv.style.lineHeight = lineHeightSelect.value;
});
