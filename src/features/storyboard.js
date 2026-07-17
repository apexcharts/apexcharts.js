// @ts-check
import ApexCharts from '../apexcharts'
import Storyboard from '../modules/storyboard/Storyboard'

// Storyboard: scroll-driven chart choreography (scrollytelling). Beats are
// Perspectives tokens, so bundling storyboard pulls in the perspectives
// feature: chart.perspectives is guaranteed wherever chart.storyboard is.
import './perspectives.js'

ApexCharts.registerFeatures({ storyboard: Storyboard })

export default ApexCharts
