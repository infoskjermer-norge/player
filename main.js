'use strict';

const config = require('./config.json');

// Reporting to Sentry
const raven = require('raven');
const client = new raven.Client('https://36e0715b804f4e87bf84ddb9b3fa5297:9fc817cb91b94c8ba191403a1738558e@app.getsentry.com/54641');
client.patchGlobal();
client.setUserContext(config.player);

const os = require('os');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;
const URL = require('url');

const CacheServer = require('./cache-server');
const cacheServer = new CacheServer(config.cache);

const exec = require('child_process').exec;
const isOnline = require('is-online');


const localFileDest = __dirname+'/localFiles';

let mainWindow;
let configWindow;


cacheServer.on('cache-start', (files) => {
  console.log('cache-start');
});
cacheServer.on('cache-finished', (files) => {
  console.log('cache-finished');
  mainWindow.webContents.executeJavaScript('cacheFinishedEvent('+JSON.stringify(files)+');');
});
cacheServer.on('cache-failed', (files) => {
  console.log('cache-failed');
});
cacheServer.on('cache-hit', (data) => {
  console.log('cache-hit');
});


const createWindow = () => {


  if(config.player.client_id ===  null) return;


  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences : {
      nodeIntegration: false, // when this is true, it caused some issues with jquery
      webSecurity: false,
      allowDisplayingInsecureContent: true,
      allowRunningInsecureContent: true,
    },
    //kiosk: true,
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://'+__dirname+'/loading.html');

  downloadResources(config.player.server+'/player-electron/'+config.player.client_id).then((url) => {
    console.log("Should start the player");
    mainWindow.loadURL('file://'+localFileDest+'/player-electron/player.html');
  }).catch((err) => {
    console.log("-------- don't have internet");
    mainWindow.loadURL('file://'+localFileDest+'/player-electron/player.html');
  });



  mainWindow.webContents.on('did-finish-load', function() {
    /*mainWindow.webContents.executeJavaScript('returnSomething();', false, (ret) => {
      console.log("did we get something? ", ret);
    });*/
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}


const createConfigWindow = () => {
  configWindow = new BrowserWindow({
    width: 500,
    height: 350,
  });

  configWindow.loadURL('file://' + __dirname + '/config.html');

  configWindow.on('closed', () => {
    configWindow = null;
  });

  //configWindow.webContents.openDevTools();

}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('ready', () => {

  createConfigWindow();

  cacheServer.start().then(() => {
    createWindow();
  });

});




const downloadResources = (url) => {

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
        let urlObj = URL.parse(url);
        let domains = urlObj.hostname;
        let cmd = 'wget -e robots=off --mirror --convert-links -p --no-check-certificate --follow-tags=link,script,style --domains='+domains+' --no-host-directories --no-verbose --dns-timeout=30 -P '+localFileDest+' "'+url+'"';
        let playerFile = urlObj.pathname.substr(urlObj.pathname.lastIndexOf('/')+1);
        cmd += '; mv '+localFileDest+'/player-electron/'+playerFile+' '+localFileDest+'/player-electron/player.html';
        console.log('running cmd: ', cmd);
        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            console.error("Something went wrong", err);
            console.error(stdout, stderr);
            reject(err);
            return;
          }
          console.log(err, stdout, stderr);
          console.log("- DONE downloading", url);
          resolve(url);
          return;
        });
    });


  });
};
