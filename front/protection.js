// 🛡️ ЗАЩИТА ОТ СКАЧИВАНИЯ И КОПИРОВАНИЯ

// 1. Блокировка правой кнопки мыши
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// 2. Блокировка Ctrl+S, Ctrl+U, F12 и других комбинаций
document.addEventListener('keydown', function(e) {
    // Ctrl+S (Сохранить)
    if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        alert('Сохранение файлов запрещено!');
        return false;
    }
    
    // Ctrl+U (Просмотр источника)
    if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        alert('Просмотр исходного кода запрещен!');
        return false;
    }
    
    // Ctrl+Shift+I / F12 (DevTools)
    if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && e.keyCode === 73)) {
        e.preventDefault();
        alert('Инструменты разработчика отключены!');
        return false;
    }
    
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+C (Inspect)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
    }
});

// 3. Блокировка выделения текста (опционально)
// Раскомментируйте если нужно:
// document.addEventListener('selectstart', function(e) {
//     e.preventDefault();
//     return false;
// });

// 4. Блокировка копирования (опционально)
// document.addEventListener('copy', function(e) {
//     e.preventDefault();
//     alert('Копирование запрещено!');
//     return false;
// });

// 5. Защита от скачивания через Ctrl+P (печать)
// Разрешаем только через специальную кнопку в приложении
let allowPrint = false;
window.allowPrint = function() {
    allowPrint = true;
    setTimeout(() => { allowPrint = false; }, 1000);
};

window.addEventListener('beforeprint', function(e) {
    if (!allowPrint) {
        e.preventDefault();
        alert('Печать доступна только через кнопку в приложении!');
        return false;
    }
});

// 6. Предупреждение о попытках обхода
console.log('%c🛡️ ЗАЩИТА АКТИВИРОВАНА', 'color: red; font-size: 20px; font-weight: bold');
console.log('%cВнимание! Попытки взлома или обхода системы защиты преследуются по закону.', 'color: orange; font-size: 14px');

// 7. Детект DevTools
let devtoolsOpen = false;
const threshold = 160;

setInterval(function() {
    if (window.outerWidth - window.innerWidth > threshold || 
        window.outerHeight - window.innerHeight > threshold) {
        if (!devtoolsOpen) {
            devtoolsOpen = true;
            document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #070518; color: white; font-size: 24px; text-align: center;"><div><h1 style="color: #ff4757;">⚠️ Инструменты разработчика обнаружены!</h1><p>Закройте DevTools и обновите страницу.</p></div></div>';
        }
    }
}, 500);

console.log('✅ Protection.js loaded');
