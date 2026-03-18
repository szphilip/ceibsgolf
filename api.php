<?php
/**
 * CEIBS Golf 数据存储API
 * 提供数据的读取、保存和备份功能
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理OPTIONS预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 配置 - ⚠️ 部署到服务器后必须修改密码！
define('DATA_DIR', __DIR__ . '/data');
define('BACKUP_DIR', DATA_DIR . '/backups');
define('DATA_FILE', DATA_DIR . '/golf_data.json');
define('API_PASSWORD', 'CHANGE_ME_IN_PRODUCTION'); // ⚠️ 改为强密码，至少12位

// 确保目录存在
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}
if (!is_dir(BACKUP_DIR)) {
    mkdir(BACKUP_DIR, 0755, true);
}

// 添加.htaccess保护data目录
$htaccessFile = DATA_DIR . '/.htaccess';
if (!file_exists($htaccessFile)) {
    file_put_contents($htaccessFile, "Deny from all\nOptions -Indexes");
}

/**
 * 验证密码
 */
function verifyPassword($inputPassword) {
    return $inputPassword === API_PASSWORD;
}

/**
 * 记录日志
 */
function logAction($action, $details = '') {
    $logFile = DATA_DIR . '/access.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $logEntry = "[$timestamp] [$ip] $action $details\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

/**
 * 创建备份
 */
function createBackup($data) {
    $timestamp = date('Y-m-d_H-i-s');
    $backupFile = BACKUP_DIR . "/backup_$timestamp.json";
    
    // 保存备份
    file_put_contents($backupFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // 清理旧备份（保留最近30天的备份）
    $files = glob(BACKUP_DIR . '/backup_*.json');
    $now = time();
    foreach ($files as $file) {
        if ($now - filemtime($file) >= 30 * 24 * 3600) {
            unlink($file);
        }
    }
    
    return $backupFile;
}

/**
 * 获取数据
 */
function getData() {
    if (file_exists(DATA_FILE)) {
        $content = file_get_contents(DATA_FILE);
        return json_decode($content, true);
    }
    return null;
}

/**
 * 保存数据
 */
function saveData($data) {
    // 创建备份
    if (file_exists(DATA_FILE)) {
        $oldData = getData();
        if ($oldData) {
            createBackup($oldData);
        }
    }
    
    // 保存新数据
    $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = file_put_contents(DATA_FILE, $jsonData);
    
    return $result !== false;
}

// ==================== 路由处理 ====================

$method = $_SERVER['REQUEST_METHOD'];

// GET - 获取数据
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'get';
    
    if ($action === 'get') {
        $data = getData();
        
        if ($data) {
            logAction('GET_DATA', 'success');
            echo json_encode([
                'success' => true,
                'data' => $data,
                'timestamp' => filemtime(DATA_FILE),
                'message' => '数据获取成功'
            ]);
        } else {
            logAction('GET_DATA', 'no_data');
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => '暂无数据'
            ]);
        }
    }
    
    // 获取备份列表
    elseif ($action === 'backups') {
        $files = glob(BACKUP_DIR . '/backup_*.json');
        $backups = [];
        
        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'time' => filemtime($file),
                'date' => date('Y-m-d H:i:s', filemtime($file))
            ];
        }
        
        // 按时间倒序排列
        usort($backups, function($a, $b) {
            return $b['time'] - $a['time'];
        });
        
        echo json_encode([
            'success' => true,
            'backups' => $backups,
            'count' => count($backups)
        ]);
    }
    
    // 获取服务器信息
    elseif ($action === 'info') {
        echo json_encode([
            'success' => true,
            'info' => [
                'data_exists' => file_exists(DATA_FILE),
                'data_size' => file_exists(DATA_FILE) ? filesize(DATA_FILE) : 0,
                'last_modified' => file_exists(DATA_FILE) ? date('Y-m-d H:i:s', filemtime(DATA_FILE)) : null,
                'backup_count' => count(glob(BACKUP_DIR . '/backup_*.json')),
                'server_time' => date('Y-m-d H:i:s')
            ]
        ]);
    }
}

// POST - 保存数据
elseif ($method === 'POST') {
    $input = file_get_contents('php://input');
    $requestData = json_decode($input, true);
    
    if (!$requestData) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => '无效的JSON数据'
        ]);
        exit;
    }
    
    // 验证密码
    $password = $requestData['password'] ?? '';
    if (!verifyPassword($password)) {
        http_response_code(401);
        logAction('SAVE_DATA', 'unauthorized');
        echo json_encode([
            'success' => false,
            'message' => '密码错误'
        ]);
        exit;
    }
    
    // 移除密码字段
    unset($requestData['password']);
    
    // 保存数据
    $result = saveData($requestData);
    
    if ($result) {
        logAction('SAVE_DATA', 'success');
        echo json_encode([
            'success' => true,
            'message' => '数据保存成功',
            'timestamp' => time()
        ]);
    } else {
        http_response_code(500);
        logAction('SAVE_DATA', 'failed');
        echo json_encode([
            'success' => false,
            'message' => '数据保存失败'
        ]);
    }
}

else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => '不支持的请求方法'
    ]);
}
