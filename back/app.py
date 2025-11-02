from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)

# Разрешаем CORS для всех доменов
CORS(app, 
     resources={r"/*": {
         "origins": "*",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": False,
         "max_age": 3600
     }})

# Путь к файлам данных
DATA_DIR = 'data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
ROOMS_FILE = os.path.join(DATA_DIR, 'rooms.json')
STAFF_FILE = os.path.join(DATA_DIR, 'staff.json')

# Создаем папку для данных если её нет
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def load_json(filepath):
    """Загрузка данных из JSON файла"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_json(filepath, data):
    """Сохранение данных в JSON файл"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Функция проверки истекших аккаунтов
def check_expired_accounts():
    """Проверка и блокировка истекших аккаунтов"""
    users = load_json(USERS_FILE)
    changed = False
    
    for username, user in users.items():
        if user.get('accessExpires') and user['status'] == 'active':
            try:
                expiry_date = datetime.fromisoformat(user['accessExpires'])
                if expiry_date < datetime.now():
                    user['status'] = 'expired'
                    changed = True
                    print(f"⚠️  Аккаунт {username} автоматически заблокирован (истек срок)")
            except:
                pass
    
    if changed:
        save_json(USERS_FILE, users)

def init_data():
    """Инициализация файлов данных с начальными значениями"""
    
    # Пользователи
    if not os.path.exists(USERS_FILE):
        users = {
            "Kvv": {
                "password": "Kvv08072001",
                "role": "admin",
                "status": "active",
                "accessExpires": "2099-12-31",
                "createdAt": datetime.now().isoformat(),
                "residentsCount": 0
            }
        }
        save_json(USERS_FILE, users)
    
    # Проверяем истекшие аккаунты при запуске
    check_expired_accounts()
    
    # Комнаты
    if not os.path.exists(ROOMS_FILE):
        rooms = {}
        save_json(ROOMS_FILE, rooms)
    
    # Персонал
    if not os.path.exists(STAFF_FILE):
        staff = {}
        save_json(STAFF_FILE, staff)

# Middleware для логирования всех запросов
@app.before_request
def log_request():
    if request.path.startswith('/api/'):
        print(f"📨 {request.method} {request.path} from {request.remote_addr}")

# Декоратор для проверки авторизации
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Простая проверка токена (username из заголовка)
        try:
            username = token.replace('Bearer ', '')
            users = load_json(USERS_FILE)
            if username not in users:
                return jsonify({'error': 'Invalid token'}), 401
            
            return f(current_user=username, *args, **kwargs)
        except:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated

# ==================== AUTH ENDPOINTS ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    users = load_json(USERS_FILE)
    
    if username in users:
        return jsonify({'error': 'User already exists'}), 400
    
    users[username] = {
        "password": password,
        "role": "user",
        "status": "pending",
        "accessExpires": None,
        "createdAt": datetime.now().isoformat(),
        "residentsCount": 0
    }
    
    save_json(USERS_FILE, users)
    
    return jsonify({
        'message': 'Registration successful',
        'username': username
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Вход в систему"""
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    print(f"\n{'='*60}")
    print(f"🔐 LOGIN ATTEMPT")
    print(f"   Username: {username}")
    print(f"   From IP: {request.remote_addr}")
    print(f"{'='*60}\n")
    
    if not username or not password:
        print(f"❌ Login failed: Missing credentials")
        return jsonify({'error': 'Username and password are required'}), 400
    
    users = load_json(USERS_FILE)
    
    if username not in users:
        print(f"❌ Login failed: User not found")
        return jsonify({'error': 'User not found'}), 404
    
    user = users[username]
    
    if user['password'] != password:
        print(f"❌ Login failed: Incorrect password")
        return jsonify({'error': 'Incorrect password'}), 401
    
    # Проверка статуса
    if user['status'] == 'pending':
        return jsonify({'error': 'Account is waiting for administrator confirmation', 'status': 'pending'}), 403
    
    if user['status'] == 'expired':
        return jsonify({'error': 'Account has expired', 'status': 'expired'}), 403
    
    if user['status'] == 'suspended':
        return jsonify({'error': 'Account is suspended', 'status': 'suspended'}), 403
    
    # Проверка срока действия
    if user.get('accessExpires'):
        if datetime.fromisoformat(user['accessExpires']) < datetime.now():
            user['status'] = 'expired'
            users[username] = user
            save_json(USERS_FILE, users)
            return jsonify({'error': 'Account has expired', 'status': 'expired'}), 403
    
    print(f"✅ Login successful!")
    print(f"   User: {username}")
    print(f"   Role: {user['role']}")
    print(f"   Status: {user['status']}\n")
    
    return jsonify({
        'message': 'Login successful',
        'token': username,  # Простой токен (в продакшене использовать JWT)
        'user': {
            'username': username,
            'role': user['role'],
            'status': user['status']
        }
    }), 200

@app.route('/api/auth/users', methods=['GET'])
@token_required
def get_users(current_user):
    """Получить список всех пользователей (только для админа)"""
    users = load_json(USERS_FILE)
    
    if users[current_user]['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    return jsonify({'users': users}), 200

@app.route('/api/auth/users/<username>', methods=['PUT'])
@token_required
def update_user(current_user, username):
    """Обновить пользователя (только для админа)"""
    users = load_json(USERS_FILE)
    
    if users[current_user]['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    if username not in users:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    # Обновляем разрешенные поля
    if 'status' in data:
        users[username]['status'] = data['status']
    if 'accessExpires' in data:
        users[username]['accessExpires'] = data['accessExpires']
    if 'role' in data:
        users[username]['role'] = data['role']
    
    save_json(USERS_FILE, users)
    
    return jsonify({
        'message': 'User updated successfully',
        'user': users[username]
    }), 200

@app.route('/api/auth/users/<username>', methods=['DELETE'])
@token_required
def delete_user(current_user, username):
    """Удалить пользователя (только для админа)"""
    users = load_json(USERS_FILE)
    
    if users[current_user]['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    if username not in users:
        return jsonify({'error': 'User not found'}), 404
    
    if username == 'Kvv':
        return jsonify({'error': 'Cannot delete main admin'}), 403
    
    del users[username]
    save_json(USERS_FILE, users)
    
    return jsonify({'message': 'User deleted successfully'}), 200

# ==================== ROOMS ENDPOINTS ====================

@app.route('/api/rooms', methods=['GET'])
@token_required
def get_rooms(current_user):
    """Получить комнаты текущего пользователя"""
    all_rooms = load_json(ROOMS_FILE)
    
    # Возвращаем только данные текущего пользователя
    user_rooms = all_rooms.get(current_user, {})
    
    # Если пусто, возвращаем пустую структуру
    if not user_rooms:
        user_rooms = {
            'rooms': [],
            'bedsState': {},
            'residents': [],
            'bedNumbers': {}
        }
    
    print(f"📥 Загрузка комнат для {current_user}: {len(user_rooms.get('rooms', [])) if isinstance(user_rooms.get('rooms'), list) else 'unknown'}")
    
    # Возвращаем данные БЕЗ дополнительной обертки 'rooms'
    return jsonify(user_rooms), 200

@app.route('/api/rooms', methods=['POST'])
@token_required
def create_room(current_user):
    """Создать новую комнату или сохранить все комнаты целиком"""
    data = request.json
    
    # Загружаем все данные
    all_rooms = load_json(ROOMS_FILE)
    
    # Если пришла структура со всеми данными (rooms, bedsState, residents, bedNumbers)
    if 'rooms' in data or 'bedsState' in data or 'residents' in data:
        print(f"💾 Сохранение всех комнат для пользователя {current_user}")
        print(f"   Комнат: {len(data.get('rooms', [])) if isinstance(data.get('rooms'), list) else 'unknown'}")
        
        # Сохраняем данные ТОЛЬКО для текущего пользователя
        all_rooms[current_user] = data
        save_json(ROOMS_FILE, all_rooms)
        
        return jsonify({'message': 'All rooms data saved successfully'}), 200
    
    # Иначе создаем одну комнату (старый способ)
    rooms = load_json(ROOMS_FILE)
    room_id = data.get('id', str(len(rooms) + 1))
    
    # Если rooms - это просто словарь комнат, обновляем его
    if isinstance(rooms, dict) and 'rooms' not in rooms:
        rooms[room_id] = data
    else:
        # Если уже новая структура
        if 'rooms' not in rooms:
            rooms = {'rooms': {}, 'bedsState': {}, 'residents': {}, 'bedNumbers': {}}
        rooms['rooms'][room_id] = data
    
    save_json(ROOMS_FILE, rooms)
    
    # Возвращаем правильную структуру
    room_data = rooms.get(room_id) if isinstance(rooms, dict) and 'rooms' not in rooms else rooms.get('rooms', {}).get(room_id)
    
    return jsonify({
        'message': 'Room created successfully',
        'room': room_data
    }), 201

@app.route('/api/rooms/<room_id>', methods=['PUT'])
@token_required
def update_room(current_user, room_id):
    """Обновить комнату"""
    rooms = load_json(ROOMS_FILE)
    
    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404
    
    data = request.json
    rooms[room_id] = data
    
    save_json(ROOMS_FILE, rooms)
    
    return jsonify({
        'message': 'Room updated successfully',
        'room': rooms[room_id]
    }), 200

@app.route('/api/rooms/<room_id>', methods=['DELETE'])
@token_required
def delete_room(current_user, room_id):
    """Удалить комнату"""
    rooms = load_json(ROOMS_FILE)
    
    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404
    
    del rooms[room_id]
    save_json(ROOMS_FILE, rooms)
    
    return jsonify({'message': 'Room deleted successfully'}), 200

@app.route('/api/rooms/all', methods=['DELETE'])
@token_required
def delete_all_rooms(current_user):
    """Удалить все комнаты (сброс)"""
    users = load_json(USERS_FILE)
    
    if users[current_user]['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    save_json(ROOMS_FILE, {})
    
    return jsonify({'message': 'All rooms deleted successfully'}), 200

# ==================== STAFF ENDPOINTS ====================

@app.route('/api/staff', methods=['GET'])
@token_required
def get_staff(current_user):
    """Получить весь персонал"""
    staff = load_json(STAFF_FILE)
    return jsonify({'staff': staff}), 200

@app.route('/api/staff', methods=['POST'])
@token_required
def create_staff(current_user):
    """Создать нового сотрудника"""
    data = request.json
    staff = load_json(STAFF_FILE)
    
    employee_id = str(int(datetime.now().timestamp() * 1000))
    staff[employee_id] = data
    
    save_json(STAFF_FILE, staff)
    
    return jsonify({
        'message': 'Employee created successfully',
        'employee': staff[employee_id],
        'id': employee_id
    }), 201

@app.route('/api/staff/<employee_id>', methods=['PUT'])
@token_required
def update_staff(current_user, employee_id):
    """Обновить сотрудника"""
    staff = load_json(STAFF_FILE)
    
    if employee_id not in staff:
        return jsonify({'error': 'Employee not found'}), 404
    
    data = request.json
    staff[employee_id] = data
    
    save_json(STAFF_FILE, staff)
    
    return jsonify({
        'message': 'Employee updated successfully',
        'employee': staff[employee_id]
    }), 200

@app.route('/api/staff/<employee_id>', methods=['DELETE'])
@token_required
def delete_staff(current_user, employee_id):
    """Удалить сотрудника"""
    staff = load_json(STAFF_FILE)
    
    if employee_id not in staff:
        return jsonify({'error': 'Employee not found'}), 404
    
    del staff[employee_id]
    save_json(STAFF_FILE, staff)
    
    return jsonify({'message': 'Employee deleted successfully'}), 200

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Проверка работоспособности API"""
    return jsonify({
        'status': 'ok',
        'message': 'Hostel Manager API is running',
        'timestamp': datetime.now().isoformat()
    }), 200

# ==================== APP INITIALIZATION ====================

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Hostel Manager Backend Server")
    print("=" * 60)
    
    # Инициализация данных
    init_data()
    
    # Получаем локальный IP адрес
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print(f"\n✅ Сервер запущен и доступен по адресам:")
    print(f"   - Локально: http://127.0.0.1:5000")
    print(f"   - В локальной сети: http://{local_ip}:5000")
    print(f"\n📡 API endpoints доступны на /api/*")
    print(f"   Пример: http://{local_ip}:5000/api/health")
    print("\n" + "=" * 60)
    print("Для остановки сервера нажмите Ctrl+C")
    print("=" * 60 + "\n")
    
    # Запускаем сервер на 0.0.0.0 для доступа из локальной сети
    # Используем переменные окружения для продакшена
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '5000'))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)
