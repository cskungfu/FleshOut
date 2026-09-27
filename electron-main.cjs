const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { pathToFileURL } = require('url');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

let mainWindow = null;

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (['.cache', '.git', 'dist', 'FleshOut-data'].includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getAppRoot() {
  if (!app.isPackaged) {
    return __dirname;
  }
  return path.dirname(process.execPath);
}

function isWritable(dir) {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function prepareDir(srcRoot, targetDir, currentVersion) {
  const versionFile = path.join(targetDir, 'version.txt');
  let installedVersion = '';
  if (fs.existsSync(versionFile)) {
    installedVersion = fs.readFileSync(versionFile, 'utf8').trim();
  }

  if (installedVersion !== currentVersion) {
    console.log(`Preparing app files: ${installedVersion || 'none'} -> ${currentVersion}`);
    copyDir(srcRoot, targetDir);
    fs.writeFileSync(versionFile, currentVersion);
  }
  return targetDir;
}

function prepareAppDir() {
  const root = getAppRoot();
  const appDir = path.join(root, 'FleshOut-data');

  let currentVersion = '0.0.0';
  try {
    const pkg = require(path.join(__dirname, 'package.json'));
    currentVersion = pkg.version || '0.0.0';
  } catch (e) {}

  if (!isWritable(root) && !fs.existsSync(appDir)) {
    console.warn('Install dir not writable, falling back to userData');
    const fallback = path.join(app.getPath('userData'), 'FleshOut-data');
    return prepareDir(__dirname, fallback, currentVersion);
  }

  return prepareDir(__dirname, appDir, currentVersion);
}

async function startServer(appDir) {
  const serverPath = path.join(appDir, 'server.js');
  process.chdir(appDir);
  const fileUrl = pathToFileURL(serverPath).href;
  await import(fileUrl);
  console.log('Server module loaded from', serverPath);
}

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
    console.log('App data dir:', appDir);
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
