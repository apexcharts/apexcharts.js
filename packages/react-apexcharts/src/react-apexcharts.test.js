import React from 'react'
import { createRoot } from 'react-dom/client'
import Chart from './react-apexcharts.jsx'

const props = {
  type: 'bar',
  options: {
    xaxis: {
      categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  },
  series: [{
    data: [30, 40, 25, 50, 49, 21, 70, 51]
  }],
}

it('renders without crashing', () => {
  const div = document.createElement('div');
  const root = createRoot(div);
  root.render(<Chart {...props} />);
  root.unmount();
});
