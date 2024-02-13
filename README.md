# Soundscape Authoring Tool

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="">
    <img src="frontend\src\images\logo.png" alt="Logo" width="160" height="160">
  </a>

</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#github-codespaces-on-the-web">GitHub Codespaces on the web</li>
      </ul>
      <ul>
        <li><a href="#github-codespaces-in-vscode">GitHub Codespaces in VSCode</li>
      </ul>
    </li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project
Soundscape Authoring Tool is a web app which allows users to create routed activities for use with the Soundscape iOS app.

### Built With
<!-- https://dev.to/envoy_/150-badges-for-github-pnk -->
#### Frontend
* [![JavaScript]][JavaScript-url] 
* [![React][React.js]][React-url]
* [![Bootstrap]][Bootstrap-url]
* [![Tailwind CSS]][Tailwind-url]

#### Backend
* [![Python][Python]][Python-url]
* [![Django][Django]][Django-url]

<!-- GETTING STARTED -->
## Getting Started
* [See Installation Guide](./install.md)

* [Exporting from the Authoring Web App](./exporting.md)

### GitHub Codespaces on the web

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/soundscape-community/authoring-tool/tree/rd-devcontainer?quickstart=1)

The easiest way to get started is by opening this repository in a GitHub Codespace. This will create a development environment with all the necessary tools and dependencies pre-installed.
Click the "Open in GitHub Codespaces" button above to get started.

This will start a new codespace and open VSCode in your browser. Once the codespace is ready, you can start the development server by doing the following:

1. From the command palette (Ctrl+Shift+P), select "python: select interpreter" and choose python 3.12.
2. In the terminal cd to the frontend directory and run the command "npm run build"
3. Select "Run task" from the command palette and choose "create superuser". Fill in the details in the terminal to create a superuser.
4. Choose the "Run and Debug" tab on the left-hand side of the screen (control+shift+D), and select "run full stack" from the dropdown menu.
5. Click the green play button (F5) to start the server.
6. a notification will appear in the bottom right corner of the screen with a link to open the app in a new browser window. If there are two, select the one with the port number 3000.

the app will open in a new browser window. You can now start making changes to the code and see the results in real-time.

### GitHub Codespaces in VSCode

If you want to use VSCode on your local machine, you can use the GitHub Codespaces extension to achieve the same result.
Install the GitHub Codespaces extension from the VSCode marketplace and open this repository in a new codespace.
See [Using Codespaces in Visual Studio Code](https://docs.github.com/en/codespaces/developing-in-a-codespace/using-github-codespaces-in-visual-studio-code) for more information.
For now, make sure you choose the rd-devcontainer branch when opening the codespace.

Once the codespace is ready, follow the same steps as above to start the development server.

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Follow these instructions to submit your contributions to the project. 

1. Branch the Project
3. Commit your Changes (`git commit -a -m 'Your Feature's commit message'`)
4. Push to the right Branch (`git push origin branch_you_commit_to`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[JavaScript]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[Javascript-url]: https://www.javascript.com/
[Bootstrap]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[Tailwind CSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Python]: https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white
[Python-url]: https://www.python.org/
[Django]: https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white
[Django-url]: https://www.djangoproject.com/