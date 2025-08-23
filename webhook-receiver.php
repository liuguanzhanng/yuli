<?php
/**
 * GitHub Webhook 接收器
 * 用于接收GitHub推送事件并触发博客自动同步
 */

// 配置
$secret = 'your-webhook-secret'; // 在GitHub设置的Secret
$sync_script = '/path/to/server-auto-sync.sh'; // 同步脚本路径
$log_file = '/var/log/webhook.log'; // 日志文件

// 日志函数
function writeLog($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// 验证GitHub签名
function verifySignature($payload, $signature, $secret) {
    $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature);
}

// 获取请求数据
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

// 验证请求
if (empty($signature)) {
    http_response_code(400);
    writeLog('ERROR: Missing signature');
    exit('Missing signature');
}

if (!verifySignature($payload, $signature, $secret)) {
    http_response_code(401);
    writeLog('ERROR: Invalid signature');
    exit('Invalid signature');
}

// 解析payload
$data = json_decode($payload, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    writeLog('ERROR: Invalid JSON payload');
    exit('Invalid JSON');
}

// 检查是否是推送到master分支
if (isset($data['ref']) && $data['ref'] === 'refs/heads/master') {
    writeLog('INFO: Received push to master branch');
    
    // 获取提交信息
    $commits = $data['commits'] ?? [];
    $commit_messages = array_map(function($commit) {
        return $commit['message'];
    }, $commits);
    
    writeLog('INFO: Commits: ' . implode(', ', $commit_messages));
    
    // 异步执行同步脚本
    $command = "nohup $sync_script > /dev/null 2>&1 &";
    exec($command);
    
    writeLog('INFO: Sync script triggered');
    
    // 返回成功响应
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Sync triggered',
        'timestamp' => date('c')
    ]);
} else {
    // 不是master分支的推送，忽略
    writeLog('INFO: Ignoring push to ' . ($data['ref'] ?? 'unknown branch'));
    
    http_response_code(200);
    echo json_encode([
        'status' => 'ignored',
        'message' => 'Not master branch',
        'timestamp' => date('c')
    ]);
}
?>
