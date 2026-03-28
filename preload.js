const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  // Study session
  startStudy: (duration) => ipcRenderer.send('start-study', { duration }),
  pauseTimer: () => ipcRenderer.send('pause-timer'),
  resumeTimer: () => ipcRenderer.send('resume-timer'),
  cancelTimer: () => ipcRenderer.send('cancel-timer'),
  closeReward: () => ipcRenderer.send('close-reward'),
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),

  // Listeners
  onTimerStart: (cb) => ipcRenderer.on('timer-start', (_, data) => cb(data)),
  onTimerTick: (cb) => ipcRenderer.on('timer-tick', (_, data) => cb(data)),
  onTimerPaused: (cb) => ipcRenderer.on('timer-paused', () => cb()),
  onTimerResumed: (cb) => ipcRenderer.on('timer-resumed', () => cb()),
  onTimerComplete: (cb) => ipcRenderer.on('timer-complete', () => cb()),
  onRewardDone: (cb) => ipcRenderer.on('reward-done', () => cb()),
  onSessionComplete: (cb) => ipcRenderer.on('session-complete', () => cb())
});
