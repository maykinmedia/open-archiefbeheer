#!/bin/bash

set -eux -o pipefail

for file in /app/static/js/*.js;
do
  sed -i 's|REACT_APP_API_URL_PLACEHOLDER|'${REACT_APP_API_URL}'|g' $file
  sed -i 's|REACT_APP_API_PATH_PLACEHOLDER|'${REACT_APP_API_PATH}'|g' $file
  sed -i 's|REACT_APP_ZAAK_URL_TEMPLATE_PLACEHOLDER|'${REACT_APP_ZAAK_URL_TEMPLATE}'|g' $file
done
