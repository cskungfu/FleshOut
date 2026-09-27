const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { pathToFileURL } = require('url');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

let mainWindow = null;

// 递归复制目录（跳过缓存，保留已有的 data）
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.cache' || entry.name === '.git') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 把应用文件准备到用户可写目录
function prepareAppDir() {
  const userDataDir = app.getPath('userData');
  const appDir = path.join(userDataDir, 'app');
  const versionFile = path.join(appDir, 'version.txt');

  let currentVersion = '0.0.0';
  try {
    const pkg = require(path.join(__dirname, 'package.json'));
    currentVersion = pkg.version || '0.0.0';
  } catch (e) {}

  let installedVersion = '';
  if (fs.existsSync(versionFile)) {
    installedVersion = fs.readFileSync(versionFile, 'utf8').trim();
  }

  if (installedVersion !== currentVersion) {
    console.log(`Preparing app files: ${installedVersion || 'none'} -> ${currentVersion}`);
    copyDir(__dirname, appDir);
    fs.writeFileSync(versionFile, currentVersion);
  }

  return appDir;
}

// 从可写目录启动 server.js
async function startServer(appDir) {
  const serverPath = path.join(appDir, 'server.js');
  process.chdir(appDir);
  const fileUrl = pathToFileURL(serverPath).href;
  await import(fileUrl);
  console.log('Server module loaded from', serverPath);
}

// 轮询等待服务就绪
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
  try {
    const appDir = prepareAppDir();
    await startServer(appDir);
    createWindow();
  } catch (err) {
    console.error('Startup error:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
