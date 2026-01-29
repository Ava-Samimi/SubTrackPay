import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';  // Import Plotly.js for the chart

const AnalyticsChart = () => {
  const [chartData, setChartData] = useState([]);

  // Generate fictional random data for the pie chart
  useEffect(() => {
    const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
    const values = categories.map(() => Math.floor(Math.random() * 100) + 1); // Random values between 1 and 100

    const trace = {
      labels: categories,  // Categories to display
      values: values,  // Random values for each category
      type: 'pie',  // Set the chart type to 'pie'
      marker: {
        colors: ['#ff7f0e', '#2ca02c', '#1f77b4', '#d62728', '#9467bd'],  // Custom colors for each category
      },
    };

    setChartData([trace]);  // Set the chart data
  }, []);  // Only run this once when the component mounts

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {chartData.length === 0 ? (
        <div>No data available</div>
      ) : (
        <Plot
          data={chartData}  // Pass the chart data to Plotly
          layout={{
            title: 'Fictional Pie Chart',  // Title for the pie chart
            paper_bgcolor: 'rgb(0, 128, 0)',  // Set the background color of the chart to green
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
