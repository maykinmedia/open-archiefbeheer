#!/bin/bash

set -eux -o pipefail

for file in /app/static/js/*.js;
do
  sed -i 's|REACT_APP_API_SCHEME_PLACEHOLDER|'${REACT_APP_API_SCHEME}'|g' $file
  sed -i 's|REACT_APP_API_HOST_PLACEHOLDER|'${REACT_APP_API_HOST}'|g' $file
  sed -i 's|REACT_APP_API_PORT_PLACEHOLDER|'${REACT_APP_API_PORT}'|g' $file
  sed -i 's|REACT_APP_API_PATH_PLACEHOLDER|'${REACT_APP_API_PATH}'|g' $file
done
