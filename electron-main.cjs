const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

let mainWindow = null;

// 直接在主进程里加载 server.js（不依赖系统安装的 node 命令）
async function startServer() {
  try {
    await import(path.join(__dirname, 'server.js'));
    console.log('Server module loaded');
  } catch (err) {
    console.error('Failed to load server.js:', err);
  }
}

// 轮询等待服务就绪，避免固定延迟导致白屏
function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const tryConnect = (n) => {
      http.get(URL, () => resolve()).on('error', () => {
        if (n > 0) setTimeout(() => tryConnect(n - 1), 500);
        else reject(new Error('Server did not start in time'));
      });
    };
    tryConnect(retries);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'FleshOut',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  try {
    await waitForServer();
    mainWindow.loadURL(URL);
  } catch (err) {
    mainWindow.loadURL(
      'data:text/html,<h1>Server failed to start</h1><pre>' + err.message + '</pre>'
    );
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
