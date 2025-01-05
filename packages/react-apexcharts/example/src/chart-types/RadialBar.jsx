import React from "react";
import Chart from "react-apexcharts";

export default function RadialBar() {
  const series = [68];

  const options = {
    labels: ["RadialBar"],
    plotOptions: {
      radialBar: {
        hollow: {
          size: "70%"
        }
      }
    }
  };

  return (
    <div className="radialbar">
      <Chart options={options} series={series} type="radialBar" height="380" />
    </div>
  );
}
