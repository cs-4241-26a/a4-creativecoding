//Converts a crime and its data into the math for it to be drawn

//Math functions that a crime can be represented as
export const FUNCTIONS = {
  sin:    x => Math.sin(x),
  cos:    x => Math.cos(x),
  tan:    x => Math.tan(x),
  log:    x => Math.log10(x),
  ln:     x => Math.log(x),
  square: x => x * x,
  cube:   x => x * x * x
}

//How many points are drawn on a curve
const POINTS = 200
//Width of the screen
const X_UNITS = 8
//How tall a curve can be
const HEIGHT_SHARE = 0.5
//Maximum value
const MAX_VALUE = 10

//No crime id color
const NO_ID_COLOR = 'gray'

//Turns text into hash string
export const hashString = function(text) {
  let hash = 2166136261

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  //Result into a whole positive number
  return hash >>> 0
}

//Uses the LSOA code as a seed to pick one function
export const pickGlyph = function(lsoaCode) {
  const names = Object.keys(FUNCTIONS)

  return {name: names[hashString(lsoaCode) % names.length]}
}

//Generates a slope from index and sign from crime id
export const slopeFor = function(index, crimeId) {
  const size = (index % 10) + 1,
        sign = hashString(crimeId) % 2 === 0 ? 1 : -1

  return size * sign
}

//Plots the points of the function
export const functionPoints = function(name, slope, lon, lat, xDomain, yDomain) {
  const fn     = FUNCTIONS[name],
        xSpan  = xDomain[1] - xDomain[0],
        ySpan  = yDomain[1] - yDomain[0],
        height = (slope / 10) * HEIGHT_SHARE * ySpan,
        points = []

  for (let i = 0; i <= POINTS; i++) {
    const x     = xDomain[0] + (i / POINTS) * xSpan,
          value = fn((x - lon) / xSpan * X_UNITS)

    //Handles negative numbers with log, ln, and tan
    const y = Number.isFinite(value) && Math.abs(value) <= MAX_VALUE ? lat + value * height : NaN

    points.push([x, y])
  }

  return points
}

//Turns a crime ID into a color with golden ratio hue generation
export const colorFor = function(crimeId) {
  if (crimeId === '') {
    return NO_ID_COLOR
  }

  const hue = (hashString(crimeId) * 0.618033988749895) % 1 * 360

  return 'hsl(' + hue + ', 70%, 60%)'
}
