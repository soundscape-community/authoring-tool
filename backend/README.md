
# Backend Development Guide

This document serves as a guide for setting up, developing, and contributing to the backend part of our project.

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Technologies Used](#technologies-used)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Setup Instructions
To set up the backend environment, you need to go to the main folder and follow the instructions in `install.md` file.

## Technologies Used
- **Django**: The web framework used for constructing the API and server-side logic.
- **Django REST framework**: Provides REST API support.
- **Pillow**: Required for the ImageField model field.
- **Psycopg2**: PostgreSQL database adapter.
- **Gpxpy**: GPX file parser and GPS track manipulation library.
- **Django Storages**: File database for images and GPX files.
- **Whitenoise**: Serve static files, also used to serve frontend files.
- **Markdown**: (Optional) Django REST Markdown support for the browsable API.
- **Pygments**: (Optional) Adds syntax highlighting to Markdown processing.
- **Django CORS Headers**: For local development, to access API from frontend.
- **Autopep8**: A tool that automatically formats Python code to conform to the PEP 8 style guide.


## Testing
To test the backend, you can choose to run one of the following two options:
  * (a) run this in the WSL terminal in the backend folder `export $(xargs <.env/local.env)`
  
  * (b) run the following code in your WSL terminal
    ```
    export DJANGO_SETTINGS_MODULE="backend.settings.local"
    export ENV="local"
    export AZURE_MAPS_SUBSCRIPTION_KEY="os.environ.get('AZURE_MAPS_SUBSCRIPTION_KEY')"
    export DJANGO_SECRET_KEY="dadjaidojsaiondsuabdiadbsaiub"
    export ALLOWED_HOSTS="*"
    export DANGEROUSLY_DISABLE_HOST_CHECK=true
    export X_MS_TOKEN_AAD_ID_TOKEN="lkjsajf;djfdsa;lkfj"
    ```

After setting up the environment, you can run the following command to start the server:
```
python3 manage.py runserver
```
This will run the project locally.

## Submitting Changes

When you are done with your changes, submit a pull request to the `main` branch. Make sure to include a detailed description of the changes and any relevant information for reviewers.

Note: If you don't know how to submit a pull request, you can goto `https://github.com/soundscape-community/authoring-tool/pulls` and click on `New pull request` and then select the branch you want to merge and then click on `Create pull request` and then add a title and description and then click on `Create pull request` and you are done.
