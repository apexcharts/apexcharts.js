// @ts-check
import ApexCharts from '../apexcharts'
import InkLayer from '../modules/ink/InkLayer'

// Ink Layer (#7): direct-manipulation annotation authoring. Opt-in per
// annotation (annotations.points[].draggable) or globally (chart.ink.enabled).
ApexCharts.registerFeatures({ ink: InkLayer })

export default ApexCharts
