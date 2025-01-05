import React from "react";
import Chart from "react-apexcharts";

export default function Area() {
  const series = [
    {
      name: "series-1",
      data: [30, 40, 25, 50, 49, 21, 70, 51]
    },
    {
      name: "series-2",
      data: [23, 12, 54, 61, 32, 56, 81, 19]
    }
  ];

  const options = {
    xaxis: {
      categories: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    }
  };

  return (
    <div className="area">
      <Chart options={options} series={series} type="area" width="500" />
    </div>
  );
}
