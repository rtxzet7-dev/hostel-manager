"""
Утилита для проверки сетевых настроек
Показывает все доступные IP адреса для подключения
"""

import socket
import platform
import subprocess

def get_local_ip():
    """Получить локальный IP адрес"""
    try:
        # Создаем временное соединение для определения IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "Не удалось определить"

def get_hostname():
    """Получить имя хоста"""
    return socket.gethostname()

def get_all_ips():
    """Получить все IP адреса"""
    hostname = socket.gethostname()
    try:
        ips = socket.gethostbyname_ex(hostname)[2]
        return [ip for ip in ips if not ip.startswith("127.")]
    except:
        return []

def check_port(port=5000):
    """Проверить доступность порта"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('0.0.0.0', port))
        sock.close()
        return True, "Порт свободен"
    except socket.error:
        return False, "Порт занят другим приложением"

def check_firewall():
    """Проверить статус брандмауэра (только Windows)"""
    if platform.system() != 'Windows':
        return "Не Windows система"
    
    try:
        result = subprocess.run(
            ['netsh', 'advfirewall', 'show', 'allprofiles', 'state'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if 'ON' in result.stdout:
            return "Включен (требуется настройка правил)"
        elif 'OFF' in result.stdout:
            return "Выключен"
        else:
            return "Неизвестен"
    except:
        return "Не удалось проверить"

def main():
    print("=" * 70)
    print("🔍 ПРОВЕРКА СЕТЕВЫХ НАСТРОЕК HOSTEL MANAGER")
    print("=" * 70)
    print()
    
    # Системная информация
    print("📊 Системная информация:")
    print(f"   Операционная система: {platform.system()} {platform.release()}")
    print(f"   Имя компьютера: {get_hostname()}")
    print()
    
    # IP адреса
    print("🌐 Сетевые адреса:")
    local_ip = get_local_ip()
    print(f"   Основной IP: {local_ip}")
    
    all_ips = get_all_ips()
    if all_ips:
        print(f"   Все доступные IP:")
        for ip in all_ips:
            print(f"      - {ip}")
    print()
    
    # Проверка порта
    print("🔌 Проверка порта 5000:")
    port_free, port_msg = check_port(5000)
    print(f"   Статус: {port_msg}")
    print()
    
    # Брандмауэр
    print("🛡️ Брандмауэр:")
    firewall_status = check_firewall()
    print(f"   Статус: {firewall_status}")
    print()
    
    # URL для доступа
    print("=" * 70)
    print("✅ АДРЕСА ДЛЯ ПОДКЛЮЧЕНИЯ:")
    print("=" * 70)
    print()
    
    if port_free:
        print("📱 С этого компьютера:")
        print(f"   http://localhost:5000")
        print(f"   http://127.0.0.1:5000")
        print()
        
        if local_ip != "Не удалось определить":
            print("🌍 С других устройств в локальной сети:")
            print(f"   http://{local_ip}:5000")
            if all_ips:
                for ip in all_ips:
                    if ip != local_ip:
                        print(f"   http://{ip}:5000")
            print()
            
            print("📋 API Health Check:")
            print(f"   http://{local_ip}:5000/api/health")
            print()
    else:
        print("❌ ВНИМАНИЕ: Порт 5000 занят!")
        print("   Остановите другие приложения или измените порт в app.py")
        print()
    
    # Рекомендации
    print("=" * 70)
    print("💡 РЕКОМЕНДАЦИИ:")
    print("=" * 70)
    print()
    
    if not port_free:
        print("⚠️  Освободите порт 5000 или измените его в app.py")
        print()
    
    if "Включен" in firewall_status:
        print("⚠️  Брандмауэр включен. Для доступа из локальной сети выполните:")
        print()
        print("   PowerShell от имени администратора:")
        print("   New-NetFirewallRule -DisplayName 'Hostel Manager' \\")
        print("                       -Direction Inbound \\")
        print("                       -Protocol TCP \\")
        print("                       -LocalPort 5000 \\")
        print("                       -Action Allow")
        print()
    
    if local_ip != "Не удалось определить":
        print("✅ Всё готово для запуска!")
        print(f"   1. Запустите: python app.py")
        print(f"   2. Откройте на других устройствах: http://{local_ip}:5000")
        print()
    
    print("=" * 70)

if __name__ == "__main__":
    main()
