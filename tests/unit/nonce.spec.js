import { createChartWithOptions } from './utils/utils.js'

describe('chart.nonce option', () => {
  beforeEach(() => {
    window.Apex = {};
  });
  afterEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = ''
  })

  it('undefined (default) will not render a nonce attribute', () => {
    createChartWithOptions({
      series: [
        {
          name: "A",
          data: [
            [1, 1],
            [4, 4],
            [3, 3],
          ],
        },
        {
          name: "B",
          data: [
            [2, 2],
            [5, 5],
            [6, 6],
          ],
        },
      ],
      chart: {
        type: 'bar',
      },
    })
    expect(document.head.querySelectorAll('#apexcharts-css').length).toBe(1)
    expect(
      document.head.querySelectorAll('#apexcharts-css[nonce]').length
    ).toBe(0)
    expect(document.body.querySelectorAll('foreignObject style').length).toBe(1)
  })

  it('will render a nonce attribute when provided as an option', () => {
    createChartWithOptions({
      series: [
        {
          data: [
            [1, 1],
            [4, 4],
            [3, 3],
          ],
        },
      ],
      chart: {
        type: 'bar',
        nonce: 'noncevalue1',
      },
    })
    expect(document.head.querySelectorAll('#apexcharts-css').length).toBe(1)
    expect(
      document.head.querySelectorAll("#apexcharts-css[nonce='noncevalue1']")
        .length
    ).toBe(1)
  })

  it('will render a nonce attribute when defined as a global config', () => {
    window.Apex = {
      chart: {
        nonce: 'noncevalue2'
      }
    };
    createChartWithOptions({
      series: [
        {
          data: [
            [1, 1],
            [4, 4],
            [3, 3],
          ],
        },
      ],
      chart: {
        type: 'bar',
      },
    })
    expect(document.head.querySelectorAll('#apexcharts-css').length).toBe(1)
    expect(
      document.head.querySelectorAll("#apexcharts-css[nonce='noncevalue2']")
        .length
    ).toBe(1)
  })
})
