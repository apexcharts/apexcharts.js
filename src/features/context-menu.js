// @ts-check
import ApexCharts from '../apexcharts'
import ContextMenu from '../modules/contextMenu/ContextMenu'

// Radial Actions (#chrome): right-click / long-press context menu.
// Opt-in via chart.contextMenu.enabled.
ApexCharts.registerFeatures({ contextMenu: ContextMenu })

export default ApexCharts
