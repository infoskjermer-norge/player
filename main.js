"use strict";

const config = require("./config.json");
const packageInfo = require("./package.json");
let ravenClient = null;
if(config.logToSentry){
  // Reporting to Sentry
    const raven = require("raven");
    ravenClient = new raven.Client(config.sentryUrl);
    ravenClient.patchGlobal();
}

const os = require("os");
const fs = require("fs");
const https = require("https");
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const URL = require("url");
const configWindow = require("./configWindow");

const storageDir = app.getPath("home") + "/" + config.storageDir;
const localFileDest = storageDir+"/localFiles";

// Make app file destination in case it doesn't exist yet
try{
    fs.mkdirSync(storageDir);
} catch(e) { /* Dont need to do anything */ }

const CacheServer = require("./cache-server");
config.cache.fileDestination = storageDir + "/" + config.cache.fileDestination;
const cacheServer = new CacheServer(config.cache);

const exec = require("child_process").exec;
const isOnline = require("is-online");


let playerConfig = null;
let mainWindow;
let lastContentFetch = null;
let playerInfo = null;

app.on("window-all-closed", () => {
    app.quit();
});
app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});
app.on("ready", () => {

    try {
        playerConfig = require(storageDir+"/config.json");
    } catch(e) {
        console.log("Could not find config file");
    }

    let configFlagSet = false;
    process.argv.forEach((val) => {
        if(val == "--config") configFlagSet = true;
    });

    if(playerConfig == null || !playerConfig.client_id || configFlagSet){
        configWindow.open();
    }
    else{
        if(ravenClient !== null){
            ravenClient.setUserContext(playerConfig);
        }

        // If player server har been overrided
        if(playerConfig.server) config.server = playerConfig.server;

        const electronScreen = electron.screen;

        let primaryDisplay = electronScreen.getPrimaryDisplay();

        playerInfo = {
            electron_version: app.getVersion(),
            app_version: packageInfo.version,
            os: {
                freemem: os.freemem(),
                totalmem: os.totalmem(),
                uptime: os.uptime(),
                platform: os.platform()
            },
            display: {
                width: primaryDisplay.size.width,
                height: primaryDisplay.size.height,
                scaleFactor: primaryDisplay.scaleFactor,
                touchSupport: primaryDisplay.touchSupport
            }
        };

        startHubConnection();

        cacheServer.start().then(() => {
            createWindow();
        });
    }

});

/*
const shouldQuit = app.makeSingleInstance(() => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

if (shouldQuit) {
    console.log("Quitting the app, because can only have one instance");
    app.quit();
}
*/

cacheServer.on("cache-start", () => {
    console.log("cache-start");
});
cacheServer.on("cache-finished", (files) => {
    console.log("cache-finished");
    mainWindow.webContents.executeJavaScript("cacheFinishedEvent("+JSON.stringify(files)+");");
});
cacheServer.on("cache-failed", () => {
    console.log("cache-failed");
});
cacheServer.on("cache-hit", () => {
    console.log("cache-hit");
});


const createWindow = () => {

    if(playerConfig.client_id === null) return;

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: "#000000",
        webPreferences : {
            nodeIntegration: false, // when this is true, it caused some issues with jquery
            webSecurity: false,
            allowDisplayingInsecureContent: true,
            allowRunningInsecureContent: true
        },
        kiosk: playerConfig.kiosk
    });

    if(playerConfig.kiosk){
        mainWindow.setMenu(null);
    }

    // and load the index.html of the app.
    mainWindow.loadURL("file://"+__dirname+"/loading.html");

    mainWindow.on("unresponsive", () => {
        mainWindow.close();
        createWindow();
    });

    mainWindow.webContents.on("crashed", function() {
        mainWindow.close();
        createWindow();
    });
    mainWindow.webContents.on("plugin-crashed", function() {
        mainWindow.close();
        createWindow();
    });
    mainWindow.webContents.on("did-fail-load", function() {
        mainWindow.close();
        createWindow();
    });





    mainWindow.webContents.on("did-finish-load", function() {
    /*mainWindow.webContents.executeJavaScript('returnSomething();', false, (ret) => {
      console.log("did we get something? ", ret);
    });*/
    });

    if(playerConfig.devtools){
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    downloadResources(config.server+"/player-electron/"+playerConfig.client_id).then(() => {
        console.log("Should start the player");
        mainWindow.loadURL("file://"+localFileDest+"/player-electron/player.html");
    }).catch(() => {
        console.log("-------- don't have internet");
        mainWindow.loadURL("file://"+localFileDest+"/player-electron/player.html");
    });
};





function startHubConnection(){
    /* Connection to websocket server */
    const socket = require("socket.io-client")(config.socket.server);
    socket.on("connect", () => {
        socket.emit("identify", { client_id: playerConfig.client_id, playerInfo: playerInfo });
    });
    socket.on("disconnect", () => {
        console.log("Disconnected from the hub");
    });

    socket.on("reconnect", () => {
        console.log("Just reconnected, time to check for new content");
        hasContentBeenUpdated().then((result) => {
            console.log("Has content been updated? ", result);

            if(result === true) contentHasBeenUpdated();

        }).catch((error) => {
            console.log("Error checking for new content", error);
        });
    });
    socket.on("private", (data) => {

        console.log("private", data);

        if(data.type == "restart"){
            // TODO: Maybe restart the entire app, not just the browser window?
            mainWindow.close();
            createWindow();
        }
        else if(data.type == "updated_content"){
            contentHasBeenUpdated();
        }

    });
}




function hasContentBeenUpdated(){

    let url = URL.parse(config.server);

    let options = {
        hostname: url.host,
        path: "/api/client/"+playerConfig.client_id+"/lastUpdated",
        method: "GET",
        headers: {
            "Authorization": "Token "+config.apiToken,
            "Content-Type": "application/json"
        }
    };

    return new Promise((resolve, reject) => {
        let req = https.request(options, (res) => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
                body += chunk;
            });
            res.on("end", () => {
                if(res.statusCode == 200){
                    console.log("Finished webhook call: ", body);
                    let jsonBody = JSON.parse(body);
                    let updated_at = new Date(jsonBody.updated_at);
                    if(updated_at > lastContentFetch) resolve(true);
                    else resolve(false);
                }
                else reject(new Error(body));
            });
        });

        req.on("error", (e) => {
            reject(e);
        });
        req.end();
    });
}


function contentHasBeenUpdated(){
    console.log("Downloading resources in the background, then updating the player");
    downloadResources(config.server+"/player-electron/"+playerConfig.client_id).then(() => {
        mainWindow.loadURL("file://"+localFileDest+"/player-electron/player.html");
        console.log("Trying to restart the slideshow");
        // TODO: Maybe we need to just restart the entire window to get the cache events, etc?
    }).catch(() => {
        console.log("Couldn't download resources");
    });
}



const downloadResources = (playerURL) => {

    return new Promise((resolve, reject) => {
        isOnline(function(err, online) {
            if(!online){
                reject(err);
                return;
            }

            console.log("Staring to download resources");
            // --mirror : downloads all the resources needed
            // -p : This option causes Wget to download all the files that are necessary to properly display a given HTML page. This includes such things as inlined images, sounds, and referenced stylesheets.
            // --follow-tags=<tag-list>: only get files from these html tags
            // --domains=<domain-list>: the allowed domains to download from
            // --no-host-directories: don't create a separate directory for the host
            // --no-verbose : don't give so much output
            // --dns-timeout=<seconds> : number of seconds before giving up on resolving the dns
            let urlObj = URL.parse(playerURL);
            let domains = urlObj.hostname;
            let cmd = "wget -e robots=off --mirror --convert-links -p --no-check-certificate --follow-tags=link,script,style --domains="+domains+" --no-host-directories --no-verbose --dns-timeout=30 -P "+localFileDest+" \""+playerURL+"\"";
            let playerFile = urlObj.pathname.substr(urlObj.pathname.lastIndexOf("/")+1);
            cmd += "; mv "+localFileDest+"/player-electron/"+playerFile+" "+localFileDest+"/player-electron/player.html";
            console.log("running cmd: ", cmd);
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    console.error("Something went wrong", err);
                    console.error(stdout, stderr);
                    reject(err);
                    return;
                }
                //console.log(err, stdout, stderr);
                console.log("- DONE downloading", playerURL);
                resolve(playerURL);
                lastContentFetch = new Date();
                return;
            });
        });


    });
};
