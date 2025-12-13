// Import the Express framework for building the server
const express = require('express');

// Import the CORS package to enable Cross-Origin Resource Sharing
const cors = require('cors');

// Create an Express application instance
const app = express();

// Set the port for the server to listen on, using an environment variable if available, or defaulting to 5000
const PORT = process.env.PORT || 5000;

// ✅ Updated: Restrict allowed origins to your frontend LoadBalancer IP
app.use(cors({
  origin: 'http://52.177.233.88', // frontend public IP
  methods: ['GET', 'POST'],
}));

// Use the JSON middleware to automatically parse incoming JSON requests
app.use(express.json());

// Define a GET route at /api/project to handle API requests from the frontend
app.get('/api/project', (req, res) => {
    res.json({
        studentName: "Smith, John",
        projectName: "Weather App",
        projectUrl: "http://20.15.62.129:5000/api/project",
        projectDescription: "This application provides real-time weather updates for any location worldwide."
    });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
