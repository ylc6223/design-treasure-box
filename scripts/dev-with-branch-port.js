#!/usr/bin/env node

const { execSync } = require('child_process');
const { spawn } = require('child_process');

// 获取当前分支
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('无法获取当前分支，使用默认端口 3000');
    return 'main';
  }
}

// 根据分支确定端口
function getPortForBranch(branch) {
  const portMap = {
    main: 3000,
    dev: 3001,
    staging: 3002,
    feature: 3003,
  };

  // 如果是 feature/ 开头的分支，使用 feature 端口
  if (branch.startsWith('feature/')) {
    return portMap.feature;
  }

  return portMap[branch] || 3000;
}

const currentBranch = getCurrentBranch();
const port = getPortForBranch(currentBranch);

console.log(`🚀 启动开发服务器...`);
console.log(`📍 当前分支: ${currentBranch}`);
console.log(`🌐 端口: ${port}`);
console.log(`🔗 访问地址: http://localhost:${port}`);

// 启动 Next.js 开发服务器
const nextProcess = spawn('next', ['dev', '--turbopack', '--port', port.toString()], {
  stdio: 'inherit',
  shell: true,
});

// 处理进程退出
nextProcess.on('close', (code) => {
  process.exit(code);
});

// 处理 Ctrl+C
process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
});
