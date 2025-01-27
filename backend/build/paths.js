const fs = require("fs");


/** Parses package.json */
const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

/** Src dir */
const sourcesRoot = "src/" + pkg.name + "/";

/** "Main" static dir */
const staticRoot = sourcesRoot + "static/";


/**
 * Application path configuration for use in frontend scripts
 */
module.exports = {
  // Path to the scss (sources) directory
  scssSrcDir: sourcesRoot + "scss/",

  // Path to the (transpiled) js directory
  jsDir: staticRoot + "bundles/"
};