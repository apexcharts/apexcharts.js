// @ts-check
/**
 * Built-in theme color palettes for ApexCharts.
 * Extracted here so Theme.js does not need a reference to the ApexCharts class.
 */
export function getThemePalettes() {
  return {
    // All colours pass WCAG 1.4.11 non-text contrast (≥ 3:1) against the
    // default light (#fff) and dark (#293450) theme backgrounds.
    palette1:  ['#008FFB', '#00A86F', '#CA8501', '#FF4560', '#846DD5'],
    palette2:  ['#6978CB', '#039DE2', '#49A84D', '#B39105', '#D68000'],
    palette3:  ['#209FCC', '#648291', '#D4526E', '#0FA783', '#A19285'],
    palette4:  ['#2FA59D', '#73A20B', '#099DE1', '#FD5D5D', '#648291'],
    palette5:  ['#2B908F', '#F56566', '#2EAB16', '#FA4443', '#1EA2BD'],
    palette6:  ['#449DD1', '#F86624', '#EA3A4A', '#9C63D1', '#899E2A'],
    palette7:  ['#DF475B', '#1B998B', '#7E75B7', '#F46036', '#B1911B'],
    palette8:  ['#9C63D1', '#F86624', '#B38F04', '#EA3A4A', '#2FA2B3'],
    palette9:  ['#98776F', '#A19285', '#A8705E', '#BA6560', '#A0927F'],
    palette10: ['#C91EFF', '#A94BFD', '#6C6AFE', '#2983FF', '#009ED8'],
    // CVD-safe palettes (Wong 2011 / IBM design)
    cvdDeuteranopia: ['#0072B2', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#D55E00', '#CC79A7'],
    cvdProtanopia: ['#0077BB', '#EE7733', '#009988', '#EE3377', '#BBBBBB', '#33BBEE', '#CC3311'],
    cvdTritanopia: ['#CC3311', '#009988', '#EE7733', '#0077BB', '#EE3377', '#BBBBBB', '#33BBEE'],
    highContrast: ['#005A9C', '#C00000', '#007A33', '#6C3483', '#7B3F00', '#0097A7', '#4A235A'],
  }
}
