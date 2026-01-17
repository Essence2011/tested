import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, get, onValue, remove, set, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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
    loadIPCategories();
}

// Modal functions
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const confirmMsg = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    
    confirmMsg.textContent = message;
    modal.classList.add('show');
    
    yesBtn.onclick = () => {
        modal.classList.remove('show');
        onConfirm();
    };
    
    noBtn.onclick = () => {
        modal.classList.remove('show');
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    };
}

// Delete single visit
async function deleteVisit(visitKey) {
    try {
        await remove(ref(database, `visits/${visitKey}`));
        console.log('Visit deleted successfully');
    } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Ошибка при удалении записи');
    }
}

// Clear all visits
document.getElementById('clear-all-visits')?.addEventListener('click', () => {
    showConfirmModal('Вы уверены что хотите удалить ВСЕ записи о посещениях?', async () => {
        try {
            await remove(ref(database, 'visits'));
            alert('Все записи удалены');
        } catch (error) {
            console.error('Error clearing visits:', error);
            alert('Ошибка при удалении');
        }
    });
});

// Load visits data
let allVisitsData = {};

function loadVisits() {
    const visitsRef = ref(database, 'visits');
    
    onValue(visitsRef, (snapshot) => {
        const data = snapshot.val();
        allVisitsData = data || {};
        
        if (!data) {
            document.getElementById('visits-table-body').innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        Нет данных о посещениях
                    </td>
                </tr>
            `;
            updateStats([]);
            return;
        }
        
        const visitsArray = Object.entries(data).map(([key, value]) => ({
            key,
            ...value
        }));
        
        const sortedVisits = visitsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update stats
        updateStats(visitsArray);
        
        // Update table
        const tableBody = document.getElementById('visits-table-body');
        tableBody.innerHTML = sortedVisits.slice(0, 100).map(visit => {
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
                    <td>
                        <button class="delete-btn" onclick="window.deleteVisitItem('${visit.key}')">
                            🗑️ Удалить
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Update analytics
        updateAnalytics(visitsArray);
    });
}

// Make delete function global
window.deleteVisitItem = function(key) {
    showConfirmModal('Удалить эту запись?', () => deleteVisit(key));
};

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
}

// Get device type
function getDeviceType(userAgent) {
    if (/mobile/i.test(userAgent)) return '📱 Mobile';
    if (/tablet/i.test(userAgent)) return '📱 Tablet';
    return '💻 Desktop';
}

// Update analytics
function updateAnalytics(visits) {
    if (visits.length === 0) {
        document.getElementById('popular-pages').innerHTML = '<p class="empty-category">Нет данных</p>';
        document.getElementById('visitor-countries').innerHTML = '<p class="empty-category">Нет данных</p>';
        document.getElementById('traffic-sources').innerHTML = '<p class="empty-category">Нет данных</p>';
        document.getElementById('browsers').innerHTML = '<p class="empty-category">Нет данных</p>';
        return;
    }
    
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
        let referrer = 'Direct';
        if (v.referrer && v.referrer !== 'Direct') {
            try {
                referrer = new URL(v.referrer).hostname;
            } catch (e) {
                referrer = 'Direct';
            }
        }
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

// IP Categories Management
async function addIPCategory(ip, category) {
    try {
        const ipCategoriesRef = ref(database, `ipCategories/${category}`);
        const newIPRef = push(ipCategoriesRef);
        await set(newIPRef, {
            ip: ip,
            addedAt: Date.now()
        });
        alert('IP добавлен в категорию');
        document.getElementById('new-ip').value = '';
    } catch (error) {
        console.error('Error adding IP category:', error);
        alert('Ошибка при добавлении IP');
    }
}

async function deleteIPCategory(category, key) {
    try {
        await remove(ref(database, `ipCategories/${category}/${key}`));
    } catch (error) {
        console.error('Error deleting IP:', error);
        alert('Ошибка при удалении IP');
    }
}

document.getElementById('add-ip-category')?.addEventListener('click', () => {
    const ip = document.getElementById('new-ip').value.trim();
    const category = document.getElementById('ip-category').value;
    
    if (!ip) {
        alert('Введите IP адрес');
        return;
    }
    
    // Simple IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        alert('Неверный формат IP адреса');
        return;
    }
    
    addIPCategory(ip, category);
});

function loadIPCategories() {
    const categories = ['trusted', 'blocked', 'suspicious', 'vip', 'team'];
    
    categories.forEach(category => {
        const categoryRef = ref(database, `ipCategories/${category}`);
        
        onValue(categoryRef, (snapshot) => {
            const data = snapshot.val();
            const container = document.getElementById(`${category}-ips`);
            
            if (!data) {
                container.innerHTML = '<p class="empty-category">Пусто</p>';
                return;
            }
            
            const ips = Object.entries(data).map(([key, value]) => ({
                key,
                ...value
            }));
            
            container.innerHTML = ips.map(item => `
                <div class="ip-item">
                    <span class="ip-item-address">${item.ip}</span>
                    <button class="ip-item-delete" onclick="window.deleteIPCategoryItem('${category}', '${item.key}')">
                        Удалить
                    </button>
                </div>
            `).join('');
        });
    });
}

window.deleteIPCategoryItem = function(category, key) {
    showConfirmModal('Удалить этот IP из категории?', () => deleteIPCategory(category, key));
};

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
        
        const messages = Object.entries(data).map(([key, value]) => ({
            key,
            ...value
        }));
        
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
                    <button class="message-delete delete-btn" onclick="window.deleteMessage('${msg.key}')">
                        🗑️ Удалить
                    </button>
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

window.deleteMessage = function(key) {
    showConfirmModal('Удалить это сообщение?', async () => {
        try {
            await remove(ref(database, `messages/${key}`));
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Ошибка при удалении сообщения');
        }
    });
};