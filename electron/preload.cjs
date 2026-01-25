// Preload script for Electron
// This runs in a sandboxed environment with access to Node.js APIs
// You can expose specific APIs to the renderer process here

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
})
