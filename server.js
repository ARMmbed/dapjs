var path = require("path");
var exec = require("child_process").exec;
var express = require("express");
var app = express();
var port = "3000";

app.use(express.static("./", {
    index: "examples/daplink-flash/web.html"
}));

app.listen(port, () => {
    var url = `http://localhost:${port}`;
    console.log(`Server listening at ${url}`);

    var cmd = path.join(__dirname, "xdg-open");
    if (process.platform === "darwin") cmd = "open";
    else if (process.platform === "win32") cmd = `start ""`;

    exec(`${cmd} ${url}`);
});
