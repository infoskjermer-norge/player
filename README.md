# Infoskjermer Norge Player

## Install dependencies (Ubuntu)
1. `sudo apt-get install -y curl wget git`
2. `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -`
3. `sudo apt-get install -y nodejs`

## Intall app
1. `git clone https://github.com/infoskjermer-norge/player.git infoskjermer-player` Clone repo
2. `cd infoskjermer-player`
3. `npm install` to install the dependencies

## Update app
1. `cd infoskjermer-player`
2. `git pull origin master` to get newest code
3. `npm install` to install the dependencies

## Run app
1. `cd infoskjermer-player`
2. `npm run config` to configure the player
3. `npm start` to run the app
