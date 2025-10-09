import { createChartsWithOptions } from "./utils/utils"

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }),
  });
});

function expectSameElements(a, b) {

  expect(a).toHaveLength(b.length);
  expect(a.every(el => b.includes(el))).toBe(true);
  expect(b.every(el => a.includes(el))).toBe(true);
}

describe('charts can be grouped in several independent groups', () => {
  it('should return the right list of graph in the same group', () => {
    const charts =
      createChartsWithOptions({
        chart: {
          type: 'line',
          id: 'id0',
        },
        series: [
        ],
      }, {
        chart: {
          type: 'line',
          id: 'id1',
          group: 'group0',
        },
        series: [
        ],
      }, {
        chart: {
          type: 'line',
          id: 'id2',
          group: 'group0',
        },
        series: [
        ],
      }, {
        chart: {
          type: 'line',
          id: 'id3',
          group: 'group1',
        },
        series: [
        ],
      }, {
        chart: {
          type: 'line',
          id: 'id4',
          group: 'group1',
        },
        series: [
        ],
      }
    )

    expectSameElements(charts[0].getGroupedCharts(), [])
    expectSameElements(charts[1].getGroupedCharts(), [charts[2]])
    expectSameElements(charts[2].getGroupedCharts(), [charts[1]])
    expectSameElements(charts[3].getGroupedCharts(), [charts[4]])
    expectSameElements(charts[4].getGroupedCharts(), [charts[3]])


    expectSameElements(charts[0].getSyncedCharts(), [charts[0]])
    expectSameElements(charts[1].getSyncedCharts(), [charts[1], charts[2]])
    expectSameElements(charts[2].getSyncedCharts(), [charts[2], charts[1]])
    expectSameElements(charts[3].getSyncedCharts(), [charts[4], charts[3]])
    expectSameElements(charts[4].getSyncedCharts(), [charts[3], charts[4]])
  })
})
