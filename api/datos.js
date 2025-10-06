const { construirRespuesta } = require("../lib/datos");

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  if (typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }

  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(statusCode).json(payload);
    return;
  }

  res.statusCode = statusCode;
  if (typeof res.end === "function") {
    res.end(body);
  }
}

module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    sendJson(res, 405, { error: "Método no permitido" });
    return;
  }

  try {
    const data = await construirRespuesta();

    if (typeof res.setHeader === "function") {
      res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");
    }

    sendJson(res, 200, data);
  } catch (error) {
    sendJson(res, 500, { error: "Error interno del servidor" });
    console.error("Error generando datos", error);
  }
};
