// Admin Panel API Integration
// Переопределение функций управления пользователями для работы с API

console.log('👑 Подключение Admin API интеграции...');

// Переопределяем функцию загрузки ожидающих пользователей
window.loadAdminPendingUsers = async function() {
    const pendingList = document.getElementById('adminPendingUsersList');
    if (!pendingList) return;
    
    try {
        const result = await API.getUsers();
        const users = result.users || {};
        
        const pendingUsers = Object.entries(users).filter(([_, user]) => user.status === 'pending');
        
        if (pendingUsers.length === 0) {
            pendingList.innerHTML = `
                <div class="empty-state">
                    <p>${currentLanguage === 'ru' ? 'Нет заявок на регистрацию' : 
                        currentLanguage === 'uz' ? 'Ro\'yxatdan o\'tish uchun arizalar yo\'q' : 
                        'No pending registrations'}</p>
                </div>
            `;
            return;
        }
        
        pendingList.innerHTML = pendingUsers.map(([username, user]) => `
            <div class="user-card">
                <div class="user-header">
                    <div class="user-info">
                        <div class="user-name">${username}<span class="status-badge status-pending">${
                            currentLanguage === 'ru' ? 'Ожидает' : 
                            currentLanguage === 'uz' ? 'Kutilmoqda' : 
                            'Pending'
                        }</span></div>
                        <div class="user-date">${currentLanguage === 'ru' ? 'Зарегистрирован' : 
                            currentLanguage === 'uz' ? 'Ro\'yxatdan o\'tgan' : 
                            'Registered'}: ${new Date(user.createdAt).toLocaleDateString()}</div>
                        <div class="user-date" style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>🔑 ${currentLanguage === 'ru' ? 'Пароль' : 
                                currentLanguage === 'uz' ? 'Parol' : 
                                'Password'}:</span>
                            <code id="pwd-${username}" style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem; user-select: text;">••••••</code>
                            <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="togglePassword('${username}', '${user.password}')">
                                👁️ ${currentLanguage === 'ru' ? 'Показать' : 
                                    currentLanguage === 'uz' ? 'Ko\'rsatish' : 
                                    'Show'}
                            </button>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn-success" onclick="approveUserWithExpiry('${username}')">
                            ✓ ${currentLanguage === 'ru' ? 'Одобрить' : 
                                currentLanguage === 'uz' ? 'Tasdiqlash' : 
                                'Approve'}
                        </button>
                        <button class="btn-warning" onclick="rejectUser('${username}')">
                            ✕ ${currentLanguage === 'ru' ? 'Отклонить' : 
                                currentLanguage === 'uz' ? 'Rad etish' : 
                                'Reject'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки ожидающих пользователей:', error);
        pendingList.innerHTML = `<div class="empty-state"><p style="color: #ff4757;">Ошибка загрузки данных</p></div>`;
    }
};

// Переопределяем функцию загрузки активных пользователей
window.loadAdminActiveUsers = async function() {
    const activeList = document.getElementById('adminActiveUsersList');
    if (!activeList) return;
    
    try {
        const result = await API.getUsers();
        const users = result.users || {};
        
        const activeUsers = Object.entries(users).filter(([_, user]) => user.status === 'active');
        
        if (activeUsers.length === 0) {
            activeList.innerHTML = `
                <div class="empty-state">
                    <p>${currentLanguage === 'ru' ? 'Нет активных пользователей' : 
                        currentLanguage === 'uz' ? 'Faol foydalanuvchilar yo\'q' : 
                        'No active users'}</p>
                </div>
            `;
            return;
        }
        
        activeList.innerHTML = activeUsers.map(([username, user]) => {
            const expiryDate = user.accessExpires ? new Date(user.accessExpires) : null;
            const isExpiringSoon = expiryDate && (expiryDate - new Date()) < 7 * 24 * 60 * 60 * 1000; // 7 дней
            
            return `
            <div class="user-card">
                <div class="user-header">
                    <div class="user-info">
                        <div class="user-name">${username} ${user.role === 'admin' ? '👑' : ''}<span class="status-badge status-active">${
                            currentLanguage === 'ru' ? 'Активен' : 
                            currentLanguage === 'uz' ? 'Faol' : 
                            'Active'
                        }</span></div>
                        <div class="user-date">
                            ${currentLanguage === 'ru' ? 'Роль' : 'Rol'}: ${user.role === 'admin' ? 
                                (currentLanguage === 'ru' ? 'Администратор' : 'Administrator') : 
                                (currentLanguage === 'ru' ? 'Пользователь' : 'User')}
                        </div>
                        <div class="user-date" style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>🔑 ${currentLanguage === 'ru' ? 'Пароль' : 
                                currentLanguage === 'uz' ? 'Parol' : 
                                'Password'}:</span>
                            <code id="pwd-${username}" style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem; user-select: text;">••••••</code>
                            <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="togglePassword('${username}', '${user.password}')">
                                👁️ ${currentLanguage === 'ru' ? 'Показать' : 
                                    currentLanguage === 'uz' ? 'Ko\'rsatish' : 
                                    'Show'}
                            </button>
                        </div>
                        ${expiryDate ? `
                        <div class="user-date" style="color: ${isExpiringSoon ? '#ffa502' : 'inherit'}">
                            ${currentLanguage === 'ru' ? 'Истекает' : 
                              currentLanguage === 'uz' ? 'Tugaydi' : 
                              'Expires'}: ${expiryDate.toLocaleDateString()}
                            ${isExpiringSoon ? ' ⚠️' : ''}
                        </div>
                        ` : ''}
                    </div>
                    ${username !== 'Kvv' ? `
                    <div class="user-actions">
                        <button class="btn-secondary" onclick="extendUserAccess('${username}')">
                            🔄 ${currentLanguage === 'ru' ? 'Продлить' : 
                                currentLanguage === 'uz' ? 'Uzaytirish' : 
                                'Extend'}
                        </button>
                        <button class="btn-warning" onclick="suspendUser('${username}')">
                            🔒 ${currentLanguage === 'ru' ? 'Заблокировать' : 
                                currentLanguage === 'uz' ? 'Bloklash' : 
                                'Suspend'}
                        </button>
                        <button class="btn-warning" onclick="deleteUser('${username}')">
                            🗑️ ${currentLanguage === 'ru' ? 'Удалить' : 
                                currentLanguage === 'uz' ? 'O\'chirish' : 
                                'Delete'}
                        </button>
                    </div>
                    ` : `
                    <div class="user-actions">
                        <span style="color: #7c4dff; font-weight: 600;">Главный администратор</span>
                    </div>
                    `}
                </div>
            </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки активных пользователей:', error);
        activeList.innerHTML = `<div class="empty-state"><p style="color: #ff4757;">Ошибка загрузки данных</p></div>`;
    }
};

// Переопределяем функцию загрузки заблокированных пользователей
window.loadAdminSuspendedUsers = async function() {
    const suspendedList = document.getElementById('adminSuspendedUsersList');
    if (!suspendedList) return;
    
    try {
        const result = await API.getUsers();
        const users = result.users || {};
        
        const suspendedUsers = Object.entries(users).filter(([_, user]) => 
            user.status === 'suspended' || user.status === 'expired'
        );
        
        if (suspendedUsers.length === 0) {
            suspendedList.innerHTML = `
                <div class="empty-state">
                    <p>${currentLanguage === 'ru' ? 'Нет заблокированных пользователей' : 
                        currentLanguage === 'uz' ? 'Bloklangan foydalanuvchilar yo\'q' : 
                        'No suspended users'}</p>
                </div>
            `;
            return;
        }
        
        suspendedList.innerHTML = suspendedUsers.map(([username, user]) => `
            <div class="user-card">
                <div class="user-header">
                    <div class="user-info">
                        <div class="user-name">${username}<span class="status-badge ${
                            user.status === 'suspended' ? 'status-suspended' : 'status-expired'
                        }">${
                            user.status === 'suspended' ? 
                                (currentLanguage === 'ru' ? 'Заблокирован' : 
                                 currentLanguage === 'uz' ? 'Bloklangan' : 
                                 'Suspended') :
                                (currentLanguage === 'ru' ? 'Истек срок' : 
                                 currentLanguage === 'uz' ? 'Muddati tugagan' : 
                                 'Expired')
                        }</span></div>
                        <div class="user-date" style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>🔑 ${currentLanguage === 'ru' ? 'Пароль' : 
                                currentLanguage === 'uz' ? 'Parol' : 
                                'Password'}:</span>
                            <code id="pwd-${username}" style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem; user-select: text;">••••••</code>
                            <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="togglePassword('${username}', '${user.password}')">
                                👁️ ${currentLanguage === 'ru' ? 'Показать' : 
                                    currentLanguage === 'uz' ? 'Ko\'rsatish' : 
                                    'Show'}
                            </button>
                        </div>
                        ${user.accessExpires ? `
                        <div class="user-date">
                            ${currentLanguage === 'ru' ? 'Срок истек' : 
                              currentLanguage === 'uz' ? 'Muddati tugagan' : 
                              'Expired'}: ${new Date(user.accessExpires).toLocaleDateString()}
                        </div>
                        ` : ''}
                    </div>
                    <div class="user-actions">
                        <button class="btn-success" onclick="reactivateUser('${username}')">
                            ✓ ${currentLanguage === 'ru' ? 'Восстановить' : 
                                currentLanguage === 'uz' ? 'Tiklash' : 
                                'Reactivate'}
                        </button>
                        <button class="btn-warning" onclick="deleteUser('${username}')">
                            🗑️ ${currentLanguage === 'ru' ? 'Удалить' : 
                                currentLanguage === 'uz' ? 'O\'chirish' : 
                                'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки заблокированных пользователей:', error);
        suspendedList.innerHTML = `<div class="empty-state"><p style="color: #ff4757;">Ошибка загрузки данных</p></div>`;
    }
};

// Функция одобрения пользователя с установкой срока
window.approveUserWithExpiry = async function(username) {
    try {
        const dateInput = await openDatePicker({
            title: currentLanguage === 'ru' ? `Одобрить пользователя ${username}` :
                   currentLanguage === 'uz' ? `${username} tasdiqlash` :
                   `Approve user ${username}`,
            label: currentLanguage === 'ru' ? 'Доступ до:' :
                   currentLanguage === 'uz' ? 'Kirish muddati:' :
                   'Access until:',
            info: currentLanguage === 'ru' ? `Выберите дату истечения доступа для ${username}` :
                  currentLanguage === 'uz' ? `${username} uchun kirish tugash sanasini tanlang` :
                  `Select access expiry date for ${username}`
        });
        
        if (!dateInput) {
            return; // Пользователь отменил
        }
        
        const expiryDate = new Date(dateInput);
        
        await API.updateUser(username, {
            status: 'active',
            accessExpires: dateInput
        });
        
        console.log(`✅ Пользователь ${username} одобрен до ${expiryDate.toLocaleDateString()}`);
        
        await loadAdminPendingUsers();
        await loadAdminActiveUsers();
        await loadAdminSuspendedUsers();
        
        alert(currentLanguage === 'ru' ? 
            `Пользователь ${username} одобрен! Доступ до: ${expiryDate.toLocaleDateString()}` : 
            currentLanguage === 'uz' ? 
            `${username} tasdiqlandi! Kirish muddati: ${expiryDate.toLocaleDateString()}` : 
            `User ${username} approved! Access until: ${expiryDate.toLocaleDateString()}`);
            
    } catch (error) {
        console.error('❌ Ошибка одобрения пользователя:', error);
        alert('Ошибка: ' + error.message);
    }
};

// Функция отклонения пользователя
window.rejectUser = async function(username) {
    if (!confirm(`${currentLanguage === 'ru' ? 'Отклонить пользователя' : 
                   currentLanguage === 'uz' ? 'Foydalanuvchini rad etish' : 
                   'Reject user'} ${username}?`)) {
        return;
    }
    
    try {
        await API.deleteUser(username);
        
        console.log(`✅ Пользователь ${username} отклонен`);
        
        await loadAdminPendingUsers();
        await loadAdminActiveUsers();
        await loadAdminSuspendedUsers();
        
        alert(currentLanguage === 'ru' ? 'Пользователь отклонен!' : 
              currentLanguage === 'uz' ? 'Foydalanuvchi rad etildi!' : 
              'User rejected!');
              
    } catch (error) {
        console.error('❌ Ошибка отклонения пользователя:', error);
        alert('Ошибка: ' + error.message);
    }
};

// Функция продления доступа
window.extendUserAccess = async function(username) {
    try {
        // Получаем текущую дату истечения
        const result = await API.getUsers();
        const users = result.users || {};
        const user = users[username];
        
        // Предлагаем дату на 30 дней от текущей даты истечения
        let suggestedDate;
        if (user.accessExpires) {
            suggestedDate = new Date(user.accessExpires);
            // Если срок уже истек, начинаем с сегодня
            if (suggestedDate < new Date()) {
                suggestedDate = new Date();
            }
            suggestedDate.setDate(suggestedDate.getDate() + 30);
        } else {
            suggestedDate = new Date();
            suggestedDate.setDate(suggestedDate.getDate() + 30);
        }
        
        const suggestedDateStr = suggestedDate.toISOString().split('T')[0];
        const currentExpiry = user.accessExpires ? new Date(user.accessExpires).toLocaleDateString() : 
                             (currentLanguage === 'ru' ? 'не установлен' : 
                              currentLanguage === 'uz' ? 'o\'rnatilmagan' : 
                              'not set');
        
        const dateInput = await openDatePicker({
            title: currentLanguage === 'ru' ? `Продлить доступ для ${username}` :
                   currentLanguage === 'uz' ? `${username} uchun muddatni uzaytirish` :
                   `Extend access for ${username}`,
            label: currentLanguage === 'ru' ? 'Новая дата истечения:' :
                   currentLanguage === 'uz' ? 'Yangi tugash sanasi:' :
                   'New expiry date:',
            info: currentLanguage === 'ru' ? `Текущий срок: ${currentExpiry}` :
                  currentLanguage === 'uz' ? `Joriy muddat: ${currentExpiry}` :
                  `Current expiry: ${currentExpiry}`,
            defaultDate: suggestedDateStr
        });
        
        if (!dateInput) {
            return;
        }
        
        const expiryDate = new Date(dateInput);
        
        await API.updateUser(username, {
            status: 'active',
            accessExpires: dateInput
        });
        
        console.log(`✅ Доступ пользователя ${username} продлен до ${expiryDate.toLocaleDateString()}`);
        
        await loadAdminActiveUsers();
        await loadAdminSuspendedUsers();
        
        alert(currentLanguage === 'ru' ? 
            `Доступ продлен до: ${expiryDate.toLocaleDateString()}` : 
            currentLanguage === 'uz' ? 
            `Kirish uzaytirildi: ${expiryDate.toLocaleDateString()}` : 
            `Access extended until: ${expiryDate.toLocaleDateString()}`);
            
    } catch (error) {
        console.error('❌ Ошибка продления доступа:', error);
        alert('Ошибка: ' + error.message);
    }
};

// Функция блокировки пользователя
window.suspendUser = async function(username) {
    if (!confirm(`${currentLanguage === 'ru' ? 'Заблокировать пользователя' : 
                   currentLanguage === 'uz' ? 'Foydalanuvchini bloklash' : 
                   'Suspend user'} ${username}?`)) {
        return;
    }
    
    try {
        await API.updateUser(username, {
            status: 'suspended'
        });
        
        console.log(`✅ Пользователь ${username} заблокирован`);
        
        await loadAdminActiveUsers();
        await loadAdminSuspendedUsers();
        
        alert(currentLanguage === 'ru' ? 'Пользователь заблокирован!' : 
              currentLanguage === 'uz' ? 'Foydalanuvchi bloklandi!' : 
              'User suspended!');
              
    } catch (error) {
        console.error('❌ Ошибка блокировки пользователя:', error);
        alert('Ошибка: ' + error.message);
    }
};

// Функция восстановления пользователя
window.reactivateUser = async function(username) {
    try {
        const dateInput = await openDatePicker({
            title: currentLanguage === 'ru' ? `Восстановить пользователя ${username}` :
                   currentLanguage === 'uz' ? `${username} tiklash` :
                   `Reactivate user ${username}`,
            label: currentLanguage === 'ru' ? 'Доступ до:' :
                   currentLanguage === 'uz' ? 'Kirish muddati:' :
                   'Access until:',
            info: currentLanguage === 'ru' ? `Выберите новую дату истечения доступа для ${username}` :
                  currentLanguage === 'uz' ? `${username} uchun yangi kirish tugash sanasini tanlang` :
                  `Select new access expiry date for ${username}`
        });
        
        if (!dateInput) {
            return;
        }
        
        const expiryDate = new Date(dateInput);
        
        await API.updateUser(username, {
            status: 'active',
            accessExpires: dateInput
        });
        
        console.log(`✅ Пользователь ${username} восстановлен до ${expiryDate.toLocaleDateString()}`);
        
        await loadAdminActiveUsers();
        await loadAdminSuspendedUsers();
        
        alert(currentLanguage === 'ru' ? 
            `Пользователь восстановлен! Доступ до: ${expiryDate.toLocaleDateString()}` : 
            currentLanguage === 'uz' ? 
            `Foydalanuvchi tiklandi! Kirish muddati: ${expiryDate.toLocaleDateString()}` : 
            `User reactivated! Access until: ${expiryDate.toLocaleDateString()}`);
            
    } catch (error) {
        console.error('❌ Ошибка восстановления пользователя:', error);
        alert('Ошибка: ' + error.message);
    }
};

// Функция удаления пользователя
window.deleteUser = async function(username) {
    if (username === 'Kvv') {
        alert(currentLanguage === 'ru' ? 'Нельзя удалить главного администратора!' : 
              currentLanguage === 'uz' ? 'Asosiy administratorni o\'chirish mumkin emas!' : 
              'Cannot delete main administrator!');
        return;
    }
    
    if (!confirm(`${currentLanguage === 'ru' ? 'Удалить пользователя' : 
                   currentLanguage === 'uz' ? 'Foydalanuvchini o\'chirish' : 
                   'Delete user'} ${username}? ${
                   currentLanguage === 'ru' ? 'Это действие нельзя отменить!' : 
                   currentLanguage === 'uz' ? 'Bu harakatni bekor qilib bo\'lmaydi!' : 
                   'This action cannot be undone!'}`)) {
        return;
    }
    
    try {
        await API.deleteUser(username);
        
        console.log(`✅ Пользователь ${username} удален`);
        
        await loadAdminPendingUsers();
        await loadAdminActiveUsers();
        await loadAdminSuspendedUsers();
        
        alert(currentLanguage === 'ru' ? 'Пользователь удален!' : 
              currentLanguage === 'uz' ? 'Foydalanuvchi o\'chirildi!' : 
              'User deleted!');
              
    } catch (error) {
        console.error('❌ Ошибка удаления пользователя:', error);
        alert('Ошибка: ' + error.message);
    }
};

// Функция показа/скрытия пароля
window.togglePassword = function(username, password) {
    const pwdElement = document.getElementById(`pwd-${username}`);
    const btn = event.target;
    
    if (pwdElement.textContent === '••••••') {
        // Показать пароль
        pwdElement.textContent = password;
        pwdElement.style.color = '#00ff88';
        pwdElement.style.fontWeight = '600';
        btn.innerHTML = `🙈 ${currentLanguage === 'ru' ? 'Скрыть' : 
                            currentLanguage === 'uz' ? 'Yashirish' : 
                            'Hide'}`;
    } else {
        // Скрыть пароль
        pwdElement.textContent = '••••••';
        pwdElement.style.color = '';
        pwdElement.style.fontWeight = '';
        btn.innerHTML = `👁️ ${currentLanguage === 'ru' ? 'Показать' : 
                            currentLanguage === 'uz' ? 'Ko\'rsatish' : 
                            'Show'}`;
    }
};

// Функция копирования пароля в буфер обмена
window.copyPassword = function(username, password) {
    navigator.clipboard.writeText(password).then(() => {
        alert(currentLanguage === 'ru' ? 
            `Пароль пользователя ${username} скопирован!` : 
            currentLanguage === 'uz' ? 
            `${username} paroli nusxalandi!` : 
            `Password for ${username} copied!`);
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = password;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(currentLanguage === 'ru' ? 'Пароль скопирован!' : 
              currentLanguage === 'uz' ? 'Parol nusxalandi!' : 
              'Password copied!');
    });
};

console.log('✅ Admin API интеграция подключена!');
