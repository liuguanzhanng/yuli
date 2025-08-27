#!/usr/bin/env node

/**
 * Hexo 部署环境检查脚本
 * 运行: node check-deploy.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 检查 Hexo 部署环境...\n');

// 检查配置文件
function checkConfig() {
  console.log('📋 检查配置文件:');
  
  const configPath = path.join(__dirname, '_config.yml');
  if (!fs.existsSync(configPath)) {
    console.log('❌ _config.yml 不存在');
    return false;
  }
  
  const config = fs.readFileSync(configPath, 'utf8');
  
  // 检查 URL 配置
  if (config.includes('url: http://example.com')) {
    console.log('⚠️  URL 仍为默认值，请更新为实际域名');
  } else {
    console.log('✅ URL 配置已更新');
  }
  
  // 检查部署配置
  if (config.includes('type: rsync')) {
    console.log('✅ rsync 部署配置已设置');
  } else {
    console.log('❌ 未找到 rsync 部署配置');
    return false;
  }
  
  return true;
}

// 检查依赖
function checkDependencies() {
  console.log('\n📦 检查依赖:');
  
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json 不存在');
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (pkg.devDependencies && pkg.devDependencies['hexo-deployer-rsync']) {
    console.log('✅ hexo-deployer-rsync 已安装');
  } else {
    console.log('❌ hexo-deployer-rsync 未安装');
    console.log('   运行: npm install -D hexo-deployer-rsync');
    return false;
  }
  
  return true;
}

// 检查 SSH 配置
function checkSSH() {
  console.log('\n🔑 检查 SSH 配置:');
  
  const homeDir = require('os').homedir();
  const sshConfigPath = path.join(homeDir, '.ssh', 'config');
  
  if (!fs.existsSync(sshConfigPath)) {
    console.log('⚠️  SSH 配置文件不存在: ~/.ssh/config');
    console.log('   请参考 deploy-setup.md 创建配置');
    return false;
  }
  
  const sshConfig = fs.readFileSync(sshConfigPath, 'utf8');
  if (sshConfig.includes('Host blog')) {
    console.log('✅ SSH 配置中找到 blog 主机');
  } else {
    console.log('⚠️  SSH 配置中未找到 blog 主机');
    console.log('   请参考 deploy-setup.md 添加配置');
  }
  
  // 检查密钥文件
  const keyPath = path.join(homeDir, '.ssh', 'id_rsa');
  if (fs.existsSync(keyPath)) {
    console.log('✅ 部署密钥文件存在');
  } else {
    console.log('⚠️  部署密钥文件不存在: ~/.ssh/id_rsa');
  }
  
  return true;
}

// 检查构建
function checkBuild() {
  console.log('\n🏗️  检查构建:');

  // 先检查是否已经有构建结果
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    if (files.length > 0) {
      console.log('✅ 构建文件已存在，public 目录包含', files.length, '个文件/目录');
      return true;
    }
  }

  try {
    console.log('   正在执行 hexo clean && hexo generate...');
    const output = execSync('npx hexo clean && npx hexo generate', {
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: __dirname
    });

    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      if (files.length > 0) {
        console.log('✅ 构建成功，public 目录包含', files.length, '个文件/目录');
        return true;
      }
    }

    console.log('❌ 构建失败或 public 目录为空');
    console.log('构建输出:', output);
    return false;
  } catch (error) {
    console.log('❌ 构建过程出错:', error.message);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.log('stderr:', error.stderr);
    return false;
  }
}

// 主函数
function main() {
  let allGood = true;
  
  allGood &= checkConfig();
  allGood &= checkDependencies();
  allGood &= checkSSH();
  allGood &= checkBuild();
  
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('🎉 环境检查完成，可以执行部署！');
    console.log('   运行: npm run deploy');
  } else {
    console.log('⚠️  发现问题，请根据上述提示修复后再部署');
  }
}

main();
