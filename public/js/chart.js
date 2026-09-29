//Manages all of the drawing done by d3.js

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import {pickGlyph, slopeFor, functionPoints, colorFor} from './glyphs.js'

//Size of area
const WIDTH  = 800,
      HEIGHT = 500,
      MARGIN = {top: 20, right: 20, bottom: 40, left: 50}

//Runs once creating the svg and an object for redrawing the chart with drawChart
export const setupChart = function(selector) {
  const svg = d3.select(selector).append('svg')
    .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)

  //Keeps everything in bounds of the screen
  svg.append('clipPath')
    .attr('id', 'plot-clip')
    .append('rect')
    .attr('x', MARGIN.left)
    .attr('y', MARGIN.top)
    .attr('width', WIDTH - MARGIN.left - MARGIN.right)
    .attr('height', HEIGHT - MARGIN.top - MARGIN.bottom)

  const marks = svg.append('g')
    .attr('class', 'marks')
    .attr('clip-path', 'url(#plot-clip)')

  //Longitude
  const xAxis = svg.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0, ${HEIGHT - MARGIN.bottom})`)

  //Latitude
  const yAxis = svg.append('g')
    .attr('class', 'axis y-axis')
    .attr('transform', `translate(${MARGIN.left}, 0)`)

  const x = d3.scaleLinear().range([MARGIN.left, WIDTH - MARGIN.right])
  const y = d3.scaleLinear().range([HEIGHT - MARGIN.bottom, MARGIN.top])

  //Turns [lon, lat] into a d string
  const line = d3.line()
    .defined(point => Number.isFinite(point[1]))
    .x(point => x(point[0]))
    .y(point => y(point[1]))

  return {svg, marks, xAxis, yAxis, x, y, line}
}

//Runs of every update setting up domain, axes, and marks for functions
export const drawChart = function(chart, rows, settings) {
  chart.x.domain([settings.lonMin, settings.lonMax])
  chart.y.domain([settings.latMin, settings.latMax])

  chart.xAxis.call(d3.axisBottom(chart.x))
  chart.yAxis.call(d3.axisLeft(chart.y))

  chart.marks.selectAll('path')
    .data(rows, row => row.crimeId)
    .join('path')
    .attr('d', (row, index) => markPath(row, index, chart))
    .attr('fill', 'none')
    .attr('stroke', row => colorFor(row.crimeId))
    .on('pointerenter pointermove', showTooltip)
    .on('pointerleave', hideTooltip)
}

//Creates the d string for the crime's function
export const markPath = function(row, index, chart) {
  const glyph = pickGlyph(row.lsoaCode)
  const points = functionPoints(glyph.name, slopeFor(index, row.crimeId), row.lon, row.lat, chart.x.domain(), chart.y.domain())

  return chart.line(points)
}

//Shows the crime's details next to the cursor
export const showTooltip = function(event, row) {
  const tooltip = document.querySelector('#tooltip')

  tooltip.innerHTML = ''
  const lines = [
    row.crimeType,
    'LSOA: ' + row.lsoaCode,
    'Location: ' + row.lon.toFixed(4) + ', ' + row.lat.toFixed(4)
  ]

  lines.forEach(text => {
    const div = document.createElement('div')
    div.textContent = text
    tooltip.append(div)
  })

  //Offsets the tooltip isn't shown under the cursor
  tooltip.style.left = (event.clientX + 12) + 'px'
  tooltip.style.top = (event.clientY + 12) + 'px'
  tooltip.hidden = false
}

export const hideTooltip = function() {
  document.querySelector('#tooltip').hidden = true
}
