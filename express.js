const express = require("express");

const app = express();

app.use("/node_modules", express.static("./node_modules"));

app.use(express.static("./client"));

app.listen(3000, () => {
    console.log("http://localhost:3000");
});
