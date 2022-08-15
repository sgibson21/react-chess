#!/usr/bin/env bash

# Set the Windows host IP when inside WSL2
export REACT_APP_CHESS_IP=$(ipconfig.exe | grep 'Ethernet adapter Ethernet:' -A20 | grep 'IPv4' -m 1 | awk -F': ' '{print $2}')

echo "REACT_APP_CHESS_IP: $REACT_APP_CHESS_IP"
