import React from "react";
import Chart from "react-apexcharts";

export default function Bar() {
  const series = [
    {
      data: [30, 40, 25, 50, 49, 21, 70, 51]
    }
  ];

  const options = {
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    xaxis: {
      categories: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    }
  };

  return (
    <div className="bar">
      <Chart options={options} series={series} type="bar" width="500" />
    </div>
  );
}
