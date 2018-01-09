var express = require("express");
var app = express();

app.use(express.static("./", {
    index: "examples/web.html"
}));

app.listen(3000, () => console.log('Example app listening on port 3000!'))
