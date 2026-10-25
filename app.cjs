// cPanel "Setup Node.js App" startup file. Passenger loads startup files with
// require(), which cannot load the ESM build directly, so hand off to it here.
import("./dist/server.js").catch((error) => {
  console.error(error);
  process.exit(1);
});
