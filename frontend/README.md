
# Frontend Development Guide

Welcome to the frontend development guide. This document provides all the necessary information to set up, develop, and contribute to the frontend part of our project.

## Table of Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
- [Running the Development Server](#running-the-development-server)
- [Development Workflow](#development-workflow)
- [Building for Production](#building-for-production)
- [Submitting Changes](#submitting-changes)

## Getting Started

Before diving into frontend development, make sure you have the backend services up and running. Refer to our `install.md` document for backend setup instructions.

## Installation

1. Make sure you have the backend services up and running.(If you don't have the backend services up and running, you can refer to the `install.md` document in the main directory of the project.)
2. Create a new terminal and navigate to the `frontend` directory.
3. Install the necessary dependencies using npm:
   `npm install`

## Running the Development Server

To start the development server, run:
`npm run start`
This will launch the server on `http://127.0.0.1:8000/`, where you can view and test your changes in real-time.

Note: if you use `npm run start` and the backend is not running, you will see a blank page. This is because the frontend is trying to fetch data from the backend, which is not running. **so you should run the backend server first and then run the frontend server**

If your `npm run start` give you an error
```
Invalid options object. Dev Server has been initialized using an options object that does not match the API schema.
 - options.allowedHosts[0] should be a non-empty string.
```
You can run `npm run build` and then go to the backend folder and run `python manage.py runserver` and then open `http://127.0.0.1:8000/`

Note: If you are using the backend server, you should do `npm run build` when you are done with the frontend development and then goto the backend folder and run `python manage.py runserver` to see the changes. (Also, do not forgot to refresh the page after running the backend server.)

## Development Workflow

When developing new features or fixing bugs, create a new branch from `main`. Use descriptive branch names that reflect the changes being made.

## Building for Production

To build the application for production, run:
```bash
npm run build
```
This will generate a `build` folder containing optimized files ready for deployment.

## Submitting Changes

When you are done with your changes, submit a pull request to the `main` branch. Make sure to include a detailed description of the changes and any relevant information for reviewers.

Note: If you don't know how to submit a pull request, you can goto `https://github.com/soundscape-community/authoring-tool/pulls` and click on `New pull request` and then select the branch you want to merge and then click on `Create pull request` and then add a title and description and then click on `Create pull request` and you are done.
