const { URLSearchParams } = require("url");

const BASE_URL = "https://appsl.mardelplata.gob.ar/app_cuando_llega/";
const AJAX_ENDPOINT = new URL("webWS.php", BASE_URL).toString();

const COLECTIVOS = {
  "563_puerto_a_b": {
    linea_id: "120",
    linea_nombre: "563 - A-B Puerto",
    parada_id: "P3853",
    destino: "Puerto (ida)",
  },
  "563_camet_a_b": {
    linea_id: "120",
    linea_nombre: "563 - A-B Camet",
    parada_id: "P2053",
    destino: "Camet (ida)",
  },
  "720_chapa": {
    linea_id: "344",
    linea_nombre: "720 - Por Chapa",
    parada_id: "29V",
    destino: "Batan",
  },
  "720_parque": {
    linea_id: "344",
    linea_nombre: "720 - Por Parque",
    parada_id: "35",
    destino: "Centro",
  },
  "542_regional": {
    linea_id: "108",
    linea_nombre: "542 - A Regional",
    parada_id: "P2053",
    destino: "Regional (ida)",
  },
  "542_2abril": {
    linea_id: "108",
    linea_nombre: "542 - B 2 Abril",
    parada_id: "P3853",
    destino: "2 de Abril (vuelta)",
  },
  "525_p_hermoso": {
    linea_id: "103",
    linea_nombre: "525 - P. HERMOSO",
    parada_id: "P2342",
    destino: "P.HERMOSO (ida)",
  },
  "525_centro": {
    linea_id: "103",
    linea_nombre: "525 - Centro",
    parada_id: "P11444",
    destino: "Centro (vuelta)",
  },
  "543_camet": {
    linea_id: "109",
    linea_nombre: "543 - Camet",
    parada_id: "P2336",
    destino: "Camet (ida)",
  },
  "543_regional": {
    linea_id: "103",
    linea_nombre: "525 - Regional",
    parada_id: "P2338",
    destino: "Regional (vuelta)",
  },
};

async function hacerConsultaAjax(linea_id, parada_id, destino) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const headers = {
    "X-Requested-With": "XMLHttpRequest",
    Origin: BASE_URL,
    Referer: BASE_URL,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  };

  const formBody = new URLSearchParams({
    accion: "RecuperarProximosArribosW",
    identificadorParada: parada_id,
    codigoLineaParada: linea_id,
    desParada: destino,
  }).toString();

  try {
    const res = await fetch(AJAX_ENDPOINT, {
      method: "POST",
      headers,
      body: formBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { error: `Error HTTP ${res.status}` };
    }

    try {
      const json = await res.json();
      return json;
    } catch {
      return { error: "Respuesta no es JSON válido" };
    }
  } catch (e) {
    const msg =
      e.name === "AbortError" ? "Error de conexión: timeout" : `Error de conexión: ${e.message}`;
    return { error: msg };
  }
}

function procesarResultados(resultado) {
  if (resultado?.error) return { arribos: null, error: resultado.error };

  if (resultado?.CodigoEstado === -1) {
    return { arribos: [], error: "Sin unidades" };
  }
  if ((resultado?.CodigoEstado ?? 0) !== 0) {
    const error_msg = resultado?.error || "Error en respuesta del servidor";
    return { arribos: null, error: `Error del servidor: ${error_msg}` };
  }

  const ahora = new Date();
  const hh = String(ahora.getHours()).padStart(2, "0");
  const mm = String(ahora.getMinutes()).padStart(2, "0");
  const ss = String(ahora.getSeconds()).padStart(2, "0");
  const actualizado = `${hh}:${mm}:${ss}`;

  const arribos = Array.isArray(resultado?.arribos)
    ? resultado.arribos.map((u) => ({
        tiempo: u?.Arribo ?? "Sin estimación",
        ramal: u?.DescripcionCortaBandera ?? "Sin ramal",
        actualizado,
      }))
    : [];

  return { arribos, error: null };
}

async function obtenerDatosColectivos() {
  const resultados_finales = {};
  const entradas = Object.entries(COLECTIVOS);

  const respuestas = await Promise.all(
    entradas.map(([_, datos]) =>
      hacerConsultaAjax(datos.linea_id, datos.parada_id, datos.destino)
    )
  );

  respuestas.forEach((respuesta, idx) => {
    const [colectivo_id, datos] = entradas[idx];
    const { arribos, error } = procesarResultados(respuesta);

    resultados_finales[colectivo_id] = {
      linea: datos.linea_nombre,
      destino: datos.destino,
      arribos: arribos || [],
      error,
    };
  });

  return resultados_finales;
}

module.exports = { obtenerDatosColectivos };

if (require.main === module) {
  obtenerDatosColectivos()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
