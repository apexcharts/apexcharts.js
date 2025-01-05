import React from "react";
import Chart from "react-apexcharts";

export default function Donut() {
  const series = [44, 55, 41, 17, 15];

  const options = {
    labels: ["A", "B", "C", "D", "E"]
  };

  return (
    <div className="donut">
      <Chart options={options} series={series} type="donut" width="380" />
    </div>
  );
}
