//Loads and updates data, draws the chart, and starts the site

import {loadFileList, loadData, filterRows, capRows} from './data.js'
import {setupChart, drawChart} from './chart.js'
import {setupControls, readControls, fillFileOptions, selectFile, fillCrimeTypeOptions, setLocationBounds} from './controls.js'

//The directory where the data is stored
const DATA_URL = 'data/UK_Crime_Data/'

//List of every data file
const MANIFEST_URL = DATA_URL + 'files.json'

//Entry cap
const MAX_MARKS = 350

let allRows = []
let chart = null

//Updates/draws the chart from reading the controls and rows
const update = function() {
  const settings = readControls(),
        rows     = capRows(filterRows(allRows, settings), MAX_MARKS)

  drawChart(chart, rows, settings)
}

//Determines the random file shown at startup
const randomFile = function(files) {
  const ranFileIndex = Math.floor(Math.random() * files.length)
  return files[ranFileIndex].file
}

//Loads crime data, resets controls, and updates the site
const loadDataset = async function(file) {
  allRows = await loadData(DATA_URL + file)
  //Resets filters for new dataset
  fillCrimeTypeOptions(allRows)
  setLocationBounds(allRows)
  update()
}

//Shows the help menu
const setupHelp = function() {
  const dialog = document.querySelector('#help-dialog')

  document.querySelector('#help-button').onclick = function() {
    dialog.showModal()
  }

  document.querySelector('#help-close').onclick = function() {
    dialog.close()
  }

  dialog.showModal()
}

const start = async function() {
  setupHelp()

  const fileList = await loadFileList(MANIFEST_URL)
  const startFile = randomFile(fileList)

  //File selection
  fillFileOptions(fileList)
  //Selects the random file
  selectFile(startFile)
  
  chart = setupChart('#chart')

  setupControls(update, loadDataset)

  loadDataset(startFile)
}

start()
