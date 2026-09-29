//Functions for cleaning and loading the data used in the program

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'

//Fetches the file manifest for the data
export const loadFileList = async function(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Could not load file manifest: ' + response.status)
  }

  const jsonResponse = await response.json()

  return jsonResponse
}

//Fetches csv, cleans the data (removes entries with missing coords), and returns the cleaned array
export const loadData = async function(url) {
  //d3.csv() fetches and parses the file at URL
  const response = await d3.csv(url)

  const fData = response.filter(entry => {
    //Skips crimes with no location or no LSOA code (the LSOA code picks the crime's function)
    if (entry.Longitude !== '' && entry['LSOA code'] !== '') {
      return true
    }
    else {
      return false
    }
  })

  return fData.map(cleanRow)
}

//Takes a csv row and turns it into an object with only relevant data for the program to use
export const cleanRow = function(raw) {
  return {
    crimeId: raw['Crime ID'],
    lsoaCode: raw['LSOA code'],
    crimeType: raw['Crime type'],
    lon: Number(raw['Longitude']),
    lat: Number(raw['Latitude'])
  }
}

//Filters for the entries that match the settings set by the user in the controls
export const filterRows = function(rows, settings) {
  const filteredRows = rows.filter(entry => {
    if (((settings.lonMin <= entry.lon) && (entry.lon <= settings.lonMax)) && ((settings.latMin <= entry.lat) && (entry.lat <= settings.latMax))) {
      if (entry.crimeType === settings.crimeType || settings.crimeType === 'all') {
        return true
      }
    }
  })

  return filteredRows
}

//Limits the number of functions drawn
export const capRows = function(rows, max) {
  return rows.slice(0, max)
}
