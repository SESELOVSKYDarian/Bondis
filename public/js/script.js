const contenedor = document.getElementById('contenedor-colectivos');
const clock = document.getElementById('clock');
const weather = document.getElementById('weather');

function formatearDestino(destino) {
  if (!destino) return "";
  destino = destino.replace(/\(ida\)|\(vuelta\)/gi, "").trim();
  destino = destino.toUpperCase();
  if (!destino.startsWith("A ") && !destino.startsWith("AL ")) {
    if (["PUERTO"].includes(destino)) destino = "AL " + destino;
    else destino = "A " + destino;
  }
  return destino;
}

async function obtenerDatos() {
  try {
    const response = await fetch('/api/datos?ts=' + Date.now());
    if (!response.ok) {
      console.warn('Error al obtener datos:', response.status);
      return {};
    }

    const data = await response.json();
    if (data.error) {
      console.warn('Error en datos recibidos:', data.error);
      return {};
    }

    return data;
  } catch (error) {
    console.error('Error llamando API:', error);
    return {};
  }
}

async function loadData() {
  try {
    const data = await obtenerDatos();
    const colectivosData = data.colectivos || {};
    const climaData = {
      time: data.time,
      weather: data.weather,
    };

    if ((Object.keys(colectivosData).length === 0) && (!climaData.time && !climaData.weather)) {
      contenedor.innerHTML = '<p>Error al cargar la información. Intenta más tarde.</p>';
      if (weather) weather.textContent = 'Clima: error';
      if (clock) clock.textContent = 'Hora: --:--';
      return;
    }

    if (clock) {
      clock.textContent = `Hora: ${climaData.time ?? '--:--'}`;
    }

    if (weather) {
      const w = climaData.weather;
      if (w && !w.error) {
        const resumen = w.summary ? ` (${w.summary})` : '';
        weather.textContent = `Clima: ${w.temperature}°C${resumen}`;
      } else {
        weather.textContent = 'Clima: error';
      }
    }

    contenedor.innerHTML = `
      <div class="columna"></div>
      <div class="columna"></div>
      <div class="columna"></div>
    `;
    const columnas = contenedor.querySelectorAll('.columna');

    const BLOQUES = [
      { nombre: "563 A", clase: "btn-563", claves: ["563_camet_a_b", "563_puerto_a_b"], dir: "A" },
      { nombre: "563 B", clase: "btn-563", claves: ["563_camet_a_b", "563_puerto_a_b"], dir: "B" },
      { nombre: "720", clase: "btn-720", claves: ["720_chapa", "720_parque"] },
      { nombre: "542", clase: "btn-542", claves: ["542_regional", "542_2abril"] },
      { nombre: "525", clase: "btn-525", claves: ["525_p_hermoso", "525_centro"] },
      { nombre: "543", clase: "btn-543", claves: ["543_camet", "543_regional"] }
    ];

    BLOQUES.forEach((bloque, index) => {
      let html = "";
      const div = document.createElement('div');
      div.className = 'linea-bondi';
      let esProximo = false;

      html += `<button class="linea-btn ${bloque.clase}">${bloque.nombre}</button>`;
      html += `<div class="destinos">`;

      bloque.claves.forEach(clave => {
        const colectivo = colectivosData[clave];
        if (!colectivo) return;

        const destinoLimpio = formatearDestino(colectivo.destino);
        let tiempoTexto = "Sin datos";

        if (colectivo.error) {
          tiempoTexto = colectivo.error;
        } else if (colectivo.arribos && colectivo.arribos.length > 0) {
          let arr = colectivo.arribos;
          if (bloque.dir) {
            const re = new RegExp(`\\b${bloque.dir}\\b`, 'i');
            const filtrados = arr.filter(a => re.test(a.ramal));
            if (filtrados.length > 0) arr = filtrados;
          }
          tiempoTexto = arr[0].tiempo;
        }

        const m = tiempoTexto.match(/(\d+)\s*min/i);
        if ((m && parseInt(m[1], 10) <= 2) || tiempoTexto.trim().toLowerCase() === "arribando..") {
          esProximo = true;
        }

        html += `
          <div class="destino-fila">
            <div class="destino-nombre">${destinoLimpio}</div>
            <div class="destino-tiempo">${tiempoTexto}</div>
          </div>
        `;
      });

      html += `</div>`;
      if (esProximo) div.classList.add("proximo");
      div.innerHTML = html;

      const colIndex = Math.floor(index / 2);
      columnas[colIndex].appendChild(div);
    });

  } catch (error) {
    console.error('Error cargando datos:', error);
    contenedor.innerHTML = '<p>Error al cargar la información. Intenta más tarde.</p>';
    if (weather) weather.textContent = 'Clima: error';
    if (clock) clock.textContent = 'Hora: --:--';
  }
}

window.addEventListener('load', async () => {
  await loadData();
  setInterval(loadData, 40000);
});
