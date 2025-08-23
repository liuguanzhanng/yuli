<?php
/**
 * GitHub Webhook处理器
 * 用于接收GitHub推送事件并触发自动部署
 */

// 配置
$config = [
    'secret' => 'your_webhook_secret_here', // 在GitHub设置的Secret
    'deploy_script' => '/path/to/server-deploy.sh', // 部署脚本路径
    'log_file' => '/var/log/webhook.log',
    'allowed_branches' => ['master', 'main'], // 允许触发部署的分支
    'allowed_ips' => [
        '140.82.112.0/20',   // GitHub IP范围
        '185.199.108.0/22',
        '192.30.252.0/22',
        '143.55.64.0/20',
    ]
];

/**
 * 记录日志
 */
function writeLog($message, $level = 'INFO') {
    global $config;
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
    file_put_contents($config['log_file'], $logMessage, FILE_APPEND | LOCK_EX);
}

/**
 * 验证IP地址
 */
function isValidIP($ip) {
    global $config;
    
    foreach ($config['allowed_ips'] as $range) {
        if (strpos($range, '/') !== false) {
            // CIDR格式
            list($subnet, $mask) = explode('/', $range);
            if ((ip2long($ip) & ~((1 << (32 - $mask)) - 1)) == ip2long($subnet)) {
                return true;
            }
        } else {
            // 单个IP
            if ($ip === $range) {
                return true;
            }
        }
    }
    return false;
}

/**
 * 验证GitHub签名
 */
function verifySignature($payload, $signature) {
    global $config;
    
    if (empty($config['secret'])) {
        return true; // 如果没有设置secret，跳过验证
    }
    
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $config['secret']);
    return hash_equals($expectedSignature, $signature);
}

/**
 * 执行部署
 */
function executeDeploy() {
    global $config;
    
    $command = "sudo {$config['deploy_script']} > /dev/null 2>&1 &";
    exec($command, $output, $returnCode);
    
    if ($returnCode === 0) {
        writeLog("部署脚本执行成功");
        return true;
    } else {
        writeLog("部署脚本执行失败，返回码: $returnCode", 'ERROR');
        return false;
    }
}

// 主处理逻辑
try {
    // 检查请求方法
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        writeLog("收到非POST请求: {$_SERVER['REQUEST_METHOD']}", 'WARNING');
        exit('Method Not Allowed');
    }
    
    // 获取客户端IP
    $clientIP = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    $clientIP = explode(',', $clientIP)[0]; // 如果有多个IP，取第一个
    
    writeLog("收到来自 $clientIP 的Webhook请求");
    
    // 验证IP地址（可选，如果GitHub IP经常变化可以注释掉）
    // if (!isValidIP($clientIP)) {
    //     http_response_code(403);
    //     writeLog("IP地址验证失败: $clientIP", 'WARNING');
    //     exit('Forbidden');
    // }
    
    // 获取请求体
    $payload = file_get_contents('php://input');
    if (empty($payload)) {
        http_response_code(400);
        writeLog("空的请求体", 'ERROR');
        exit('Bad Request');
    }
    
    // 验证GitHub签名
    $signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
    if (!verifySignature($payload, $signature)) {
        http_response_code(403);
        writeLog("签名验证失败", 'WARNING');
        exit('Forbidden');
    }
    
    // 解析JSON数据
    $data = json_decode($payload, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        writeLog("JSON解析失败: " . json_last_error_msg(), 'ERROR');
        exit('Bad Request');
    }
    
    // 检查是否是推送事件
    $event = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? '';
    if ($event !== 'push') {
        writeLog("忽略非推送事件: $event");
        exit('OK');
    }
    
    // 检查分支
    $branch = basename($data['ref'] ?? '');
    if (!in_array($branch, $config['allowed_branches'])) {
        writeLog("忽略分支: $branch");
        exit('OK');
    }
    
    // 记录推送信息
    $commits = count($data['commits'] ?? []);
    $pusher = $data['pusher']['name'] ?? 'unknown';
    $repository = $data['repository']['name'] ?? 'unknown';
    
    writeLog("收到推送事件: 仓库=$repository, 分支=$branch, 提交数=$commits, 推送者=$pusher");
    
    // 执行部署
    if (executeDeploy()) {
        writeLog("自动部署触发成功");
        http_response_code(200);
        echo 'Deployment triggered successfully';
    } else {
        writeLog("自动部署触发失败", 'ERROR');
        http_response_code(500);
        echo 'Deployment failed';
    }
    
} catch (Exception $e) {
    writeLog("处理Webhook时发生异常: " . $e->getMessage(), 'ERROR');
    http_response_code(500);
    echo 'Internal Server Error';
}
?>
