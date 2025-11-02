// Rooms API Integration - переопределяем roomsManager для работы с API
console.log('🏠 Подключение Rooms API интеграции...');

// Проверка онлайн подключения к серверу
let serverOnline = true;
let lastServerCheck = Date.now();

async function checkServerConnection() {
    try {
        const response = await fetch(API_BASE_URL + '/health', { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        serverOnline = response.ok;
        lastServerCheck = Date.now();
        return serverOnline;
    } catch (error) {
        console.warn('⚠️ Сервер недоступен');
        serverOnline = false;
        lastServerCheck = Date.now();
        return false;
    }
}

// Проверяем каждые 30 секунд
setInterval(checkServerConnection, 30000);
checkServerConnection(); // Сразу при загрузке

// Сохраняем оригинальные функции
const originalSaveToStorage = window.roomsManager ? window.roomsManager.saveToStorage : null;
const originalLoadFromStorage = window.roomsManager ? window.roomsManager.loadFromStorage : null;

// Переопределяем сохранение комнат
if (window.roomsManager) {
    // Сохранение в API вместо localStorage
    window.roomsManager.saveToStorage = async function() {
        // Проверка что сервер онлайн
        if (!serverOnline) {
            // Показываем предупреждение
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, #ff4757, #ff6b81);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(255,71,87,0.3);
            `;
            warning.textContent = '⚠️ Сервер недоступен! Данные не сохранены!';
            document.body.appendChild(warning);
            setTimeout(() => warning.remove(), 3000);
            
            console.warn('❌ Не могу сохранить: сервер недоступен');
            return;
        }

        try {
            // Собираем все данные комнат
            const roomsData = {
                rooms: this.roomsConfig,
                bedsState: this.bedsState,
                residents: this.residents,
                bedNumbers: this.bedNumbers
            };
            
            console.log('💾 Сохранение комнат на сервер...', roomsData);
            
            // Отправляем на сервер
            const response = await fetch(API_BASE_URL + '/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                },
                body: JSON.stringify(roomsData)
            });
            
            if (!response.ok) {
                throw new Error('Ошибка сохранения на сервер');
            }
            
            console.log('✅ Комнаты сохранены на сервер!');
            
            // Также сохраняем в localStorage как резервную копию
            if (originalSaveToStorage) {
                originalSaveToStorage.call(this);
            }
            
        } catch (error) {
            console.error('❌ Ошибка сохранения комнат:', error);
            
            // Показываем ошибку пользователю
            const errorNotif = document.createElement('div');
            errorNotif.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, #ff4757, #ff6b81);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(255,71,87,0.3);
            `;
            errorNotif.textContent = '❌ Ошибка сохранения! ' + error.message;
            document.body.appendChild(errorNotif);
            setTimeout(() => errorNotif.remove(), 5000);
        }
    };
    
    // Загрузка с API вместо localStorage
    window.roomsManager.loadFromStorage = async function() {
        try {
            console.log('📥 Загрузка комнат с сервера...');
            
            const response = await fetch(API_BASE_URL + '/rooms', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки с сервера');
            }
            
            const data = await response.json();
            const roomsData = data.rooms || {};
            
            console.log('✅ Комнаты загружены с сервера!', roomsData);
            
            // Инициализируем пустые объекты если данных нет
            this.roomsConfig = roomsData.rooms || {};
            this.bedsState = roomsData.bedsState || {};
            this.residents = roomsData.residents || {};
            this.bedNumbers = roomsData.bedNumbers || {};
            
            console.log('📊 Загружено комнат:', Object.keys(this.roomsConfig).length);
            console.log('📊 Загружено жильцов:', Object.keys(this.residents).length);
            
            // Обновляем отображение
            this.renderRooms();
            
            // Показываем успешное уведомление
            const successNotif = document.createElement('div');
            successNotif.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                color: #031024;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,255,136,0.3);
            `;
            successNotif.textContent = '✅ Данные загружены с сервера!';
            document.body.appendChild(successNotif);
            setTimeout(() => successNotif.remove(), 2000);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки комнат:', error);
            
            // Инициализируем пустые объекты чтобы интерфейс работал
            this.roomsConfig = this.roomsConfig || {};
            this.bedsState = this.bedsState || {};
            this.residents = this.residents || {};
            this.bedNumbers = this.bedNumbers || {};
            
            // Fallback на localStorage если сервер недоступен
            console.warn('⚠️ Загружаем из localStorage как резервную копию');
            if (originalLoadFromStorage) {
                originalLoadFromStorage.call(this);
            } else {
                // Если даже localStorage пуст, рендерим пустой интерфейс
                this.renderRooms();
            }
        }
    };
    
    console.log('✅ roomsManager переопределен для работы с API');
}

// Защита от оффлайн обхода - периодическая проверка
setInterval(async () => {
    const online = await checkServerConnection();
    
    if (!online) {
        // Если сервер недоступен - показываем предупреждение
        const overlay = document.getElementById('offlineOverlay');
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.id = 'offlineOverlay';
            newOverlay.style.cssText = `
                position: fixed;
                top: 60px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 71, 87, 0.95);
                color: white;
                padding: 15px 30px;
                border-radius: 10px;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 4px 20px rgba(255,71,87,0.5);
                animation: pulse 2s infinite;
            `;
            newOverlay.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">⚠️</span>
                    <div>
                        <div style="font-size: 16px;">Нет связи с сервером!</div>
                        <div style="font-size: 12px; opacity: 0.9;">Изменения не сохранятся</div>
                    </div>
                </div>
            `;
            document.body.appendChild(newOverlay);
            
            // Добавляем анимацию pulse
            if (!document.getElementById('pulseAnimation')) {
                const style = document.createElement('style');
                style.id = 'pulseAnimation';
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    } else {
        // Убираем предупреждение если сервер снова онлайн
        const overlay = document.getElementById('offlineOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}, 10000); // Проверяем каждые 10 секунд

// Защита от манипуляций - проверка токена
setInterval(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.warn('⚠️ Токен отсутствует!');
        // Можно добавить автовыход
    }
}, 5000);

// Функция принудительной загрузки с сервера при входе
window.forceLoadRoomsFromServer = async function() {
    if (!window.roomsManager) {
        console.warn('⚠️ roomsManager еще не готов');
        return;
    }
    
    console.log('🔄 Принудительная загрузка комнат с сервера...');
    await window.roomsManager.loadFromStorage();
};

// Загружаем комнаты с сервера при запуске
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.roomsManager && typeof window.roomsManager.loadFromStorage === 'function') {
            console.log('🔄 Автозагрузка комнат с сервера...');
            window.roomsManager.loadFromStorage();
        }
    }, 500);
});

console.log('✅ Rooms API интеграция активна!');
console.log('🔒 Защита от оффлайн обхода включена!');
console.log('🛡️ Проверка подключения к серверу активна!');
