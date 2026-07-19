// Compila src/app.jsx → app.js usando Babel standalone (lib/babel.min.js).
// Ejecutar con: node build.js  (o doble clic en build.bat)
// Solo hace falta correrlo después de editar src/app.jsx.
const fs = require("fs");
const path = require("path");
const Babel = require(path.join(__dirname, "lib", "babel.min.js"));

const src = fs.readFileSync(path.join(__dirname, "src", "app.jsx"), "utf8");
const out = Babel.transform(src, { presets: ["react"], compact: false }).code;
fs.writeFileSync(path.join(__dirname, "app.js"), out, "utf8");
console.log("OK: app.js generado (" + Math.round(out.length / 1024) + " KB)");
