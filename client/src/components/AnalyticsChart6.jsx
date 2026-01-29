import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';  // Import Plotly.js for the 3D Surface chart

const AnalyticsChart = () => {
  const [surfaceData, setSurfaceData] = useState(null);
  const [frames, setFrames] = useState([]);
  
  // State to manage camera view control
  const [camera, setCamera] = useState({
    eyeX: 1.5,
    eyeY: 1.5,
    eyeZ: 1.5,
    upX: 0,
    upY: 0,
    upZ: 1
  });

  // Generate random 3D data for the surface chart
  const generateRandomSurfaceData = () => {
    const x = [];
    const y = [];
    const z = [];
    
    // Create a grid of points (e.g., 10x10 grid)
    for (let i = 0; i < 10; i++) {
      x.push([]);
      y.push([]);
      z.push([]);
      for (let j = 0; j < 10; j++) {
        x[i].push(i);
        y[i].push(j);
        z[i].push(Math.sin(i) * Math.cos(j) * Math.random() * 10); // Some random function to generate values
      }
    }
    return { x, y, z };
  };

  useEffect(() => {
    // Generate initial surface data
    const initialData = generateRandomSurfaceData();
    setSurfaceData(initialData);

    // Generate animation frames (e.g., animate over 10 steps)
    const animationFrames = [];
    for (let t = 0; t < 10; t++) {
      const updatedZ = initialData.z.map(row => row.map(value => value + Math.sin(t * 0.5) * 0.5)); // Animate z values
      animationFrames.push({
        data: [{ z: updatedZ }],
        name: `frame${t}`,
      });
    }
    setFrames(animationFrames);
  }, []); // Only runs once when component mounts

  // Layout for the 3D Surface chart
  const layout = {
    title: '3D Surface Chart with Animated Data',
    scene: {
      xaxis: { title: 'X Axis' },
      yaxis: { title: 'Y Axis' },
      zaxis: { title: 'Z Axis' },
      camera: {
        eye: {
          x: camera.eyeX,
          y: camera.eyeY,
          z: camera.eyeZ,
        },
        up: {
          x: camera.upX,
          y: camera.upY,
          z: camera.upZ,
        },
      },
    },
    paper_bgcolor: 'black',
    plot_bgcolor: 'green',
    font: { color: 'rgb(0, 255, 0)', family: 'Arial, sans-serif' },
  };

  // Trace for the surface plot
  const trace = {
    type: 'surface',
    x: surfaceData?.x,
    y: surfaceData?.y,
    z: surfaceData?.z,
    colorscale: 'Viridis',
    showscale: true,
  };

  // Handle the camera control changes
  const handleCameraChange = (e) => {
    const { name, value } = e.target;
    setCamera((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      {/* Control Panel */}
      <div style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '250px', 
        height: '100vh', 
        padding: '20px', 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        color: 'rgb(0, 255, 0)', 
        overflowY: 'auto',
        zIndex: 1000
      }}>
        <h3>Camera Controls</h3>
        <label>Camera Rotation (X):</label>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          name="eyeX"
          value={camera.eyeX}
          onChange={handleCameraChange}
        />
        <br />
        <label>Camera Rotation (Y):</label>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          name="eyeY"
          value={camera.eyeY}
          onChange={handleCameraChange}
        />
        <br />
        <label>Camera Rotation (Z):</label>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          name="eyeZ"
          value={camera.eyeZ}
          onChange={handleCameraChange}
        />
        <br />
        <label>Camera Up (X):</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          name="upX"
          value={camera.upX}
          onChange={handleCameraChange}
        />
        <br />
        <label>Camera Up (Y):</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          name="upY"
          value={camera.upY}
          onChange={handleCameraChange}
        />
        <br />
        <label>Camera Up (Z):</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          name="upZ"
          value={camera.upZ}
          onChange={handleCameraChange}
        />
      </div>

      {/* Surface Plot */}
      <div style={{ flex: 1, marginLeft: '270px', height: '100vh' }}>
        {surfaceData ? (
          <Plot
            data={[trace]}  // The surface chart data
            layout={layout}
            frames={frames}  // Animation frames
            config={{
              responsive: true,
              displayModeBar: true,
              showLink: false,
              displaylogo: false,
            }}
          />
        ) : (
          <div>Loading...</div>  // Show loading while data is being prepared
        )}
      </div>
    </div>
  );
};

export default AnalyticsChart;
