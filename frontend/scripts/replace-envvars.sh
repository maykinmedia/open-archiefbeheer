#!/bin/bash

set -eux -o pipefail

for file in /app/static/assets/*.js;
do
  sed -i 's|OAB_API_URL_PLACEHOLDER|'${OAB_API_URL}'|g' $file
  sed -i 's|OAB_API_PATH_PLACEHOLDER|'${OAB_API_PATH}'|g' $file
  sed -i 's|OAB_ZAAK_URL_TEMPLATE_PLACEHOLDER|'${OAB_ZAAK_URL_TEMPLATE}'|g' $file
done
