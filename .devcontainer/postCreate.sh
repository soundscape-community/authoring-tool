#!/usr/bin/env bash
# install the backend dependencies
pip3 install --user -r backend/requirements.txt
python3 backend/manage.py migrate

# install the frontend dependencies
(cd frontend&& npm ci )
