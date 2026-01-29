import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';  // Import Plotly.js

const AnalyticsChart = ({ data }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (data.length > 0) {
      // Prepare data for the Plotly chart
      const trace = {
        x: data.map(item => {
          const date = new Date(item.date); // Parse the date string
          return date;  // Plotly expects Date objects for x-axis
        }),
        y: data.map(item => item.subscriptions),  // Subscription count on the y-axis
        type: 'scatter', // Line chart
        mode: 'lines+markers', // Line with markers
        name: 'Active Subscriptions',
        line: { color: 'rgb(0, 255, 0)' }, // Hacker green line color
        marker: { size: 6 },
      };

      // Set the chart data
      setChartData([trace]);
    }
  }, [data]);  // Re-run when `data` changes

  return (
    <div>
      {chartData.length === 0 ? (
        <div>No data available</div>
      ) : (
        <Plot
          data={chartData}  // Pass the chart data to Plotly
          layout={{
            title: 'Monthly Active Subscriptions',
            xaxis: {
              title: 'Date',
              showgrid: true,
              zeroline: false,
              type: 'date',  // Specify that this is a date axis
              tickformat: '%b %Y',  // Format: Jan 2018, Feb 2018, etc.
              tickangle: -45,  // Rotate the date labels for better readability
            },
            yaxis: {
              title: 'Active Subscriptions',
              showgrid: true,
              zeroline: false,
            },
            paper_bgcolor: 'black',  // Set the background color
            plot_bgcolor: 'green',   // Set the background color of the plot
            font: {
              color: 'rgb(0, 255, 0)', // Hacker green font color
            },
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            scrollZoom: true,
            showLink: false,
            displaylogo: false,
          }}
        />
      )}
    </div>
  );
};

export default AnalyticsChart;
