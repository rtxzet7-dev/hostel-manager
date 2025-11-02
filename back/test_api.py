"""
Тестовый скрипт для проверки API
Запустите бэкенд (python app.py) перед запуском этого скрипта
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def print_response(response):
    """Красивый вывод ответа"""
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")
    print("-" * 60)

def test_health_check():
    """Проверка работоспособности API"""
    print("\n🔍 Тест 1: Проверка здоровья API")
    response = requests.get(f"{BASE_URL}/health")
    print_response(response)

def test_login():
    """Тест входа"""
    print("\n🔍 Тест 2: Вход в систему")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "Kvv",
        "password": "Kvv08072001"
    })
    print_response(response)
    
    if response.status_code == 200:
        token = response.json().get('token')
        print(f"✅ Токен получен: {token}")
        return token
    return None

def test_register():
    """Тест регистрации"""
    print("\n🔍 Тест 3: Регистрация нового пользователя")
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "test_user",
        "password": "test123"
    })
    print_response(response)

def test_rooms(token):
    """Тест управления комнатами"""
    print("\n🔍 Тест 4: Получение комнат")
    response = requests.get(f"{BASE_URL}/rooms", headers={
        "Authorization": f"Bearer {token}"
    })
    print_response(response)
    
    print("\n🔍 Тест 5: Создание комнаты")
    response = requests.post(f"{BASE_URL}/rooms", 
        headers={"Authorization": f"Bearer {token}"},
        json={
            "id": "101",
            "name": "Room 101",
            "beds": [],
            "residents": []
        }
    )
    print_response(response)
    
    print("\n🔍 Тест 6: Обновление комнаты")
    response = requests.put(f"{BASE_URL}/rooms/101",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "id": "101",
            "name": "Room 101 Updated",
            "beds": [],
            "residents": []
        }
    )
    print_response(response)

def test_staff(token):
    """Тест управления персоналом"""
    print("\n🔍 Тест 7: Получение персонала")
    response = requests.get(f"{BASE_URL}/staff", headers={
        "Authorization": f"Bearer {token}"
    })
    print_response(response)
    
    print("\n🔍 Тест 8: Добавление сотрудника")
    response = requests.post(f"{BASE_URL}/staff",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Иван Иванов",
            "position": "manager",
            "rate": 50000,
            "workedDays": {}
        }
    )
    print_response(response)

def run_all_tests():
    """Запуск всех тестов"""
    print("=" * 60)
    print("🧪 ТЕСТИРОВАНИЕ API HOSTEL MANAGER")
    print("=" * 60)
    
    try:
        # Тест 1: Health Check
        test_health_check()
        
        # Тест 2: Login
        token = test_login()
        
        if not token:
            print("\n❌ Не удалось получить токен. Остальные тесты пропущены.")
            return
        
        # Тест 3: Register
        test_register()
        
        # Тест 4-6: Rooms
        test_rooms(token)
        
        # Тест 7-8: Staff
        test_staff(token)
        
        print("\n" + "=" * 60)
        print("✅ ВСЕ ТЕСТЫ ВЫПОЛНЕНЫ")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ОШИБКА: Не удалось подключиться к API")
        print("Убедитесь что бэкенд запущен (python app.py)")
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")

if __name__ == "__main__":
    run_all_tests()
