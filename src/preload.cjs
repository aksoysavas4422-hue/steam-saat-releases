'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('steamSaat', Object.freeze({
  login: value => ipcRenderer.invoke('login', value),
  guard: value => ipcRenderer.invoke('guard', value),
  start: ids => ipcRenderer.invoke('start', ids),
  stop: () => ipcRenderer.invoke('stop'),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  refreshPlaytime: () => ipcRenderer.invoke('playtime'),
  forget: () => ipcRenderer.invoke('forget'),
  preferences: value => ipcRenderer.invoke('preferences', value),
  retryNow: () => ipcRenderer.invoke('retry-now'),
  hide: () => ipcRenderer.invoke('hide'),
  quit: () => ipcRenderer.invoke('quit'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  snapshot: () => ipcRenderer.invoke('snapshot'),
  chooseFiveM: () => ipcRenderer.invoke('choose-fivem'),
  launchFiveM: () => ipcRenderer.invoke('launch-fivem'),
  onState: callback => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('state', listener);
    return () => ipcRenderer.removeListener('state', listener);
  }
}));
