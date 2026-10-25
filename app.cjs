// cPanel "Setup Node.js App" startup file. Passenger loads startup files with
// require(), which cannot load the ESM build directly, so hand off to it here.
require("./dist/server.js");
