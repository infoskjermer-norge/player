# Infoskjermer Norge Player


## Automatic install

1. `curl -o install-script.sh https://raw.githubusercontent.com/infoskjermer-norge/player/production/install-script-existing.sh; chmod +x install-script.sh;`
2. `./install-script.sh <player_id>`
3. `rm install-script.sh`

## Manual install

### Install dependencies (Ubuntu)
1. `sudo apt-get install -y curl wget git`
2. `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -`
3. `sudo apt-get install -y nodejs`

### Install app
1. `git clone https://github.com/infoskjermer-norge/player.git infoskjermer-player` Clone repo
2. `cd infoskjermer-player`
3. `npm install` to install the dependencies

### Update app
1. `cd infoskjermer-player`
2. `git pull origin production` to get newest code
3. `npm install` to install the dependencies

### Run app
1. `cd infoskjermer-player`
2. `npm run config` to configure the player
3. `npm start` to run the app

## Change config from terminal
If you want to change a config value from the terminal run:

`npm run config-set <key> <value>`

examples:

`npm run config-set client_id YOUR_CLIENT_ID`
`npm run config-set kiosk true`
`npm run config-set devtools false`
