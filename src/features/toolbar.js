// @ts-check
import ApexCharts from '../apexcharts'
import Toolbar from '../modules/Toolbar'
import ZoomPanSelection from '../modules/ZoomPanSelection'

// Toolbar and ZoomPanSelection are always registered together — zoom/pan
// controls require both to function. Toolbar renders the UI buttons;
// ZoomPanSelection handles the mouse/touch interaction.
ApexCharts.registerFeatures({
  toolbar: Toolbar,
  zoomPanSelection: ZoomPanSelection,
})

export default ApexCharts
