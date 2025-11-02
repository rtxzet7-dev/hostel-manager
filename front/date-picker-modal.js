// Date Picker Modal for Admin Panel
// Модальное окно с календарем для выбора даты

console.log('📅 Подключение Date Picker Modal...');

// Создаем HTML для модального окна с календарем
const datePickerHTML = `
<div id="datePickerModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 400px; padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 id="datePickerTitle" style="font-size: 1.25rem; font-weight: 700;">Выберите дату</h3>
            <button onclick="closeDatePicker()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0; width: 30px; height: 30px;">✕</button>
        </div>
        
        <div id="datePickerInfo" style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem; font-size: 0.875rem;">
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                <span id="datePickerLabel">Дата истечения:</span>
            </label>
            <input 
                type="date" 
                id="datePickerInput" 
                style="
                    width: 100%;
                    padding: 0.75rem;
                    background: rgba(255,255,255,0.1);
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 0.5rem;
                    color: white;
                    font-size: 1rem;
                    cursor: pointer;
                "
            />
        </div>
        
        <div style="display: flex; gap: 0.75rem;">
            <button 
                onclick="confirmDatePicker()" 
                class="btn-success" 
                style="flex: 1;"
                id="datePickerConfirm"
            >
                ✓ Подтвердить
            </button>
            <button 
                onclick="closeDatePicker()" 
                class="btn-secondary" 
                style="flex: 1;"
                id="datePickerCancel"
            >
                ✕ Отмена
            </button>
        </div>
    </div>
</div>
`;

// Добавляем модальное окно в документ
document.body.insertAdjacentHTML('beforeend', datePickerHTML);

// Глобальная переменная для callback
let datePickerCallback = null;

// Функция открытия календаря
window.openDatePicker = function(options = {}) {
    return new Promise((resolve) => {
        datePickerCallback = resolve;
        
        const modal = document.getElementById('datePickerModal');
        const input = document.getElementById('datePickerInput');
        const title = document.getElementById('datePickerTitle');
        const label = document.getElementById('datePickerLabel');
        const info = document.getElementById('datePickerInfo');
        const confirmBtn = document.getElementById('datePickerConfirm');
        const cancelBtn = document.getElementById('datePickerCancel');
        
        // Устанавливаем заголовок
        title.textContent = options.title || (currentLanguage === 'ru' ? 'Выберите дату' : 
                                             currentLanguage === 'uz' ? 'Sanani tanlang' : 
                                             'Select date');
        
        // Устанавливаем метку
        label.textContent = options.label || (currentLanguage === 'ru' ? 'Дата истечения:' : 
                                              currentLanguage === 'uz' ? 'Tugash sanasi:' : 
                                              'Expiry date:');
        
        // Устанавливаем информацию
        if (options.info) {
            info.textContent = options.info;
            info.style.display = 'block';
        } else {
            info.style.display = 'none';
        }
        
        // Устанавливаем минимальную дату (сегодня)
        const today = new Date().toISOString().split('T')[0];
        input.setAttribute('min', today);
        
        // Устанавливаем начальное значение
        if (options.defaultDate) {
            input.value = options.defaultDate;
        } else {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            input.value = defaultDate.toISOString().split('T')[0];
        }
        
        // Переводим кнопки
        confirmBtn.textContent = currentLanguage === 'ru' ? '✓ Подтвердить' : 
                                currentLanguage === 'uz' ? '✓ Tasdiqlash' : 
                                '✓ Confirm';
        
        cancelBtn.textContent = currentLanguage === 'ru' ? '✕ Отмена' : 
                               currentLanguage === 'uz' ? '✕ Bekor qilish' : 
                               '✕ Cancel';
        
        // Показываем модальное окно
        modal.style.display = 'block';
        
        // Фокус на input
        setTimeout(() => input.focus(), 100);
    });
};

// Функция закрытия календаря
window.closeDatePicker = function() {
    const modal = document.getElementById('datePickerModal');
    modal.style.display = 'none';
    
    if (datePickerCallback) {
        datePickerCallback(null);
        datePickerCallback = null;
    }
};

// Функция подтверждения выбора даты
window.confirmDatePicker = function() {
    const input = document.getElementById('datePickerInput');
    const selectedDate = input.value;
    
    if (!selectedDate) {
        alert(currentLanguage === 'ru' ? 'Выберите дату!' : 
              currentLanguage === 'uz' ? 'Sanani tanlang!' : 
              'Please select a date!');
        return;
    }
    
    // Проверка что дата не в прошлом
    const selected = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selected < today) {
        alert(currentLanguage === 'ru' ? 'Дата не может быть в прошлом!' : 
              currentLanguage === 'uz' ? 'Sana o\'tmishda bo\'lishi mumkin emas!' : 
              'Date cannot be in the past!');
        return;
    }
    
    const modal = document.getElementById('datePickerModal');
    modal.style.display = 'none';
    
    if (datePickerCallback) {
        datePickerCallback(selectedDate);
        datePickerCallback = null;
    }
};

// Закрытие при клике вне модального окна
document.addEventListener('click', function(event) {
    const modal = document.getElementById('datePickerModal');
    if (event.target === modal) {
        closeDatePicker();
    }
});

// Поддержка Enter для подтверждения
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('datePickerModal');
    if (modal.style.display === 'block') {
        if (event.key === 'Enter') {
            confirmDatePicker();
        } else if (event.key === 'Escape') {
            closeDatePicker();
        }
    }
});

console.log('✅ Date Picker Modal готов!');
