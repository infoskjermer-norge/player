"use strict";

const https = require("https");
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const URL = require("url");
const EventEmitter = require("events");


module.exports = class CacheServer extends EventEmitter{

    constructor(config){

        super();

        this.app = express();

        this.config = config;

        this.server = null;

        // Make file destination in case it doesn't exist yet
        try{
            fs.mkdirSync(this.config.fileDestination);
        } catch(e) { /* Dont need to do anything */ }


        this.app.use(bodyParser.json());

        // Add CORS headers
        this.app.use( (req, res, next) => {

            // Website you wish to allow to connect
            res.setHeader("Access-Control-Allow-Origin", "*");

            // Request methods you wish to allow
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

            // Request headers you wish to allow
            res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");

            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader("Access-Control-Allow-Credentials", true);

            // Pass to next layer of middleware
            next();
        });



        this.app.get("/", (req, res) => {
            res.send("Hello World!");
        });

        this.app.post("/cache", (req, res) => {

            let files = req.body.files;
            let promises = [];

            this.emit("cache-start", files);

            for(let i = 0; i < files.length; i++){
                promises.push(this.downloadIfNotExsist(files[i], this.config.fileDestination));
            }

            Promise.all(promises).then((results) => {
                let cachedFiles = {};
                for(let i = 0; i < results.length; i++){
                    cachedFiles[results[i].url] = results[i];
                }
                //console.log("all cached files: ", cachedFiles);


                this.emit("cache-finished", cachedFiles);

            }).catch((error) => {
                this.emit("cache-failed", files);
                res.send(error).status(500);
            });

            res.json(files);



        });


        this.app.get("/file/:name", (req, res) => {

            let options = {
                root: this.config.fileDestination,
                dotfiles: "deny",
                headers: {
                    "x-timestamp": Date.now(),
                    "x-sent": true
                }
            };

            let fileName = req.params.name;
            res.sendFile(fileName, options, (err) => {
                if (err) {
                    //console.log(err);
                    this.emit("cache-hit", { error: err, fileName });
                    res.status(err.status).end();
                }
                else {
                    //console.log('Sent:', fileName);
                    this.emit("cache-hit", { error: null, fileName });
                }
            });

        });
    }


    start(){
        /*
        this.server = https.createServer({
              key: fs.readFileSync('key.pem'),
              cert: fs.readFileSync('cert.pem')
            }, this.app).listen(this.config.port);
        */
        this.server = http.createServer(this.app).listen(this.config.port);

        return Promise.resolve();
    }

    stop() {
        this.server.close();
        return Promise.resolve();
    }




    downloadIfNotExsist(url, dest_folder, dest_filename) {

        return new Promise((resolve, reject) => {

            url = URL.parse(url);

            if(dest_folder == undefined){
                dest_folder = ".";
            }

            if(dest_filename == undefined){
                dest_filename = url.path.substr(url.path.lastIndexOf("/")+1);
            }

            let dest = dest_folder+"/"+dest_filename;

            fs.access(dest, fs.R_OK, (error) => {

                // If it already exsits, no need to download it
                if(error == null){
                    console.log("Already have file", dest);
                    resolve({
                        url: url.href,
                        cache_url: this.config.host+":"+this.config.port+"/file/"+dest_filename+"?url="+url.href,
                        dest: dest
                    });
                }
                else{
                    console.log("Downloading file", url.href);

                    let file = fs.createWriteStream(dest);

                    let downloadProtocol = url.protocol == "https:" ? https : http;
                    let request = downloadProtocol.get(url.href, (response) => {
                        response.pipe(file);
                        file.on("finish", () => {
                            file.close(() => {
                                resolve({
                                    url: url.href,
                                    cache_url: this.config.host+":"+this.config.port+"/file/"+dest_filename+"?url="+url.href,
                                    dest: dest
                                });
                            });
                        });
                    }).on("error", (err) => { // Handle errors
                        fs.unlink(dest); // Delete the file async. (But we don't check the result)
                        reject(err.message);
                    });
                }
            });
        });

    }
};
