/**
 * Built-in theme color palettes for ApexCharts.
 * Extracted here so Theme.js does not need a reference to the ApexCharts class.
 */
export function getThemePalettes() {
  return {
    palette1: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
    palette2: ['#3F51B5', '#03A9F4', '#4CAF50', '#F9CE1D', '#FF9800'],
    palette3: ['#33B2DF', '#546E7A', '#D4526E', '#13D8AA', '#A5978B'],
    palette4: ['#4ECDC4', '#C7F464', '#81D4FA', '#FD6A6A', '#546E7A'],
    palette5: ['#2B908F', '#F9A3A4', '#90EE7E', '#FA4443', '#69D2E7'],
    palette6: ['#449DD1', '#F86624', '#EA3546', '#662E9B', '#C5D86D'],
    palette7: ['#D7263D', '#1B998B', '#2E294E', '#F46036', '#E2C044'],
    palette8: ['#662E9B', '#F86624', '#F9C80E', '#EA3546', '#43BCCD'],
    palette9: ['#5C4742', '#A5978B', '#8D5B4C', '#5A2A27', '#C4BBAF'],
    palette10: ['#A300D6', '#7D02EB', '#5653FE', '#2983FF', '#00B1F2'],
    // CVD-safe palettes (Wong 2011 / IBM design)
    cvdDeuteranopia: ['#0072B2', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#D55E00', '#CC79A7'],
    cvdProtanopia: ['#0077BB', '#EE7733', '#009988', '#EE3377', '#BBBBBB', '#33BBEE', '#CC3311'],
    cvdTritanopia: ['#CC3311', '#009988', '#EE7733', '#0077BB', '#EE3377', '#BBBBBB', '#33BBEE'],
    highContrast: ['#005A9C', '#C00000', '#007A33', '#6C3483', '#7B3F00', '#0097A7', '#4A235A'],
  }
}
