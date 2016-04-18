# Infoskjermer Norge Player

## Install dependencies (Ubuntu)
1. `curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -`
2. `sudo apt-get install -y nodejs`
3. `sudo apt-get install wget` needed for offline running

## Run app
1. `git clone https://github.com/christofferok/infoskjermer-player.git` Clone repo
2. `cd infoskjermer-player`
3. `npm install` to install the dependencies
4. `npm run config` to config the player
5. `npm start` to run the app

## Update app
1. `cd infoskjermer-player`
2. `git pull origin master` to get newest code
3. `npm install` to install the dependencies
4. `npm run config` to config the player
5. `npm start` to run the app

## Run on Ubuntu (not working)
1. Clone repo
2. `sudo npm install -g electron-prebuilt`
3. `electron <path to app>`
