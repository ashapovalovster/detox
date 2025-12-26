<?php
header('Content-Type: application/json; charset=utf-8');

// Настройки БД
$host = 'localhost';
$db   = 'detox_clinic';  // ← ИЗМЕНИТЕ на ваше имя БД
$user = 'root';           // ← ИЗМЕНИТЕ на вашего пользователя
$pass = '';               // ← ИЗМЕНИТЕ на ваш пароль
$dsn  = "mysql:host=$host;dbname=$db;charset=utf8mb4";

// Чтение JSON
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$name  = trim($data['name']  ?? '');
$phone = trim($data['phone'] ?? '');

if (!$name || !$phone) {
    echo json_encode([
        'success' => false,
        'message' => 'Заполните все поля.'
    ]);
    exit;
}

// 1) Валидация телефона (только цифры, + и пробел/тире)
$phoneClean = preg_replace('/[^\d\+]/', '', $phone);
if (strlen($phoneClean) < 10) {
    echo json_encode([
        'success' => false,
        'message' => 'Некорректный телефон.'
    ]);
    exit;
}

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 2) Проверка дубля за последние 5 минут
    $stmt = $pdo->prepare("
        SELECT id FROM applications
        WHERE name = :name AND phone = :phone
          AND created_at >= (NOW() - INTERVAL 5 MINUTE)
        LIMIT 1
    ");
    $stmt->execute([
        ':name'  => $name,
        ':phone' => $phone
    ]);

    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Вы уже отправляли заявку менее 5 минут назад.'
        ]);
        exit;
    }

    // 3) Вставка записи в таблицу
    $insert = $pdo->prepare("
        INSERT INTO applications (name, phone)
        VALUES (:name, :phone)
    ");
    $insert->execute([
        ':name'  => $name,
        ':phone' => $phone
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Заявка успешно отправлена.'
    ]);

} catch (Exception $e) {
    //DEBUG: раскомментируйте для отладки
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()  // ← покажет реальную ошибку БД
    ]);

    // echo json_encode([
    //     'success' => false,
    //     'message' => 'Ошибка сервера.'
    // ]);
}
