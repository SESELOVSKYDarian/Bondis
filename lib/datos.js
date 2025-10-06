const axios = require("axios");

const { obtenerDatosColectivos } = require("../proyecto");

const API_KEY = process.env.METEOSOURCE_KEY || "8ea3803heedp3nu53akbv9e93d0lo7kwzjf7w3w2";
const LAT = process.env.LATITUD || "-38.0055";
const LON = process.env.LONGITUD || "-57.5426";

async function obtenerClima() {
  const weatherUrl = `https://www.meteosource.com/api/v1/free/point?lat=${LAT}&lon=${LON}&sections=current&language=es&units=metric&timezone=auto&key=${API_KEY}`;

  try {
    const response = await axios.get(weatherUrl, { timeout: 10_000 });
    const current = response?.data?.current;
    if (!current) {
      return { error: "Datos de clima inválidos" };
    }

    return {
      temperature: current.temperature ?? "N/A",
      summary: current.summary ?? current.weather ?? "N/A",
    };
  } catch (error) {
    return { error: `Error API Clima: ${error.message}` };
  }
}

async function construirRespuesta() {
  const currentTime = new Date().toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour12: false,
  });

  const [colectivos, weather] = await Promise.all([
    obtenerDatosColectivos(),
    obtenerClima(),
  ]);

  return {
    time: currentTime,
    weather,
    colectivos,
    updated: Date.now(),
  };
}

module.exports = {
  construirRespuesta,
};
