import React, { useState } from "react";
import Area from "./chart-types/Area";
import Bar from "./chart-types/Bar";
import Column from "./chart-types/Column";
import Line from "./chart-types/Line";
import Donut from "./chart-types/Donut";
import RadialBar from "./chart-types/RadialBar";
import ChartUpdate from "./ChartUpdate";

export default function App() {
  const [selectedChart, setSelectedChart] = useState("line");

  const handleChartChange = (e) => {
    setSelectedChart(e.target.value);
  };

  return (
    <div className="app">
      <select id="lang" value={selectedChart} onChange={handleChartChange}>
        <option value="line">Line</option>
        <option value="area">Area</option>
        <option value="bar">Bar</option>
        <option value="column">Column</option>
        <option value="radialbar">RadialBar</option>
        <option value="donut">Donut</option>
        <option value="updateExample">Chart Update Example</option>
      </select>

      {selectedChart === "area" ? <Area></Area> : null}
      {selectedChart === "bar" ? <Bar></Bar> : null}
      {selectedChart === "line" ? <Line></Line> : null}
      {selectedChart === "column" ? <Column></Column> : null}
      {selectedChart === "radialbar" ? <RadialBar></RadialBar> : null}
      {selectedChart === "donut" ? <Donut></Donut> : null}
      {selectedChart === "updateExample" ? <ChartUpdate></ChartUpdate> : null}
    </div>
  );
}
