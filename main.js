const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let homeWindow = null;
let timerWindow = null;
let rewardWindow = null;
let timerInterval = null;
let timerState = { remaining: 0, total: 0, paused: false };
let rewardCompleted = false;

function createHomeWindow() {
  homeWindow = new BrowserWindow({
    width: 520,
    height: 680,
    minWidth: 460,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  homeWindow.loadFile(path.join(__dirname, 'src', 'home', 'index.html'));
  homeWindow.on('closed', () => {
    homeWindow = null;
    if (timerWindow) timerWindow.close();
    if (rewardWindow) rewardWindow.close();
  });
}

function createTimerWindow(durationMinutes) {
  if (timerWindow) {
    timerWindow.focus();
    return;
  }

  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const size = 280;
  const margin = 20;

  timerWindow = new BrowserWindow({
    width: size,
    height: size + 60,
    x: screenWidth - size - margin,
    y: margin,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  timerWindow.loadFile(path.join(__dirname, 'src', 'timer', 'index.html'));
  timerWindow.setAlwaysOnTop(true, 'floating');

  timerWindow.webContents.once('did-finish-load', () => {
    const totalSeconds = durationMinutes * 60;
    timerState = { remaining: totalSeconds, total: totalSeconds, paused: false };
    timerWindow.webContents.send('timer-start', { total: totalSeconds, remaining: totalSeconds });
    startTimerTick();
  });

  timerWindow.on('closed', () => {
    timerWindow = null;
    clearInterval(timerInterval);
    timerInterval = null;
  });
}

function startTimerTick() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timerState.paused) return;

    timerState.remaining--;

    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('timer-tick', {
        remaining: timerState.remaining,
        total: timerState.total
      });
    }

    if (timerState.remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      onTimerComplete();
    }
  }, 1000);
}

function onTimerComplete() {
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.webContents.send('timer-complete');
    setTimeout(() => {
      createRewardWindow();
    }, 1500);
  }
}

function createRewardWindow() {
  if (rewardWindow) {
    rewardWindow.focus();
    return;
  }

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const width = 620;
  const height = 560;

  rewardWindow = new BrowserWindow({
    width,
    height,
    x: Math.round((screenWidth - width) / 2),
    y: Math.round((screenHeight - height) / 2),
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  rewardWindow.loadFile(path.join(__dirname, 'src', 'reward', 'index.html'));
  rewardWindow.setAlwaysOnTop(true, 'screen-saver');

  rewardWindow.on('closed', () => {
    rewardWindow = null;
  });
}

// IPC Handlers
ipcMain.on('window-minimize', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.minimize();
});

ipcMain.on('window-close', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.close();
});

ipcMain.on('window-drag', (e, { mouseX, mouseY }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) {
    const { x, y } = win.getBounds();
    win.setPosition(x + mouseX, y + mouseY);
  }
});

ipcMain.on('start-study', (e, { duration }) => {
  rewardCompleted = false;
  if (homeWindow) homeWindow.hide();
  createTimerWindow(duration);
});

ipcMain.on('pause-timer', () => {
  timerState.paused = true;
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.webContents.send('timer-paused');
  }
});

ipcMain.on('resume-timer', () => {
  timerState.paused = false;
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.webContents.send('timer-resumed');
  }
});

ipcMain.on('cancel-timer', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  const wasRewardDone = rewardCompleted;
  rewardCompleted = false;
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.close();
  }
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.show();
    homeWindow.focus();
    if (wasRewardDone) {
      homeWindow.webContents.send('session-complete');
    }
  }
});

ipcMain.on('close-reward', () => {
  rewardCompleted = true;
  if (rewardWindow && !rewardWindow.isDestroyed()) {
    rewardWindow.close();
  }
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.webContents.send('reward-done');
  }
});

ipcMain.handle('get-timer-state', () => {
  return { ...timerState };
});

app.whenReady().then(() => {
  createHomeWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createHomeWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
