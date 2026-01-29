import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';  // Import Plotly.js for the map

const AnalyticsChart = () => {
  const [mapData, setMapData] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  useEffect(() => {
    // Example data with locations in both USA and Canada
    const locations = [
      { name: "Calgary Event", lat: 51.0447, lon: -114.0719, category: "Canada" },
      { name: "Vancouver Event", lat: 49.2827, lon: -123.1207, category: "Canada" },
      { name: "Denver Event", lat: 39.7392, lon: -104.9903, category: "USA" },
      { name: "LA Event", lat: 34.0522, lon: -118.2437, category: "USA" },
      { name: "Ottawa Event", lat: 45.4215, lon: -75.6972, category: "Canada" },
      { name: "NYC Event", lat: 40.7128, lon: -74.0060, category: "USA" },
    ];

    // Save the locations for later use
    setAllLocations(locations);

    // Initial data with all locations
    const initialTrace = {
      type: 'scattermapbox',
      lat: locations.map(loc => loc.lat),
      lon: locations.map(loc => loc.lon),
      mode: 'markers',  // Only markers, no text
      marker: {
        size: 12,
        color: 'red', // Color of the markers
        opacity: 0.7,
      },
    };

    // Set the initial map data
    setMapData([initialTrace]);
  }, []);

  // Function to filter locations based on category
  const filterLocations = (category) => {
    // Filter the locations based on category
    const filteredLocations = allLocations.filter(loc => loc.category === category);

    // Create a new trace based on the filtered locations
    const trace = {
      type: 'scattermapbox',
      lat: filteredLocations.map(loc => loc.lat),
      lon: filteredLocations.map(loc => loc.lon),
      mode: 'markers',
      marker: {
        size: 12,
        color: 'red', // Color of the markers
        opacity: 0.7,
      },
    };

    // Update the map data with the filtered trace
    setMapData([trace]);
  };

  // Function to show random locations
  const showRandomLocations = () => {
    // Generate random subset of locations (3 random locations for example)
    const randomLocations = [];
    for (let i = 0; i < 3; i++) {
      const randomLocation = allLocations[Math.floor(Math.random() * allLocations.length)];
      randomLocations.push(randomLocation);
    }

    // Create a new trace based on the random locations
    const trace = {
      type: 'scattermapbox',
      lat: randomLocations.map(loc => loc.lat),
      lon: randomLocations.map(loc => loc.lon),
      mode: 'markers',
      marker: {
        size: 12,
        color: 'blue', // Change color for random points
        opacity: 0.7,
      },
    };

    // Update the map data with the random trace
    setMapData([trace]);
  };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      {/* Buttons for filtering */}
      <div style={{ padding: '10px', backgroundColor: 'black' }}>
        <button onClick={() => filterLocations('USA')} style={{ marginRight: '10px', padding: '10px' }}>
          Show USA Locations
        </button>
        <button onClick={() => filterLocations('Canada')} style={{ marginRight: '10px', padding: '10px' }}>
          Show Canada Locations
        </button>
        <button onClick={showRandomLocations} style={{ padding: '10px' }}>
          Show Random Locations
        </button>
      </div>

      {/* Map with filtered data */}
      {mapData.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <Plot
          data={mapData}
          layout={{
            mapbox: {
              style: 'open-street-map', // Set map style (OpenStreetMap is free)
              center: { lat: 40, lon: -95 },  // Center the map around USA/Canada
              zoom: 1,  // Set zoom level
            },
            title: 'Event Locations',
            font: {
              color: 'rgb(0, 255, 0)',  // Set font color to Hacker Green
            },
            paper_bgcolor: 'black',  // Set the background color of the chart
            plot_bgcolor: 'black',   // Set the background color of the plot area
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            showLink: false,
            displaylogo: false,
          }}
        />
      )}
    </div>
  );
};

export default AnalyticsChart;
