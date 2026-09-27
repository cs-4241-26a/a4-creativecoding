//behold, the most complex server code you have ever seen!

const express = require('express') //for express
const app = express()

app.use(express.static('public')) //send files in public dir

app.listen(3000 || process.env.PORT) //port 3000