#!/bin/bash

# Get the directory of the script
SCRIPT_DIR=`dirname $0`;
FRONTEND_DIR=`dirname $SCRIPT_DIR`

cd $FRONTEND_DIR;

CONFLICTS=("@maykin-ui/admin-ui/node_modules/react" "@maykin-ui/admin-ui/node_modules/react-dom")

# Function to check if a directory exists
function directory_exists() {
  [ -d $1 ]
}

count=0;
for dir in ${CONFLICTS[@]}; do
  fulldir="node_modules/${dir}"

  if directory_exists $fulldir; then
    echo "removing conflicting dependency: $fulldir"
    rm -rf $fulldir;
    let count++
  else
    echo "conflicting dependency not found: $fulldir"
  fi
done

echo ""
echo "$count conflicting dependencies removed"

if [ $count -gt 0 ]; then
  echo "you may need to restart your server"
fi

