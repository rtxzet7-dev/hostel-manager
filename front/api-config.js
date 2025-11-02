// API Configuration for Hostel Manager
// Автоматическое подключение к бэкенду

// Определяем URL бэкенда
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    console.log('🌐 Current location:', { hostname, protocol, port });
    
    // Если файл открыт локально (file://), используем Render backend
    if (!hostname || hostname === '' || protocol === 'file:') {
        console.log('📁 File protocol detected, using Render backend');
        return 'https://hostel-manager-backend-h6e4.onrender.com/api';
    }
    
    // Если localhost или 127.0.0.1 с портом (например, Netlify Dev или browser preview)
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port) {
        console.log('🔧 Local dev server detected, using Render backend');
        return 'https://hostel-manager-backend-h6e4.onrender.com/api';
    }
    
    // Если уже localhost или 127.0.0.1 БЕЗ порта - локальный backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('💻 Localhost without port, using local backend');
        return 'http://localhost:5000/api';
    }
    
    // Для продакшена (Netlify)
    if (hostname.includes('netlify.app')) {
        console.log('☁️ Netlify detected, using Render backend');
        return 'https://hostel-manager-backend-h6e4.onrender.com/api';
    }
    
    // Для других адресов используем Render
    console.log('🌍 Unknown hostname, using Render backend');
    return 'https://hostel-manager-backend-h6e4.onrender.com/api';
}

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Backend URL:', API_BASE_URL);

// Вспомогательная функция для API запросов с retry и таймаутом
async function apiRequest(endpoint, options = {}, retries = 2) {
    const token = localStorage.getItem('auth_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };
    
    const timeout = 60000; // 60 секунд для cold start
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 API Request (attempt ${attempt + 1}/${retries + 1}):`, `${API_BASE_URL}${endpoint}`);
            
            // Создаем контроллер для таймаута
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...defaultOptions,
                ...options,
                signal: controller.signal,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            console.log('📥 API Response status:', response.status);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Request failed' }));
                console.error('❌ API Error Response:', error);
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error(`❌ API Error (attempt ${attempt + 1}):`, error.message || error);
            
            // Если это последняя попытка или ошибка не связана с сетью
            if (attempt === retries || (error.name !== 'TypeError' && error.name !== 'AbortError')) {
                console.error('❌ Full error:', error);
                
                // Более понятное сообщение об ошибке
                if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
                    throw new Error('Backend недоступен. Возможно, он "просыпается" (подождите 30-60 сек)');
                } else if (error.name === 'AbortError') {
                    throw new Error('Таймаут запроса. Backend может быть перегружен');
                }
                
                throw error;
            }
            
            // Ждем перед следующей попыткой
            console.log(`⏳ Ожидание перед повторной попыткой...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// API методы
const API = {
    // Проверка подключения
    async checkHealth() {
        return apiRequest('/health');
    },
    
    // Аутентификация
    async login(username, password) {
        const result = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (result.token) {
            localStorage.setItem('auth_token', result.token);
        }
        
        return result;
    },
    
    async register(username, password) {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },
    
    async getUsers() {
        return apiRequest('/auth/users');
    },
    
    async updateUser(username, data) {
        return apiRequest(`/auth/users/${username}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteUser(username) {
        return apiRequest(`/auth/users/${username}`, {
            method: 'DELETE'
        });
    },
    
    // Комнаты
    async getRooms() {
        const result = await apiRequest('/rooms');
        // Backend теперь возвращает данные напрямую, без обертки 'rooms'
        return result || {};
    },
    
    async createRoom(roomData) {
        return apiRequest('/rooms', {
            method: 'POST',
            body: JSON.stringify(roomData)
        });
    },
    
    async updateRoom(roomId, roomData) {
        return apiRequest(`/rooms/${roomId}`, {
            method: 'PUT',
            body: JSON.stringify(roomData)
        });
    },
    
    async deleteRoom(roomId) {
        return apiRequest(`/rooms/${roomId}`, {
            method: 'DELETE'
        });
    },
    
    async deleteAllRooms() {
        return apiRequest('/rooms/all', {
            method: 'DELETE'
        });
    },
    
    // Персонал
    async getStaff() {
        const result = await apiRequest('/staff');
        return result.staff || {};
    },
    
    async createStaff(staffData) {
        return apiRequest('/staff', {
            method: 'POST',
            body: JSON.stringify(staffData)
        });
    },
    
    async updateStaff(staffId, staffData) {
        return apiRequest(`/staff/${staffId}`, {
            method: 'PUT',
            body: JSON.stringify(staffData)
        });
    },
    
    async deleteStaff(staffId) {
        return apiRequest(`/staff/${staffId}`, {
            method: 'DELETE'
        });
    }
};

// Проверка подключения к бэкенду при загрузке (пробуждение)
(async function checkBackendConnection() {
    console.log('🔌 Checking backend connection...');
    
    // Показываем уведомление о подключении
    const notification = document.createElement('div');
    notification.id = 'backend-status-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #7c4dff, #00e5ff);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(124,77,255,0.3);
        transition: all 0.3s ease;
    `;
    notification.innerHTML = '🔄 Подключение к backend...<br><small>Может занять 30-60 сек</small>';
    document.body.appendChild(notification);
    
    try {
        const health = await API.checkHealth();
        console.log('✅ Backend connected:', health);
        
        // Успешное подключение
        notification.style.background = 'linear-gradient(135deg, #00ff88, #00d670)';
        notification.innerHTML = '✅ Backend подключен!';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
        
    } catch (error) {
        console.warn('⚠️ Backend not available:', error.message);
        
        // Показываем предупреждение
        notification.style.background = 'linear-gradient(135deg, #ffa502, #ff6b00)';
        notification.innerHTML = '⚠️ Backend недоступен<br><small>' + error.message + '</small>';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 8000);
    }
})();

// Добавляем анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🚀 API module loaded. Use window.API to access backend.');
window.API = API;
