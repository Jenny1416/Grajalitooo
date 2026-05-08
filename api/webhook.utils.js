function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizarClave(texto) {
  return normalizar(texto).replace(/\s+/g, "");
}

function esMismoTexto(a, b) {
  return normalizar(a) === normalizar(b);
}

function desnormalizarVino(clave) {
  // Mínimo para que "cabernetreserva" -> "CabernetReserva"
  // y "chardonnaypremium" -> "ChardonnayPremium"
  const s = String(clave || "").trim();
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function desnormalizarBodega(clave) {
  const s = String(clave || "").trim();
  const n = normalizarClave(s);
  const map = { casagrajales: "Casa Grajales", bodegaandes: "Bodega Andes" };
  if (map[n]) return map[n];
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function elegir(opciones) {
  if (!Array.isArray(opciones) || opciones.length === 0) return "";
  const idx = Math.floor(Math.random() * opciones.length);
  return opciones[idx];
}

function formatearLista(items) {
  const xs = (items || []).filter(Boolean);
  if (xs.length === 0) return "";
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} y ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

function mencionar(valor, formatter, fallback) {
  return valor ? formatter(valor) : fallback;
}

function resolverTipoCanonico(texto) {
  const n = normalizar(texto);
  if (!n) return "";
  if (n.includes("tinto")) return "Vino Tinto";
  if (n.includes("blanco")) return "Vino Blanco";
  if (n.includes("rosado") || n.includes("rose")) return "Vino Rosado";
  return "";
}

function etiquetaTipoCanonico(tipoCanonico) {
  if (tipoCanonico === "Vino Tinto") return "el vino tinto";
  if (tipoCanonico === "Vino Blanco") return "el vino blanco";
  if (tipoCanonico === "Vino Rosado") return "el vino rosado";
  return "";
}

function resolverPerfilCanonico(texto) {
  const n = normalizar(texto);
  if (!n) return "";
  if (n.includes("tanico")) return "Tánico";
  if (n.includes("acido")) return "Ácido";
  if (n.includes("afrutado")) return "Afrutado";
  if (n.includes("seco")) return "Seco";
  return "";
}

function resolverCategoriaMaridaje(alimentoParam) {
  const map = {
    pescado: "Pescado",
    mariscos: "Mariscos",
    carneroja: "Carne Roja",
    pasta: "Pasta"
  };
  return map[normalizarClave(alimentoParam)] || "";
}

function normalizarRegion(valor) {
  const n = normalizar(valor);
  if (!n) return "";
  const aliases = [
    ["carib", "caribe"],
    ["pacific", "pacifica"],
    ["andin", "andina"],
    ["amaz", "amazonica"],
    ["insul", "insular"],
    ["orino", "orinoquia"]
  ];
  const match = aliases.find(([needle]) => n.includes(needle));
  if (match) return match[1];
  return "";
}

function capitalizar(texto) {
  const s = String(texto || "").trim();
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

/** Empareja texto del usuario/param con las llaves de `red.vinos` (útiles cuando el vino sale en la query). */
function resolverClaveVinoCatalogo(redVinos, { textoParamVino, textoExtra, queryTexto }) {
  const rawVin = String(textoParamVino || "").trim();
  const extra = String(textoExtra || "").trim();
  const qText = String(queryTexto || "").trim();

  const fusionSinEsp = normalizarClave(
    `${normalizar(rawVin)} ${normalizar(extra)} ${normalizar(qText)}`
  );

  const keysSorted = Object.keys(redVinos).sort((a, b) => b.length - a.length);

  let clave = normalizarClave(rawVin);
  const extraPrimeraPalabra = normalizarClave(extra.split(/\s+/).filter(Boolean)[0] || "");

  if (!clave || !redVinos[clave]) {
    clave =
      extraPrimeraPalabra && redVinos[extraPrimeraPalabra] ? extraPrimeraPalabra : "";
  }

  if (!clave || !redVinos[clave]) {
    let hallada = "";
    if (fusionSinEsp) {
      for (const kk of keysSorted) {
        if (kk && fusionSinEsp.includes(kk)) {
          hallada = kk;
          break;
        }
      }
    }
    clave = hallada;
  }

  if (!clave || !redVinos[clave]) {
    return { clave: "", etiquetaVin: rawVin || extra || "" };
  }

  const bonito = desnormalizarVino(clave);
  const etiquetaVin = rawVin && normalizarClave(rawVin) === clave ? rawVin : bonito;
  return { clave, etiquetaVin };
}

function dedupeNombres(items) {
  const vistos = new Set();
  const out = [];
  for (const it of items || []) {
    const key = normalizar(it);
    if (!key || vistos.has(key)) continue;
    vistos.add(key);
    out.push(it);
  }
  return out;
}

function buscarBodegasPorVino(redBodegas, vinoClave) {
  const objetivo = normalizarClave(vinoClave);
  if (!objetivo) return [];
  return Object.entries(redBodegas || {})
    .filter(([, b]) =>
      (b?.vinos || []).some((v) => normalizarClave(v) === objetivo)
    )
    .map(([k]) => k);
}

module.exports = {
  normalizar,
  normalizarClave,
  esMismoTexto,
  desnormalizarVino,
  desnormalizarBodega,
  elegir,
  formatearLista,
  mencionar,
  resolverTipoCanonico,
  etiquetaTipoCanonico,
  resolverPerfilCanonico,
  resolverCategoriaMaridaje,
  normalizarRegion,
  capitalizar,
  resolverClaveVinoCatalogo,
  dedupeNombres,
  buscarBodegasPorVino
};
