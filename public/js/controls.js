//Handles the settings of the site, when the user changes a setting this is what sees it and updates accordingly

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'

//Sets up the controls for every input the user has access to
export const setupControls = function(onFilterChange, onFileChange) {
  const fileSelect = document.querySelector('#crime-file')
  fileSelect.addEventListener('change', function() {
    onFileChange(fileSelect.value)
  })

  const crimeSelect = document.querySelector('#filter-crime-type')
  crimeSelect.addEventListener('change', function() {
    onFilterChange()
  })

  const sliders = ['lon-min', 'lon-max', 'lat-min', 'lat-max']

  sliders.forEach(id => {
    const sliderSet = document.querySelector('#' + id)
    sliderSet.addEventListener('input', function() {
      document.querySelector('#' + id + '-output').textContent = sliderSet.value
      onFilterChange()
    })
  })
}

//Returns the current controls as a settings object
export const readControls = function() {
  return {
    file: document.querySelector('#crime-file').value,
    crimeType: document.querySelector('#filter-crime-type').value,
    lonMin: Number(document.querySelector('#lon-min').value),
    lonMax: Number(document.querySelector('#lon-max').value),
    latMin: Number(document.querySelector('#lat-min').value),
    latMax: Number(document.querySelector('#lat-max').value)
  }
}

//Adds the files in the array to the list of options for the user to pick from in the form of an <option>
export const fillFileOptions = function(files) {
  files.forEach(entry => {
    const option = document.createElement('option')

    //Setting the option values; the URL and the name
    option.value = entry.file
    option.textContent = entry.label

    //Adds it to the file options
    document.querySelector('#crime-file').append(option)
  });
}

//Default crime file selector
export const selectFile = function(file) {
  document.querySelector('#crime-file').value = file
}

//Clears selection of crime types, if any, and adds the unique types found in the file to the list
export const fillCrimeTypeOptions = function(rows) {
  //Empties the selections
  const selection = document.querySelector('#filter-crime-type')
  selection.innerHTML = ''

  //Preselects all
  const allOption = document.createElement('option')
  allOption.value = 'all'
  allOption.textContent = 'All'
  selection.append(allOption)

  //Adds the unique crime types
  const types = rows.map(row => row.crimeType)
  const uniqueTypes = new Set(types)

  uniqueTypes.forEach(element => {
    const option = document.createElement('option')

    option.value = element
    option.textContent = element

    selection.append(option)
  })
}

const setSlider = function(id, min, max, value) {
  const slider = document.querySelector('#' + id)
  slider.min = min
  slider.max = max
  slider.value = value
  document.querySelector('#' + id + '-output').textContent = slider.value
}

//Sets the sliders to the min/max of the loaded file's longitude and latitude
export const setLocationBounds = function(rows) {
  //Getting the min/max pairs
  const mmLon = d3.extent(rows, row => row.lon)
  const mmLat = d3.extent(rows, row => row.lat)

  //Longitude slider
  setSlider('lon-min', mmLon[0], mmLon[1], mmLon[0])
  setSlider('lon-max', mmLon[0], mmLon[1], mmLon[1])

  //Latitude slider
  setSlider('lat-min', mmLat[0], mmLat[1], mmLat[0])
  setSlider('lat-max', mmLat[0], mmLat[1], mmLat[1])
}
