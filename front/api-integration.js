// API Integration - Override localStorage functions to use Backend API
// Этот файл переопределяет функции для использования бэкенда вместо localStorage

console.log('🔌 Подключение API интеграции...');

// Сохраним оригинальные функции
const originalLogin = window.login;
const originalRegister = window.register;

// Переопределяем функцию login
window.login = async function() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert(currentLanguage === 'ru' ? 'Введите логин и пароль' : 
              currentLanguage === 'uz' ? 'Login va parolni kiriting' : 
              'Enter username and password');
        return;
    }

    try {
        console.log('🔐 Отправка запроса на вход через API...');
        
        const result = await API.login(username, password);
        
        console.log('✅ Вход выполнен через API!', result);
        
        // Сохраняем токен
        if (result.token) {
            localStorage.setItem('auth_token', result.token);
            console.log('🔑 Токен сохранен:', result.token);
        }
        
        // Сохраняем данные пользователя
        currentUser = {
            username: username,
            role: result.user.role
        };
        
        localStorage.setItem('current_user', JSON.stringify(currentUser));
        
        // Запускаем автопроверку токена
        if (typeof startTokenVerificationTimer === 'function') {
            startTokenVerificationTimer();
        }
        
        showApplication();
        
        // ВАЖНО: Загружаем комнаты с сервера после входа
        setTimeout(() => {
            if (window.forceLoadRoomsFromServer) {
                console.log('🔄 Загрузка комнат после входа...');
                window.forceLoadRoomsFromServer();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Ошибка входа через API:', error);
        
        // Показываем ошибку пользователю
        const message = error.message || 'Ошибка подключения';
        document.getElementById('loginMessage').textContent = message;
        document.getElementById('loginMessage').style.color = '#ff4757';
        
        // Если API недоступен, используем старый способ
        if (error.message.includes('Failed to fetch')) {
            console.warn('⚠️ API недоступен, используем localStorage');
            document.getElementById('loginMessage').textContent += 
                ' (API недоступен, используется локальное хранилище)';
            
            // Вызываем оригинальную функцию
            if (originalLogin) {
                originalLogin();
            }
        }
    }
};

// Переопределяем функцию register
window.register = async function() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!username || !password) {
        alert(currentLanguage === 'ru' ? 'Заполните все поля' : 
              currentLanguage === 'uz' ? 'Barcha maydonlarni to\'ldiring' : 
              'Fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert(currentLanguage === 'ru' ? 'Пароли не совпадают' : 
              currentLanguage === 'uz' ? 'Parollar mos kelmadi' : 
              'Passwords do not match');
        return;
    }

    try {
        console.log('📝 Регистрация через API...');
        
        const result = await API.register(username, password);
        
        console.log('✅ Регистрация успешна через API!', result);
        
        alert(currentLanguage === 'ru' ? 'Регистрация успешна! Ожидайте подтверждения администратора.' : 
              currentLanguage === 'uz' ? 'Ro\'yxatdan o\'tish muvaffaqiyatli! Administrator tasdigini kuting.' : 
              'Registration successful! Wait for administrator confirmation.');
        
        showAuthTab('login');
        
        // Очистка формы
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';
        
    } catch (error) {
        console.error('❌ Ошибка регистрации через API:', error);
        
        alert(error.message || 'Ошибка регистрации');
        
        // Если API недоступен, используем старый способ
        if (error.message.includes('Failed to fetch') && originalRegister) {
            console.warn('⚠️ API недоступен, используем localStorage');
            originalRegister();
        }
    }
};

console.log('✅ API интеграция подключена! Логин и регистрация будут использовать бэкенд.');
