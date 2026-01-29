import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';  // Import Plotly.js for the chart

const AnalyticsChart = () => {
  // Hardcoded data from package_percentages.json
  const data = [
    {
      "package_id": 1,
      "monthly_cost": 79,
      "annual_cost": 199,
      "percentage": 21.4
    },
    {
      "package_id": 2,
      "monthly_cost": 59,
      "annual_cost": 159,
      "percentage": 14.5
    },
    {
      "package_id": 3,
      "monthly_cost": 99,
      "annual_cost": 299,
      "percentage": 40.0
    },
    {
      "package_id": 4,
      "monthly_cost": 69,
      "annual_cost": 179,
      "percentage": 24.1
    },
    {
      "package_id": 5,
      "monthly_cost": 49,
      "annual_cost": 129,
      "percentage": 15.8
    }
  ];

  const [chartData, setChartData] = useState([]);

  // UseEffect to set chart data on component mount
  useEffect(() => {
    const categories = data.map(pkg => `Package ${pkg.package_id}`);  // Set package names
    const percentages = data.map(pkg => pkg.percentage);  // Set package percentages

    // Create the chart trace
    const trace = {
      type: 'scatterpolar',
      r: percentages,  // Use the percentages as the radial data
      theta: categories,  // Use the package names as the category labels
      fill: 'toself',  // Fill the area of the chart
      line: { color: 'rgb(0, 255, 0)' },  // Line color set to Hacker Green
      marker: { size: 8 },
    };

    // Set the chart data
    setChartData([trace]);
  }, []);  // Only run once when the component mounts

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {chartData.length === 0 ? (
        <div>No data available</div>  // Display when there's no data
      ) : (
        <Plot
          data={chartData}  // Pass the chart data to Plotly
          layout={{
            title: 'Package Comparison',  // Title for the radar chart
            polar: {
              radialaxis: {
                visible: true,
                range: [0, 100],  // Set the range for the radial axis (percentage from 0 to 100)
              },
            },
            paper_bgcolor: 'rgb(0, 128, 0)',  // Set the background color of the chart to green (hacker green)
            plot_bgcolor: 'rgb(0, 128, 0)',   // Set the background color of the plot area to green
            font: {
              color: 'white',  // Set font color to white for contrast
            },
          }}
          config={{
            responsive: true,  // Ensure the chart is responsive
            displayModeBar: true,  // Display the mode bar for zooming and panning
            showLink: false,
            displaylogo: false,
          }}
        />
      )}
    </div>
  );
};

export default AnalyticsChart;
