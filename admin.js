import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, get, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBIhbURC0eBrpdZgdtwJUOfxmjuYf42Fl4",
    authDomain: "games-69738.firebaseapp.com",
    databaseURL: "https://games-69738-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "games-69738",
    storageBucket: "games-69738.firebasestorage.app",
    messagingSenderId: "212538189689",
    appId: "1:212538189689:web:81c0efbfcb2aaff6bb31a8",
    measurementId: "G-7DSV2P4BH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Password
const ADMIN_PASSWORD = "Leonardo75";

// Check if logged in
function checkAuth() {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
}

// Login form handler
const loginForm = document.getElementById('login-form');
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const errorMessage = document.getElementById('error-message');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginScreen.style.display = 'none';
            adminPanel.style.display = 'block';
            loadDashboard();
        } else {
            errorMessage.textContent = 'Неверный пароль!';
            setTimeout(() => {
                errorMessage.textContent = '';
            }, 3000);
        }
    });
}

// Logout handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminLoggedIn');
        location.reload();
    });
}

// Check auth on page load
if (checkAuth()) {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    loadDashboard();
}

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
});

// Load dashboard data
function loadDashboard() {
    loadVisits();
    loadMessages();
}

// Load visits data
function loadVisits() {
    const visitsRef = ref(database, 'visits');
    
    onValue(visitsRef, (snapshot) => {
        const data = snapshot.val();
        
        if (!data) {
            document.getElementById('visits-table-body').innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        Нет данных о посещениях
                    </td>
                </tr>
            `;
            return;
        }
        
        const visits = Object.values(data);
        const sortedVisits = visits.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update stats
        updateStats(visits);
        
        // Update table
        const tableBody = document.getElementById('visits-table-body');
        tableBody.innerHTML = sortedVisits.slice(0, 50).map(visit => {
            const date = new Date(visit.timestamp);
            const formattedDate = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const device = getDeviceType(visit.userAgent);
            
            return `
                <tr>
                    <td>${formattedDate} ${formattedTime}</td>
                    <td><span class="ip-badge">${visit.ip || 'N/A'}</span></td>
                    <td>${visit.page || '/'}</td>
                    <td>${visit.city || 'Unknown'}</td>
                    <td>${visit.country || 'Unknown'}</td>
                    <td>${device}</td>
                </tr>
            `;
        }).join('');
        
        // Update analytics
        updateAnalytics(visits);
    });
}

// Update statistics
function updateStats(visits) {
    const totalVisits = visits.length;
    const today = new Date().toDateString();
    const todayVisits = visits.filter(v => new Date(v.timestamp).toDateString() === today).length;
    const uniqueIPs = new Set(visits.map(v => v.ip)).size;
    const mobileVisits = visits.filter(v => /mobile/i.test(v.userAgent)).length;
    
    document.getElementById('total-visits').textContent = totalVisits;
    document.getElementById('today-visits').textContent = todayVisits;
    document.getElementById('unique-ips').textContent = uniqueIPs;
    document.getElementById('mobile-visits').textContent = mobileVisits;
    
    // Animate counters
    animateValue('total-visits', 0, totalVisits, 1000);
    animateValue('today-visits', 0, todayVisits, 1000);
    animateValue('unique-ips', 0, uniqueIPs, 1000);
    animateValue('mobile-visits', 0, mobileVisits, 1000);
}

// Animate counter
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Get device type
function getDeviceType(userAgent) {
    if (/mobile/i.test(userAgent)) return '📱 Mobile';
    if (/tablet/i.test(userAgent)) return '📱 Tablet';
    return '💻 Desktop';
}

// Update analytics
function updateAnalytics(visits) {
    // Popular pages
    const pageCount = {};
    visits.forEach(v => {
        const page = v.page || '/';
        pageCount[page] = (pageCount[page] || 0) + 1;
    });
    
    const popularPages = Object.entries(pageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const pagesHtml = popularPages.map(([page, count]) => {
        const percentage = (count / visits.length * 100).toFixed(1);
        return `
            <div class="analytics-item">
                <div>
                    <div class="analytics-label">${page}</div>
                    <div class="analytics-bar">
                        <div class="analytics-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="analytics-value">${count}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('popular-pages').innerHTML = pagesHtml;
    
    // Countries
    const countryCount = {};
    visits.forEach(v => {
        const country = v.country || 'Unknown';
        countryCount[country] = (countryCount[country] || 0) + 1;
    });
    
    const topCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const countriesHtml = topCountries.map(([country, count]) => {
        const percentage = (count / visits.length * 100).toFixed(1);
        return `
            <div class="analytics-item">
                <div>
                    <div class="analytics-label">${country}</div>
                    <div class="analytics-bar">
                        <div class="analytics-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="analytics-value">${count}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('visitor-countries').innerHTML = countriesHtml;
    
    // Traffic sources
    const sourceCount = {};
    visits.forEach(v => {
        const referrer = v.referrer === 'Direct' ? 'Direct' : new URL(v.referrer || 'Direct').hostname || 'Direct';
        sourceCount[referrer] = (sourceCount[referrer] || 0) + 1;
    });
    
    const topSources = Object.entries(sourceCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const sourcesHtml = topSources.map(([source, count]) => {
        const percentage = (count / visits.length * 100).toFixed(1);
        return `
            <div class="analytics-item">
                <div>
                    <div class="analytics-label">${source}</div>
                    <div class="analytics-bar">
                        <div class="analytics-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="analytics-value">${count}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('traffic-sources').innerHTML = sourcesHtml;
    
    // Browsers
    const browserCount = {};
    visits.forEach(v => {
        const browser = detectBrowser(v.userAgent);
        browserCount[browser] = (browserCount[browser] || 0) + 1;
    });
    
    const topBrowsers = Object.entries(browserCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const browsersHtml = topBrowsers.map(([browser, count]) => {
        const percentage = (count / visits.length * 100).toFixed(1);
        return `
            <div class="analytics-item">
                <div>
                    <div class="analytics-label">${browser}</div>
                    <div class="analytics-bar">
                        <div class="analytics-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="analytics-value">${count}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('browsers').innerHTML = browsersHtml;
}

// Detect browser
function detectBrowser(userAgent) {
    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/edg/i.test(userAgent)) return 'Edge';
    if (/opera|opr/i.test(userAgent)) return 'Opera';
    return 'Other';
}

// Load messages
function loadMessages() {
    const messagesRef = ref(database, 'messages');
    
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('messages-container');
        
        if (!data) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--text-muted); padding: 40px;">
                    Нет сообщений
                </p>
            `;
            return;
        }
        
        const messages = Object.values(data);
        const sortedMessages = messages.sort((a, b) => b.timestamp - a.timestamp);
        
        container.innerHTML = sortedMessages.map(msg => {
            const date = new Date(msg.timestamp);
            const formattedDate = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="message-card">
                    <div class="message-header">
                        <div class="message-info">
                            <h3>${msg.name}</h3>
                            <p>${msg.email}</p>
                        </div>
                        <div class="message-date">${formattedDate}</div>
                    </div>
                    <div class="message-subject">Тема: ${msg.subject}</div>
                    <div class="message-body">${msg.message}</div>
                </div>
            `;
        }).join('');
    });
}