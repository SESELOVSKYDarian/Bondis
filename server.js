const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const datosHandler = require("./api/datos");
app.all("/api/datos", (req, res) => {
  datosHandler(req, res);
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
}
