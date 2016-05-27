#!/bin/bash

echo ""
echo ""
echo "*** Starting the update script ***"
echo ""

wget -q --tries=10 --timeout=20 --spider http://google.com
if [[ $? -eq 0 ]]; then
        echo "We are online"
        echo "- Fetching newest code"
        git pull origin master

        echo "- Installing dependencies"
        npm install
else
        echo "We are offline. Not going to perform any update actions"
fi

echo ""
echo ""
echo "*** Finished with the update script ***"
echo ""
