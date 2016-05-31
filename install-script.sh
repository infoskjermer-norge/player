#!/bin/bash

#Install dependencies
sudo apt-get update
sudo apt-get install -y curl wget git

# Install Node
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs

# Change into the directory we want to install the player
cd ~
git clone https://github.com/infoskjermer-norge/player.git infoskjermer-player
cd infoskjermer-player
npm install

# Create a startup script
echo '[Desktop Entry]\nType=Application\nExec=~/infoskjermer-player/startup-script.sh\nHidden=false\nNoDisplay=false\nX-GNOME-Autostart-enabled=true\nName=Infoskjermer Player\nComment=Start the Infoskjermer Player' > ~/.config/autostart/infoscreen-player.desktop
