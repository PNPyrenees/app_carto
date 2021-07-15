#!/bin/bash
cd /home/carto/app_carto
source ./venv/bin/activate

exec gunicorn  wsgi:app_carto --error-log ./logs/app_carto_errors.log --pid="app_carto.pid" --timeout=60 -w "4"  -b "0.0.0.0:5000"  -n "app_carto"
