const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", function (req, res) {
	res.sendFile(__dirname + "/public/index.html");
});

app.listen(process.env.PORT || 3000);
