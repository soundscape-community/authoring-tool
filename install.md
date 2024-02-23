# Starting Out
1. **Clone** [authoring-tool](https://github.com/soundscape-community/authoring-tool)
   * **go to the folder which you want to save the authoring-tool**
   * run `git clone https://github.com/soundscape-community/authoring-tool.git`
   * you can also go to github to see the authoring-tool file.
2. Install [Django](https://www.djangoproject.com/)
   * [install Django](https://docs.djangoproject.com/en/5.0/topics/install/)
   * Windows: In your powershell command run `py -m pip install Django`
   * Unix/MacOS: In your terminal run `python -m pip install Django`
# Backend
1. In the `/backend` folder, if there is no virtual environment (`.venv`), create one and select it as the default Python interpreter in VSCode. 
    * Run `python -m venv .venv`.
    * If you did not have python you can try to use `python3 -m venv .venv`
2. You can use the line below to check if there are any Python packages that you haven't installed yet. Go to the backend folder and run `pip install -r requirements.txt`.
3. In the folder `/backend/.env`(If you did not have is folder just create one):
    * Create files called  `local.env`, `development.env`, `production.env`, and `.env`
    * Copy the below and pasted to these four files( `local.env`, `development.env`, `production.env`, and `.env`)
   ```
    ENV="local" 

    DJANGO_SETTINGS_MODULE="backend.settings.local"

    DJANGO_SECRET_KEY=""

    ALLOWED_HOSTS=""

    PSQL_DB_NAME=""

    PSQL_DB_USER=""

    PSQL_DB_PASS=""

    PSQL_DB_HOST=""

    PSQL_DB_PORT=""

    AZURE_STORAGE_ACCOUNT_NAME=""

    AZURE_STORAGE_ACCOUNT_KEY=""

    AZURE_STORAGE_ACCOUNT_CONTAINER=""

    AZURE_STORAGE_ACCOUNT_LOCATION=""

    AZURE_STORAGE_ACCOUNT_RELATIVE_FILE_URL=""

    AZURE_MAPS_SUBSCRIPTION_KEY=""

    X_MS_TOKEN_AAD_ID_TOKEN="lkjsajfdjfdsalkfj"
    ```
    
4.  Double check `.env` file
    * remove all the comments in the `backend/.env` files 
    * no spaces before and after "="
    * it should look like above

5. Select one of the following options:
    * 5(a) run this in the WSL terminal in the backend folder `export $(xargs <.env/local.env)`

    * 5(b) run the following code in your WSL terminal
    ```
    export DJANGO_SETTINGS_MODULE="backend.settings.local"
    export ENV="local"
    export AZURE_MAPS_SUBSCRIPTION_KEY="os.environ.get('AZURE_MAPS_SUBSCRIPTION_KEY')"
    export DJANGO_SECRET_KEY="dadjaidojsaiondsuabdiadbsaiub"
    export ALLOWED_HOSTS="*"
    export DANGEROUSLY_DISABLE_HOST_CHECK=true
    export X_MS_TOKEN_AAD_ID_TOKEN="lkjsajf;djfdsa;lkfj"
    ```
7. Create a folder called `/.auth` in `/backend`.
8. Create a file called `me.json` in `/.auth folder`. This is the format with some dummy values:
    ```
    [
      {
      "user_claims": [
          {
            "typ": "http://schemas.microsoft.com/identity/claims/objectidentifier",
            "val": "123vhjvjh45"
          },
          {
            "typ": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
            "val": "users@example.com" 
          },
          {
            "typ": "name",
            "val": "John Doe" 
          },
          {
            "typ": "preferred_username",
            "val": "johndoe" 
          }
      ],
      "id_token": "some_id_token_value"
      }
    ]
    ```
9. Run following things
   * if you did not have python, you can use `python3` instead `python`
   * run `python manage.py makemigrations`(If it said you missing something, just intall it)
   * run `python manage.py makemigrations api`
   * run `python manage.py migrate`
   * run `python manage.py runserver`
9. All of above will run the project locally

# Frontend
1. do all the things for backend first
2. open a different terminal and go to `frontend` folder
3. Run `npm install` and then `npm run start` to run the website
4. go back to backend terminal and open `http://127.0.0.1:8000/`
