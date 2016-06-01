"use strict";

const config = require("./config.json");
const electron = require("electron");
const app = electron.app;
const fs = require("fs");
const storageDir = app.getPath("home") + "/" + config.storageDir;
const playerConfigFilename = storageDir+"/config.json";


if(process.argv.length != 4){
    console.log("You have to provide a key and value");
    console.log("example: npm run config-set <key> <value>");
    app.quit();
}

let playerConfig = {};

try {
    playerConfig = require(playerConfigFilename);
} catch(e) {
    console.log("ERROR: Could not find config file!");
}

let key = process.argv[2];
let value = process.argv[3];

// Bool values for some keys
if(key == "kiosk" || key == "devtools"){
    value = value == "true" || value == "1";
}

playerConfig[key] = value;

fs.writeFile(playerConfigFilename, JSON.stringify(playerConfig, null, "    "), (err) => {
    if (err){
        console.log("ERROR writing to config file: ", err.message);
    }
    else console.log("Config saved");

    app.quit();
});
