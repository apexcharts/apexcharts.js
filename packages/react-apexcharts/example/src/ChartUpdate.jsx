import React, { useState } from "react";
import Chart from "react-apexcharts";

export default function ChartUpdate() {
  const [mixedChart, setMixedChart] = useState({
    series: [
      {
        name: "series-1",
        type: "line",
        data: [30, 40, 25, 50, 49, 21, 70, 51]
      },
      {
        name: "series-2",
        type: "column",
        data: [23, 12, 54, 61, 32, 56, 81, 19]
      },
      {
        name: "series-3",
        type: "column",
        data: [62, 12, 45, 55, 76, 41, 23, 43]
      }
    ],
    options: {
      chart: {
        id: "basic-bar",
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          columnWidth: "50%",
        }
      },
      stroke: { width: [4, 0, 0] },
      xaxis: {
        categories: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      },
      markers: {
        size: 6,
      },
      yaxis: {
        tickAmount: 5,
        min: 0,
        max: 100
      }
    }
  });

  const [radialChart, setRadialChart] = useState({
    series: [76],
    options: {
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          hollow: {
            margin: 0,
            size: "70%",
            background: "#fff",
            image: undefined,
            imageOffsetX: 0,
            imageOffsetY: 0,
            position: "front",
            dropShadow: {
              enabled: true,
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },
          track: {
            background: "#fff",
            strokeWidth: "67%",
            margin: 0, // margin is in pixels
            dropShadow: {
              enabled: true,
              top: -3,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },

          dataLabels: {
            showOn: "always",
            name: {
              offsetY: -20,
              show: true,
              color: "#888",
              fontSize: "13px"
            },
            value: {
              formatter: function (val) {
                return val;
              },
              color: "#111",
              fontSize: "30px",
              show: true
            }
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "dark",
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: ["#ABE5A1"],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      stroke: { lineCap: "round" },
      labels: ["Percent"]
    }
  });

  const [barChart, setBarChart] = useState({
    series: [
      { name: "blue", data: [32] },
      { name: "green", data: [41] },
      { name: "yellow", data: [12] },
      { name: "red", data: [65] }
    ],
    options: {
      chart: {
        stacked: true,
        stackType: "100%",
        toolbar: { show: false }
      },
      plotOptions: {
        bar: { horizontal: true }
      },
      dataLabels: {
        dropShadow: { enabled: true }
      },
      stroke: { width: 0 },
      xaxis: {
        categories: ["Fav Color"],
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      fill: {
        opacity: 1,
        type: "gradient",
        gradient: {
          shade: "dark",
          type: "vertical",
          shadeIntensity: 0.35,
          gradientToColors: undefined,
          inverseColors: false,
          opacityFrom: 0.85,
          opacityTo: 0.85,
          stops: [90, 0, 100]
        }
      },

      legend: {
        position: "bottom",
        horizontalAlign: "right"
      }
    }
  });

  const updateCharts = () => {
    const max = 90;
    const min = 30;
    const newMixedSeries = [];
    const newBarSeries = [];

    mixedChart.series.forEach((s) => {
      const data = s.data.map(() => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      });

      newMixedSeries.push({ data: data, type: s.type });
    });

    barChart.series.forEach((s) => {
      const data = s.data.map(() => {
        return Math.floor(Math.random() * (180 - min + 1)) + min;
      });

      newBarSeries.push({ data, name: s.name });
    });

    setMixedChart({ ...mixedChart, series: newMixedSeries });
    setBarChart({ ...barChart, series: newBarSeries });
    setRadialChart({ ...radialChart, series: [Math.floor(Math.random() * (90 - 50 + 1)) + 50] });
  };

  return (
    <div className="app">
      <div className="row">
        <div className="col mixed-chart">
          <Chart options={mixedChart.options} series={mixedChart.series} type="line" width="500" />
        </div>

        <div className="col radial-chart">
          <Chart
            options={radialChart.options}
            series={radialChart.series}
            type="radialBar"
            width="280"
          />
        </div>
      </div>

      <div className="row">
        <div className="col percentage-chart">
          <Chart
            options={barChart.options}
            height={140}
            series={barChart.series}
            type="bar"
            width={500}
          />
        </div>

        <p className="col">
          <button onClick={updateCharts}>Update!</button>
        </p>
      </div>
    </div>
  );
}
