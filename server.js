// IMPORTANT: you must run `npm install` in the directory for this assignment
// to install express if you're testing this on your local machine.
// On Render, make sure `npm install` is your build command.

const express = require('express'),
      app = express(),
      dir = 'public',
      port = 3000

//Handles routing for every file on the site
app.use(express.static(dir))

//Catch for files that don't exist
app.use(function(request, response) {
  response.status(404).send('404 Error: File Not Found')
})

//Console message to show site is listening to a port
app.listen(process.env.PORT || port, function() {
  console.log('Listening on port ' + (process.env.PORT || port))
})
