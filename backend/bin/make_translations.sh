#!/bin/bash
cd src/

echo "Extracting messages for Python code..."

# Some constants are generated and can be ignored.
python manage.py makemessages \
--locale nl \
--ignore="test_*" 

cd ..

echo "Done."