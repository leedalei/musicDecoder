// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const decoder = require('./js/decoder.js')
const fs = require('fs');
require('./js/Menu.js');//渲染menu
let LOCK = false; //并发锁
let CANCEL = false;//是否取消
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 840,
    height: 740,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  // mainWindow.webContents.openDevTools()
  ipcMain.on('fileList', async function (event, data) {
    if (data.type == 'STOP') { CANCEL = true; LOCK=false; return };//取消
    if (LOCK) { event.reply('fileList', { type: 'WARN', msg: '正在转码中，请勿重复操作!' }); return;}
    for (let item of data.msg) {
      if (!(/\.uc$/.test(item))) { continue; }
      LOCK = true;
      if (CANCEL) {
        event.reply('fileList', { type: 'STOP', msg: '已经中止' });
        CANCEL = false;
        LOCK = false;
        return;
      }
      await decoder.decodeFile(item)
      event.reply('fileList', { type: 'INFO', msg: item });
    }
  })
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
