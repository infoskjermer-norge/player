'use strict';

const config = require('./config.json');

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let configWindow;

const createConfigWindow = () => {
  configWindow = new BrowserWindow({
    width: 500,
    height: 350,
  });

  configWindow.loadURL('file://' + __dirname + '/config.html');

  configWindow.on('closed', () => {
    configWindow = null;
  });
}


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (configWindow === null) {
    createConfigWindow()();
  }
});
app.on('ready', () => {
  createConfigWindow();
});
