import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';  // Import Plotly.js for the map

const AnalyticsChart = () => {
  const [mapData, setMapData] = useState([]);

  useEffect(() => {
    // Example data with locations in both USA and Canada
    const locations = [
      { name: "Calgary Event", lat: 51.0447, lon: -114.0719 },
      { name: "Vancouver Event", lat: 49.2827, lon: -123.1207 },
      { name: "Denver Event", lat: 39.7392, lon: -104.9903 },
      { name: "LA Event", lat: 34.0522, lon: -118.2437 },
      { name: "Ottawa Event", lat: 45.4215, lon: -75.6972 },
      { name: "NYC Event", lat: 40.7128, lon: -74.0060 },
    ];

    const trace = {
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

    setMapData([trace]);
  }, []);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      {mapData.length === 0 ? (
        <div>No data available</div>
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
