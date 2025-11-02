#!/usr/bin/env python3
"""
Скрипт миграции данных персонала
Преобразует старую структуру в новую (с разделением по пользователям)
"""

import json
import os

DATA_DIR = 'data'
STAFF_FILE = os.path.join(DATA_DIR, 'staff.json')
STAFF_BACKUP = os.path.join(DATA_DIR, 'staff_backup.json')

def migrate_staff():
    """Миграция данных персонала"""
    
    if not os.path.exists(STAFF_FILE):
        print("❌ Файл staff.json не найден")
        return
    
    # Загружаем текущие данные
    with open(STAFF_FILE, 'r', encoding='utf-8') as f:
        old_data = json.load(f)
    
    # Создаем бэкап
    with open(STAFF_BACKUP, 'w', encoding='utf-8') as f:
        json.dump(old_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Создан бэкап: {STAFF_BACKUP}")
    
    # Проверяем структуру
    if not old_data:
        print("⚠️  Файл пустой, миграция не требуется")
        return
    
    # Проверяем, не мигрировано ли уже
    first_key = next(iter(old_data))
    first_value = old_data[first_key]
    
    # Если first_value это словарь со структурой сотрудников внутри,
    # значит уже новый формат
    if isinstance(first_value, dict) and any(
        isinstance(v, dict) and 'name' in v and 'position' in v
        for v in first_value.values()
    ):
        print("✅ Данные уже в новом формате")
        return
    
    # Старый формат - все сотрудники в корне
    # Переносим всех сотрудников под администратора "Kvv"
    new_data = {
        "Kvv": old_data
    }
    
    # Сохраняем новую структуру
    with open(STAFF_FILE, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)
    
    print("✅ Миграция завершена!")
    print(f"   Перенесено сотрудников: {len(old_data)}")
    print(f"   Все сотрудники привязаны к пользователю 'Kvv'")

if __name__ == '__main__':
    print("🔄 Начало миграции данных персонала...")
    migrate_staff()
    print("✨ Готово!")
