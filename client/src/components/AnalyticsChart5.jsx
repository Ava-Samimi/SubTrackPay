import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';  // Import Plotly.js for the 3D Surface chart

const AnalyticsChart = () => {
  const [surfaceData, setSurfaceData] = useState(null);
  const [frames, setFrames] = useState([]);

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
  }, []); // Empty dependency array ensures this runs only once

  // Layout for the 3D Surface chart
  const layout = {
    title: '3D Surface Chart with Animated Data',
    scene: {
      xaxis: { title: 'X Axis' },
      yaxis: { title: 'Y Axis' },
      zaxis: { title: 'Z Axis' },
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

  return (
    <div style={{ width: '100%', height: '600px' }}>
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
  );
};

export default AnalyticsChart;
