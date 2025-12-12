import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [projectData, setProjectData] = useState(null);

  // Use the environment variable if available, otherwise fallback to localhost (for local dev)
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // We append the specific endpoint to the base URL
    fetch(`${API_URL}/api/project`)
      .then((response) => response.json())
      .then((data) => setProjectData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, [API_URL]);

  return (
    <div className="App">
      <h1>Project Information</h1>
      {projectData ? (
        <div>
          <h2>{projectData.projectName}</h2>
          <p><strong>Student:</strong> {projectData.studentName}</p>
          <p><strong>Description:</strong> {projectData.projectDescription}</p>
          <a href={projectData.projectUrl} target="_blank" rel="noopener noreferrer">
            View Project
          </a>
        </div>
      ) : (
        <p>Loading data from: {API_URL}...</p>
      )}
    </div>
  );
}

export default App;