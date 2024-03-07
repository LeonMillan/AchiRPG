const path = require("path");

module.exports = {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "ArchiLib.js",
    library: {
      type: "window",
      name: "ArchiLib",
    },
  },
};
