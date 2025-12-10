Fullstack Project with React and Node.js
========================================

This project is a **fullstack application** combining a **React frontend** and a **Node.js/Express backend** within a single project directory. This README will guide you through understanding the project structure, navigating the files, and running both applications together.

* * *

Project Structure
-----------------

The project directory has two main subdirectories: `frontend` and `backend`. Each contains its own `package.json` file for managing dependencies and scripts, while a root-level `package.json` manages shared dependencies and scripts to make it easy to work with both applications from a single command.

### Directory Layout
![Image showing the directory structure of a fullstack app project. The root directory, labeled 'fullstack-app,' contains two main folders: 'backend' and 'frontend,' along with a root-level package.json and README.md file. The backend folder includes a 'server.js' file for the Node.js server and its own package.json file. The frontend folder includes a 'src' folder for React components, a 'public' folder for static assets, and its own package.json file. This structure highlights the organization of frontend and backend code within a single project directory.](project-structure.png)

### Explanation of Each Part

*   **backend/**: Contains all server-side code using Node.js and Express, including API routes, middleware, and backend-specific configurations.
*   **frontend/**: Contains all client-side code using React, including components, styles, and assets.
*   **Root `package.json`**: The root `package.json` defines shared dependencies (like `concurrently` for running both servers) and scripts for managing both frontend and backend projects from a single command.

### Version Control: Understanding `**/node_modules` in `.gitignore` and What is the `node_modules` Folder?

The `node_modules` folder is automatically created by **npm** (Node Package Manager) when you run `npm install`. It contains all the dependencies and sub-dependencies required for your project to function. Each project or workspace, such as `frontend` and `backend`, will have its own `node_modules` folder.

### What Does `**/node_modules` Do in `.gitignore`?

The `**/node_modules` entry in the `.gitignore` file tells Git to ignore all `node_modules` folders in the project, no matter where they are located. This is particularly important for a fullstack project where both the `frontend` and `backend` directories have their own `node_modules` folders.

* * *

Setting Up the Project
----------------------

### Prerequisites

Ensure you have the following installed:

*   **Node.js** (v14 or later)
*   **npm** (v7 or later for workspaces support)

### Installation

To set up the project, install all dependencies by running `npm install` from the root directory. This command will install dependencies for both `frontend` and `backend` automatically:

    npm install

> **Note**: If you encounter errors with `npm install` in the root, try running `npm install` from the `frontend` and `backend` directories individually to install dependencies for each part separately.

* * *

Running the Project
-------------------

The root `package.json` includes scripts to help you start both the frontend and backend servers simultaneously.

### Available Scripts

*   **Install Dependencies**: Installs all dependencies in `frontend` and `backend` folders from the root.
    
         npm install
    
*   **Start Both Frontend and Backend**: Starts both the React app and the Node.js server concurrently.
      
          npm start
    
    *   **React (Frontend)** runs on `http://localhost:3000`
    *   **Express (Backend)** runs on `http://localhost:5000`
*   **Run Backend Only**:
      
          npm run server
    
*   **Run Frontend Only**:
        
        npm run client
    

* * *

How the Frontend and Backend Work Together
------------------------------------------

*   The **React frontend** makes HTTP requests to the **Express backend** to retrieve and display data.
*   The backend serves as an API and handles requests from the frontend, responding with JSON data.
*   **Example API Route**: In `backend/server.js`, there is a sample route:
    
    ```
        app.get('/api/project', (req, res) => {   
            res.json({     
                studentName: "Smith, John",     
                projectName: "Weather App",     
                projectUrl: "http://10.0.0.1:3000/",     
                projectDescription: "Provides real-time weather updates for any location worldwide"   
                }); 
        });
    ```
    
*   **Cross-Origin Resource Sharing (CORS)**: CORS is enabled to allow the frontend to access the backend API while running on different ports (`3000` for frontend and `5000` for backend).

* * *

Tips for Working with This Structure
------------------------------------

1.  **Navigating Between `frontend` and `backend`**:
    
    *   Use separate `package.json` files to add dependencies specific to each part of the project.
    *   Run `npm install <package-name>` from within `frontend` or `backend` to install packages only for that directory.
2.  **Editing API Routes**:
    
    *   Add routes in `backend/server.js` as needed. You can create separate route files and import them into `server.js` for cleaner organization.
3.  **Frontend-Backend Communication**:
    
    *   In the frontend, use `fetch` or a library like `axios` to make requests to the backend API.
    *   Example (in a React component):
          
        ```
        useEffect(() => {   
            fetch('http://localhost:5000/api/project')     
            .then(response => response.json())     
            .then(data => setProjectData(data)); 
            }, []);
        ```
        
4.  **Environment Configuration**:
    
    *   Use environment variables in both `frontend` and `backend` for settings like API URLs, especially when deploying to production.

* * *



This structure allows you to manage the React frontend and Node.js backend independently while keeping everything organized within a single project. This setup makes it easy to develop and run a fullstack application while maintaining a clear separation between frontend and backend code.