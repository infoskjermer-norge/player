#!/bin/bash

echo ""
echo ""
echo "*** Starting the update script ***"
echo ""

echo "- Fetching newest code"
git pull origin master

echo "- Installing dependencies"
npm install

echo ""
echo ""
echo "*** Finished with the update script ***"
echo ""
