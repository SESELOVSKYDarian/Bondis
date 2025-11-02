const axios = require("axios");
const { obtenerDatosColectivos } = require("../proyecto");

const API_KEY = "a1c0d15e5492e5e3d1b3a1ff478210fe";
const LAT = "-38.0055";
const LON = "-57.5426";

async function obtenerClima() {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;

  try {
    const response = await axios.get(weatherUrl, { timeout: 10_000 });
    const data = response.data;

    if (!data || !data.main || !data.weather) {
      return { error: "Datos de clima inválidos" };
    }

    return {
      temperature: data.main.temp ?? "N/A",
      summary: data.weather?.[0]?.description ?? "N/A",
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
