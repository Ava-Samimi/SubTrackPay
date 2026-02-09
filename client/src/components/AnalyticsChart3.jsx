import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

const AnalyticsChart = () => {
  // Generate random subscription data
  const generateRandomData = () => {
    const data = [];
    const startDate = new Date('2023-01-01');
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      data.push({
        date: date.toISOString(),
        subscriptions: Math.floor(Math.random() * 500) + 100, // Random subscription count between 100 and 600
      });
    }
    return data;
  };

  const [chartData, setChartData] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Generate random data for testing
    const subscriptionsData = generateRandomData();

    // Prepare data for the Plotly chart (for subscriptions)
    const trace = {
      x: subscriptionsData.map(item => new Date(item.date)),
      y: subscriptionsData.map(item => item.subscriptions),  // Subscription count on the y-axis
      type: 'scatter', // Line chart
      mode: 'lines+markers', // Line with markers
      name: 'Active Subscriptions',
      line: {
        color: 'rgb(0, 255, 0)', // Hacker green line color
        width: 4,  // Make the line a bit thicker
        shape: 'spline',  // Smooth the curve
        dash: 'solid',  // Solid line
      },
      marker: {
        size: 8,  // Increase marker size
        color: 'rgb(0, 255, 0)', // Green color for markers
        line: {
          width: 2,  // Marker border width
          color: 'rgb(0, 128, 0)', // Darker green for the border
        },
      },
      hoverinfo: 'x+y',  // Show only the data on hover
    };

    // Set the chart data for subscriptions
    setChartData([trace]);

    // Generate random event data for testing
    const randomEvents = [
      { lat: 40.7128, lon: -74.0060, label: "NYC Event" },
      { lat: 34.0522, lon: -118.2437, label: "LA Event" },
      { lat: 51.0447, lon: -114.0719, label: "Calgary Event" },
      { lat: 45.4215, lon: -75.6992, label: "Ottawa Event" },
      { lat: 39.7392, lon: -104.9903, label: "Denver Event" },
      { lat: 48.4284, lon: -123.3656, label: "Vancouver Event" },
    ];

    // Set random event data
    setEvents(randomEvents);
  }, []);

  // Map data (events) for North America
  const mapData = [
    {
      type: "scattergeo",
      mode: "markers+text", // markers plus labels
      lat: events.map((e) => e.lat),
      lon: events.map((e) => e.lon),
      text: events.map((e) => e.label),
      marker: {
        size: 8,
        color: "red",
      },
      hoverinfo: "text",
    },
  ];

  const mapLayout = {
    title: 'Monthly Active Subscriptions and Events in North America',
    geo: {
      scope: 'north america', // only show North America
      projection: { type: 'natural earth' },
      showland: true,
      landcolor: 'rgb(240, 240, 240)',
      subunitcolor: 'rgb(200, 200, 200)',
      countrycolor: 'rgb(180, 180, 180)',
      coastlinecolor: 'rgb(255, 255, 255)',
    },
    paper_bgcolor: 'white',
    plot_bgcolor: 'green',   // Set the background color of the plot
    font: {
      color: 'rgb(0, 255, 0)', // Hacker green font color
      family: 'Arial, sans-serif',
    },
    hovermode: 'closest',  // Show hover info when close to the point
    showlegend: true,  // Display legend
  };

  return (
    <div>
      {chartData.length === 0 ? (
        <div>No data available</div>
      ) : (
        <>
          <Plot
            data={chartData}  // Pass the chart data for subscriptions to Plotly
            layout={{
              title: 'Monthly Active Subscriptions',
              xaxis: {
                title: 'Date',
                showgrid: true,
                zeroline: false,
                type: 'date',  // Specify that this is a date axis
                tickformat: '%b %Y',  // Format: Jan 2018, Feb 2018, etc.
                tickangle: -45,  // Rotate the date labels for better readability
                ticks: 'inside',  // Add ticks inside the chart for a cleaner look
              },
              yaxis: {
                title: 'Active Subscriptions',
                showgrid: true,
                zeroline: false,
                tickfont: { size: 14 },
              },
              paper_bgcolor: 'black',  // Set the background color
              plot_bgcolor: 'green',   // Set the background color of the plot
              font: {
                color: 'rgb(0, 255, 0)', // Hacker green font color
              },
              hovermode: 'closest',
            }}
            config={{
              responsive: true,
              displayModeBar: true,
              scrollZoom: true,
              showLink: false,
              displaylogo: false,
            }}
          />

          <Plot
            data={mapData}  // Pass the map data to Plotly
            layout={mapLayout}
            config={{
              responsive: true,
              displayModeBar: true,
              scrollZoom: true,
              showLink: false,
              displaylogo: false,
            }}
          />
        </>
      )}
    </div>
  );
};

export default AnalyticsChart;
