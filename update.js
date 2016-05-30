"use strict";

const config = require("./config.json");

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const execFile = require("child_process").execFile;

const storageDir = app.getPath("home") + "/" + config.storageDir;

let playerConfig = {};
let updateWindow;


function updatePlayer(){
    execFile("./update-script.sh", (error, stdout) => {
        if (error) {
            app.quit();
            throw error;
        }
        console.log(stdout);
        app.quit();
    });
}

let silentFlag = false;
process.argv.forEach((val) => {
    if(val == "--silent") silentFlag = true;
});

if(silentFlag){
    updatePlayer();
}
else{
    app.on("ready", () => {

        try {
            playerConfig = require(storageDir+"/config.json");
        } catch(e) {
            console.log("Could not find config file");
        }

        updateWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            backgroundColor: "#000000",
            kiosk: playerConfig.kiosk || false
        });

        if(playerConfig.kiosk){
            updateWindow.setMenu(null);
        }

        updateWindow.on("closed", () => {
            updateWindow = null;
        });

        updateWindow.loadURL("file://"+__dirname+"/update.html");

        updatePlayer();

    });

}
