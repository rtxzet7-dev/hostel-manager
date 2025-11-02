// API Configuration for Hostel Manager
// Автоматическое подключение к бэкенду

// Определяем URL бэкенда
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    
    // Если файл открыт локально (file://), используем localhost
    if (!hostname || hostname === '' || window.location.protocol === 'file:') {
        return 'http://localhost:5000/api';
    }
    
    // Если уже localhost или 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    
    // Для продакшена (Netlify) - укажите URL вашего Render сервиса
    // После деплоя замените на реальный URL
    if (hostname.includes('netlify.app')) {
        return 'https://YOUR-RENDER-APP.onrender.com/api';
    }
    
    // Для других адресов используем тот же hostname
    return `http://${hostname}:5000/api`;
}

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Backend URL:', API_BASE_URL);

// Вспомогательная функция для API запросов
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return response.json();
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
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
        return result.rooms || {};
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

// Проверка подключения к бэкенду при загрузке
(async function checkBackendConnection() {
    try {
        const health = await API.checkHealth();
        console.log('✅ Backend connected:', health);
        // Уведомление убрано по запросу пользователя
        
    } catch (error) {
        console.warn('⚠️ Backend not available, using localStorage:', error);
        
        // Показываем предупреждение
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: linear-gradient(135deg, #ffa502, #ff6b00);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(255,165,2,0.3);
        `;
        notification.innerHTML = '⚠️ Backend не доступен<br><small>Используется localStorage</small>';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 5000);
        }, 5000);
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
