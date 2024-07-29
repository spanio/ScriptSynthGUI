#!/bin/bash
cd /home/pi/ScriptSynthGUI/frontend
sudo npm run build
sudo serve -s build -l 3000
