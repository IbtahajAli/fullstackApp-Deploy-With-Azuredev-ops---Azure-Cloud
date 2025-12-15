// Import the Express framework
const express = require('express');
const cors = require('cors'); // Import CORS

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED: Allow ALL origins. 
// This ensures that even if your Frontend IP changes, the connection still works.
app.use(cors()); 

app.use(express.json());

app.get('/api/project', (req, res) => {
    res.json({
        studentName: "Smith, John",
        projectName: "Weather App",
        // Ideally this should also be dynamic, but for display purposes it's fine
        projectUrl: "#", 
        projectDescription: "This application provides real-time weather updates."
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});