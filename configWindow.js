"use strict";

const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;

let configWindow;

const open = () => {
    configWindow = new BrowserWindow({
        width: 500,
        height: 350
    });

    configWindow.loadURL("file://" + __dirname + "/config.html");

    configWindow.on("closed", () => {
        configWindow = null;
    });
};

const close = () => {
    if(configWindow){
        configWindow.close();
        configWindow = null;
    }
};


module.exports = {open, close};
