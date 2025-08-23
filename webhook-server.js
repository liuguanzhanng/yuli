const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
    port: 3001,
    secret: 'your_webhook_secret_here', // GitHub Webhook Secret
    deployScript: '/path/to/server-deploy.sh',
    logFile: '/var/log/webhook-server.log',
    allowedBranches: ['master', 'main'],
    allowedIPs: [
        '140.82.112.0/20',
        '185.199.108.0/22',
        '192.30.252.0/22',
        '143.55.64.0/20'
    ]
};

const app = express();

// 中间件
app.use(express.raw({ type: 'application/json' }));

/**
 * 记录日志
 */
function writeLog(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    // 确保日志目录存在
    const logDir = path.dirname(config.logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(config.logFile, logMessage);
}

/**
 * 验证IP地址
 */
function isValidIP(ip) {
    // 简化版本，实际使用时可以使用更完善的IP验证库
    return true; // 暂时跳过IP验证
}

/**
 * 验证GitHub签名
 */
function verifySignature(payload, signature) {
    if (!config.secret) {
        return true; // 如果没有设置secret，跳过验证
    }
    
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', config.secret)
        .update(payload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * 执行部署脚本
 */
function executeDeploy() {
    return new Promise((resolve, reject) => {
        const command = `sudo ${config.deployScript}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                writeLog(`部署脚本执行失败: ${error.message}`, 'ERROR');
                reject(error);
                return;
            }
            
            if (stderr) {
                writeLog(`部署脚本stderr: ${stderr}`, 'WARNING');
            }
            
            if (stdout) {
                writeLog(`部署脚本输出: ${stdout}`);
            }
            
            writeLog('部署脚本执行成功');
            resolve(stdout);
        });
    });
}

// Webhook处理路由
app.post('/webhook', async (req, res) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress;
        writeLog(`收到来自 ${clientIP} 的Webhook请求`);
        
        // 验证签名
        const signature = req.headers['x-hub-signature-256'];
        if (!verifySignature(req.body, signature)) {
            writeLog('签名验证失败', 'WARNING');
            return res.status(403).send('Forbidden');
        }
        
        // 解析JSON数据
        const payload = JSON.parse(req.body.toString());
        
        // 检查事件类型
        const event = req.headers['x-github-event'];
        if (event !== 'push') {
            writeLog(`忽略非推送事件: ${event}`);
            return res.status(200).send('OK');
        }
        
        // 检查分支
        const branch = payload.ref ? payload.ref.split('/').pop() : '';
        if (!config.allowedBranches.includes(branch)) {
            writeLog(`忽略分支: ${branch}`);
            return res.status(200).send('OK');
        }
        
        // 记录推送信息
        const commits = payload.commits ? payload.commits.length : 0;
        const pusher = payload.pusher ? payload.pusher.name : 'unknown';
        const repository = payload.repository ? payload.repository.name : 'unknown';
        
        writeLog(`收到推送事件: 仓库=${repository}, 分支=${branch}, 提交数=${commits}, 推送者=${pusher}`);
        
        // 执行部署
        try {
            await executeDeploy();
            writeLog('自动部署触发成功');
            res.status(200).send('Deployment triggered successfully');
        } catch (error) {
            writeLog(`自动部署失败: ${error.message}`, 'ERROR');
            res.status(500).send('Deployment failed');
        }
        
    } catch (error) {
        writeLog(`处理Webhook时发生异常: ${error.message}`, 'ERROR');
        res.status(500).send('Internal Server Error');
    }
});

// 健康检查路由
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 启动服务器
app.listen(config.port, () => {
    writeLog(`Webhook服务器启动，监听端口 ${config.port}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    writeLog('收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    writeLog('收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
});

module.exports = app;
