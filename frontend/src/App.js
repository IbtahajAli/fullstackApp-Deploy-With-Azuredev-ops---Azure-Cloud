// Import React and hooks for managing state and side effects
import React, { useState, useEffect } from 'react';

function App() {
  // Create a state variable `projectData` to store the project information
  // `setProjectData` is used to update the value of `projectData`
  const [projectData, setProjectData] = useState(null);

  // useEffect is a React hook that runs side effects, such as fetching data
  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch('http://localhost:5000/api/project')
      .then((response) => response.json()) // Convert the API response to JSON
      .then((data) => setProjectData(data)); // Update the state with the fetched data
  }, []); // Empty dependency array ensures this runs only once after the component mounts

  // Render the UI
  return (
    <div className="App">
      {/* Display the main heading */}
      <h1>Project Information</h1>

      {/* Conditionally render content based on whether `projectData` has been fetched */}
      {projectData ? (
        <div>
          {/* Display project details if `projectData` is available */}
          <h2>{projectData.projectName}</h2>
          <p><strong>Student:</strong> {projectData.studentName}</p>
          <p><strong>Description:</strong> {projectData.projectDescription}</p>
          {/* Link to the project URL, opening in a new tab */}
          <a href={projectData.projectUrl} target="_blank" rel="noopener noreferrer">
            View Project
          </a>
        </div>
      ) : (
        // Show a loading message while waiting for data to be fetched
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;
