/*
 * treemap-squarify.js - open source implementation of squarified treemaps
 *
 * Based on Treemap Squared 0.5 by Imran Ghory
 * https://github.com/imranghory/treemap-squared/
 *
 * Copyright (c) 2012 Imran Ghory (imranghory@gmail.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 *
 * Implementation of the squarify treemap algorithm described in:
 *
 * Bruls, Mark; Huizing, Kees; van Wijk, Jarke J. (2000), "Squarified treemaps"
 * in de Leeuw, W.; van Liere, R., Data Visualization 2000:
 * Proc. Joint Eurographics and IEEE TCVG Symp. on Visualization, Springer-Verlag, pp. 33-42.
 *
 */

function normalize(data, area) {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i]
  }
  const multiplier = area / sum
  const result = new Array(data.length)
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] * multiplier
  }
  return result
}

function calculateRatio(rowMin, rowMax, rowSum, length) {
  const lengthSq = length * length
  const sumSq = rowSum * rowSum
  return Math.max(
    (lengthSq * rowMax) / sumSq,
    sumSq / (lengthSq * rowMin)
  )
}

function improvesRatio(rowLen, rowMin, rowMax, rowSum, nextNode, length) {
  if (rowLen === 0) return true

  const currentRatio = calculateRatio(rowMin, rowMax, rowSum, length)
  const newRatio = calculateRatio(
    Math.min(rowMin, nextNode),
    Math.max(rowMax, nextNode),
    rowSum + nextNode,
    length
  )

  return currentRatio >= newRatio
}

function emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height) {
  if (width >= height) {
    const areaWidth = rowSum / height
    let subY = yoffset
    for (let i = 0; i < rowLen; i++) {
      const h = row[i] / areaWidth
      coords.push([xoffset, subY, xoffset + areaWidth, subY + h])
      subY += h
    }
  } else {
    const areaHeight = rowSum / width
    let subX = xoffset
    for (let i = 0; i < rowLen; i++) {
      const w = row[i] / areaHeight
      coords.push([subX, yoffset, subX + w, yoffset + areaHeight])
      subX += w
    }
  }
}

function squarify(data, xoffset, yoffset, width, height) {
  const coords = []
  const n = data.length
  if (n === 0) return coords

  const row = new Array(n)
  let rowLen = 0
  let rowSum = 0
  let rowMin = Infinity
  let rowMax = -Infinity

  let i = 0
  while (i < n) {
    const length = Math.min(width, height)
    const val = data[i]

    if (improvesRatio(rowLen, rowMin, rowMax, rowSum, val, length)) {
      row[rowLen] = val
      rowLen++
      rowSum += val
      if (val < rowMin) rowMin = val
      if (val > rowMax) rowMax = val
      i++
    } else {
      emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height)

      if (width >= height) {
        const areaWidth = rowSum / height
        xoffset += areaWidth
        width -= areaWidth
      } else {
        const areaHeight = rowSum / width
        yoffset += areaHeight
        height -= areaHeight
      }

      rowLen = 0
      rowSum = 0
      rowMin = Infinity
      rowMax = -Infinity
    }
  }

  if (rowLen > 0) {
    emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height)
  }

  return coords
}

function generate(data, width, height) {
  const n = data.length

  const sums = new Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    const series = data[i]
    for (let j = 0; j < series.length; j++) {
      s += series[j]
    }
    sums[i] = s
  }

  const seriesRects = squarify(
    normalize(sums, width * height),
    0, 0, width, height
  )

  const results = new Array(n)
  for (let i = 0; i < n; i++) {
    const rect = seriesRects[i]
    const rx = rect[0]
    const ry = rect[1]
    const rw = rect[2] - rx
    const rh = rect[3] - ry
    results[i] = squarify(
      normalize(data[i], rw * rh),
      rx, ry, rw, rh
    )
  }

  return results
}

export default { generate }
