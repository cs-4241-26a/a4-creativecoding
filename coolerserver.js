const express = require('express'),
      app = express(),
      dreams = []

app.use( express.static( 'public' ) )
app.use( express.static( 'views'  ) )
app.use( express.json() )

app.post( '/submit', (req, res) => {
  let i = 0
  let modified = false
  for (let item of dreams) {
    if (item.name == req.body.delete) {
      dreams.splice(i, 1);
    }
    if (item.name == req.body.modify) {
      dreams[i] = req.body;
      modified = true
    }
    i = i + 1
  }
  if (modified == false) {
    dreams.push(req.body)
  }
  res.writeHead( 200, { 'Content-Type': 'application/json' })
  res.end( JSON.stringify( dreams ) )
})

app.post( '/debug', (req, res) => {
  console.log(req.body.message)
})

app.listen( process.env.PORT || 3000 )