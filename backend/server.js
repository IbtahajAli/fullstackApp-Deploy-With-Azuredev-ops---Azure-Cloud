// Import the Express framework for building the server
const express = require('express');

// Import the CORS package to enable Cross-Origin Resource Sharing
const cors = require('cors');

// Create an Express application instance
const app = express();

// Set the port for the server to listen on, using an environment variable if available, or defaulting to 5000
const PORT = process.env.PORT || 5000;

// Use the CORS middleware to enable cross-origin requests from any origin
app.use(cors());

/*
// Optional: Restrict allowed origins and methods for more control
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests only from the React app running on localhost:3000
  methods: ['GET', 'POST'],        // Allow only GET and POST requests
}));
*/

// Use the JSON middleware to automatically parse incoming JSON requests
app.use(express.json());

// Define a GET route at /api/project to handle API requests from the frontend
app.get('/api/project', (req, res) => {
    // Send a JSON response containing information about the project
    res.json({
        studentName: "Smith, John",
        projectName: "Weather App",
        projectUrl: "http://10.0.0.1:3000/",
        projectDescription: "This application provides real-time weather updates for any location worldwide."
    });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    // Log a message to indicate the server is running
    console.log(`Server running on port ${PORT}`);
});
