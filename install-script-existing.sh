#!/bin/bash

# Open up for updates
#sudo sed -i 's/# deb http/deb http/g' /etc/apt/sources.list
#sudo sed -i 's/# deb-src/deb-src/g' /etc/apt/sources.list

sudo sh -c "printf 'deb http://archive.canonical.com/ubuntu trusty partner\ndeb-src http://archive.canonical.com/ubuntu trusty partner\ndeb http://extras.ubuntu.com/ubuntu trusty main\ndeb-src http://extras.ubuntu.com/ubuntu trusty main\ndeb http://archive.ubuntu.com/ubuntu trusty main universe restricted multiverse\ndeb-src http://archive.ubuntu.com/ubuntu trusty multiverse main universe restricted #Added by software-properties\ndeb http://security.ubuntu.com/ubuntu/ trusty-security multiverse main universe restricted\ndeb http://archive.ubuntu.com/ubuntu trusty-updates multiverse main universe restricted\ndeb http://archive.ubuntu.com/ubuntu trusty-proposed multiverse main universe restricted\ndeb http://archive.ubuntu.com/ubuntu trusty-backports multiverse main universe restricted' > /etc/apt/sources.list"
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
# apt-get update will be run with the previous command

# Install dependencies
sudo apt-get install -y wget git nodejs

# Turn off updates again
sudo sed -i 's/deb http/# deb http/g' /etc/apt/sources.list
sudo sed -i 's/deb-src/# deb-src/g' /etc/apt/sources.list

# Change into the directory we want to install the player
cd ~
git clone https://github.com/infoskjermer-norge/player.git infoskjermer-player
cd infoskjermer-player
npm install

# Delete existing startu-scripts
rm ~/.config/autostart/*.desktop

# Create a startup script
echo -e '[Desktop Entry]\nType=Application\nExec=/home/player/infoskjermer-player/startup-script.sh\nHidden=false\nNoDisplay=false\nX-GNOME-Autostart-enabled=true\nName=Infoskjermer Player\nComment=Start the Infoskjermer Player' > ~/.config/autostart/infoscreen-player.desktop


# Set up config file if there is a client id passed in
if [ $1 ]; then
  if [ $1 ]; then
      mkdir ~/infoskjermer-player-files
      printf '{\n"server": "",\n"client_id": "%s",\n"kiosk": true,\n"devtools": false\n}' $1 > ~/infoskjermer-player-files/config.json
  fi
fi
