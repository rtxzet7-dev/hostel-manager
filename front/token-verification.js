// 🔐 АВТОМАТИЧЕСКАЯ ПРОВЕРКА ТОКЕНА

// Глобальный таймер проверки
let verificationTimer = null;

// Периодическая проверка токена каждые 12 часов
function startTokenVerificationTimer() {
    // Очищаем предыдущий таймер если есть
    if (verificationTimer) {
        clearInterval(verificationTimer);
    }
    
    console.log('⏰ Запуск автопроверки токена (каждые 12 часов)');
    
    // Проверяем каждые 12 часов (43200000 мс)
    verificationTimer = setInterval(async () => {
        console.log('⏰ Автоматическая проверка токена...');
        
        try {
            const result = await API.verifyToken();
            
            if (!result.valid) {
                console.log('❌ Токен больше не валидный');
                clearInterval(verificationTimer);
                const currentLang = localStorage.getItem('hostel_language') || 'ru';
                const errorMsg = currentLang === 'ru' ? 'Срок действия сессии истек. Войдите снова.' : 
                                currentLang === 'uz' ? 'Sessiya muddati tugadi.' : 
                                'Session expired.';
                alert(errorMsg);
                if (typeof logout === 'function') {
                    logout();
                }
            } else {
                console.log('✅ Токен все еще валидный');
                // Обновляем данные пользователя в localStorage
                if (result.user) {
                    localStorage.setItem('current_user', JSON.stringify(result.user));
                }
            }
        } catch (error) {
            console.error('❌ Ошибка автопроверки:', error.message);
            // Не выходим при ошибке сети, проверим в следующий раз
        }
    }, 12 * 60 * 60 * 1000); // 12 часов
}

// Останавливаем проверку
function stopTokenVerificationTimer() {
    if (verificationTimer) {
        clearInterval(verificationTimer);
        verificationTimer = null;
        console.log('⏰ Автопроверка токена остановлена');
    }
}

// Проверка токена при загрузке страницы
async function verifyTokenOnLoad() {
    const savedUser = localStorage.getItem('current_user');
    const authToken = localStorage.getItem('auth_token');
    
    if (!savedUser || !authToken) {
        return { valid: false, reason: 'no_token' };
    }
    
    try {
        console.log('🔐 Проверка токена на сервере...');
        const result = await API.verifyToken();
        
        if (result.valid) {
            console.log('✅ Токен валидный');
            // Обновляем данные пользователя
            localStorage.setItem('current_user', JSON.stringify(result.user));
            // Запускаем периодическую проверку
            startTokenVerificationTimer();
            return { valid: true };
        } else {
            console.log('❌ Токен невалидный');
            localStorage.removeItem('current_user');
            localStorage.removeItem('auth_token');
            return { valid: false, reason: 'invalid_token' };
        }
    } catch (error) {
        console.error('❌ Ошибка проверки токена:', error.message);
        // При ошибке сети не блокируем, пробуем позже - НЕ удаляем данные!
        console.warn('⚠️ Ошибка сети, пользователь остаётся залогиненным до следующей проверки');
        const currentLang = localStorage.getItem('hostel_language') || 'ru';
        const errorMsg = currentLang === 'ru' ? 'Не удалось проверить сессию. Вы работаете в автономном режиме.' : 
                        currentLang === 'uz' ? 'Sessiyani tekshirib bo\'lmadi. Oflayn rejimda ishlayapsiz.' : 
                        'Cannot verify session. Working offline.';
        alert(errorMsg);
        // Запускаем периодическую проверку, чтобы проверить позже
        startTokenVerificationTimer();
        return { valid: true, reason: 'network_error' }; // Считаем валидным при ошибке сети
    }
}

console.log('✅ Token-verification.js loaded');
