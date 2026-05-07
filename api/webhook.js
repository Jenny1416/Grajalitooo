module.exports = (req, res) => {
  const body = req.body || {};

  const intent = body?.queryResult?.intent?.displayName || "";
  const intentNormalizado = normalizar(intent);

  const params = body?.queryResult?.parameters || {};

  const alimento = normalizar(params.alimento || params.Alimento || "");
  const vino = normalizar(params.vino || params.Vino || "");
  const bodega = normalizar(params.bodega || params.Bodega || "");
  const uva = normalizar(params.uva || params.Uva || params.uvA || params.UVA || "");

  const vinoRaw = String(params.vino || params.Vino || "").trim();
  const uvaRaw = String(params.uva || params.Uva || params.uvA || params.UVA || "").trim();
  const bodegaRaw = String(params.bodega || params.Bodega || "").trim();
  const alimentoRaw = String(params.alimento || params.Alimento || "").trim();

  const red = {
    alimentos: {
      "salmon": "Pescado",
      "salmón": "Pescado",
      "pescado": "Pescado",
      "trucha": "Pescado",

      "mariscos": "Mariscos",
      "camarones": "Mariscos",
      "langostinos": "Mariscos",

      "carne roja": "Carne Roja",
      "filete": "Carne Roja",
      "entrecot": "Carne Roja",
      "churrasco": "Carne Roja",

      "pasta": "Pasta",
      "lasaña": "Pasta"
    },

    recomendaciones: {
      "Pescado": {
        vino: "ChardonnayPremium",
        descripcion: "un vino blanco fresco y ácido ideal para pescados"
      },
      "Mariscos": {
        vino: "ChardonnayPremium",
        descripcion: "un vino blanco ligero que acompaña muy bien mariscos"
      },
      "Carne Roja": {
        vino: "CabernetReserva",
        descripcion: "un vino tinto tánico perfecto para carnes intensas"
      },
      "Pasta": {
        vino: "RoseGrajales",
        descripcion: "un vino rosado afrutado que combina bien con pasta"
      }
    },

    vinos: {
      "cabernetreserva": {
        tipo: "Vino Tinto",
        uva: "Cabernet Sauvignon",
        perfil: "Tánico"
      },
      "chardonnaypremium": {
        tipo: "Vino Blanco",
        uva: "Chardonnay",
        perfil: "Ácido"
      },
      "rosegrajales": {
        tipo: "Vino Rosado",
        uva: "Uva Rosada",
        perfil: "Afrutado"
      }
    },

    bodegas: {
      "casagrajales": {
        vinos: ["ChardonnayPremium", "RoseGrajales"]
      },
      "casa grajales": {
        vinos: ["ChardonnayPremium", "RoseGrajales"]
      },
      "bodegaandes": {
        vinos: ["CabernetReserva"]
      },
      "bodega andes": {
        vinos: ["CabernetReserva"]
      }
    }
  };

  // Intent: consultar.uva
  if (intentNormalizado.includes("consultar") && intentNormalizado.includes("uva")) {
    if (vino) {
      const info = red.vinos[vino];

      if (!info?.uva) {
        return res.status(200).json({
          fulfillmentText: elegir([
            `Mmm… revisé mi red y no encuentro la uva asociada a ${vinoRaw || "ese vino"}. ¿Me lo puedes escribir tal cual aparece?`,
            `Todavía no tengo registrada la uva de ${vinoRaw || "ese vino"}. Si quieres, prueba con CabernetReserva, ChardonnayPremium o RoseGrajales.`,
            `No me aparece la relación HECHO_DE para ${vinoRaw || "ese vino"}. ¿Cuál vino es exactamente?`
          ])
        });
      }

      return res.status(200).json({
        fulfillmentText: elegir([
          `Buen dato para empezar: ${vinoRaw || "ese vino"} está hecho con ${info.uva}. ¿Quieres que también te diga su tipo y perfil?`,
          `En mi red, ${vinoRaw || "ese vino"} se elabora con ${info.uva}. Si me dices con qué lo vas a acompañar, te sugiero maridaje.`,
          `La uva de ${vinoRaw || "ese vino"} es ${info.uva}. Si quieres, puedo contarte qué otros vinos comparten esa uva.`
        ])
      });
    }

    if (uva) {
      const vinosHechosDe = Object.entries(red.vinos)
        .filter(([, info]) => normalizar(info?.uva) === uva)
        .map(([key]) => key);

      if (vinosHechosDe.length === 0) {
        return res.status(200).json({
          fulfillmentText: elegir([
            `Busqué por ${uvaRaw || "esa uva"} y no encontré vinos asociados. ¿Te refieres a Cabernet Sauvignon o Chardonnay?`,
            `Por ahora mi red no tiene vinos hechos con ${uvaRaw || "esa uva"}. Si me dices otra uva, lo intento.`,
            `No encuentro coincidencias para ${uvaRaw || "esa uva"}. Ojo: ayuda escribirla tal cual (por ejemplo: "Cabernet Sauvignon").`
          ])
        });
      }

      const nombresBonitos = vinosHechosDe.map((v) => desnormalizarVino(v));

      return res.status(200).json({
        fulfillmentText: elegir([
          `Si te gusta la uva ${uvaRaw || "esa uva"}, te van a interesar estos vinos: ${formatearLista(nombresBonitos)}.`,
          `Listo, esto es lo que me da la red para ${uvaRaw || "esa uva"}: ${formatearLista(nombresBonitos)}. ¿Quieres que te describa alguno?`,
          `En mi red semántica, ${uvaRaw || "esa uva"} aparece conectada a: ${formatearLista(nombresBonitos)}.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `¡Claro! Puedo decirte la uva de un vino o, al revés, qué vinos se hacen con una uva. Ejemplos: "¿De qué uva está hecho CabernetReserva?" o "¿Qué vinos usan Chardonnay?"`,
        `Dime un vino (CabernetReserva, ChardonnayPremium, RoseGrajales) o una uva (Cabernet Sauvignon, Chardonnay) y lo conecto en la red para responderte.`,
        `¿Qué prefieres: empezar por el vino o por la uva? Con cualquiera puedo seguir el arco HECHO_DE.`
      ])
    });
  }

  if (intentNormalizado.includes("maridaje") || intentNormalizado.includes("recomendar")) {
    const categoria = red.alimentos[alimento];

    if (!categoria) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `Todavía no tengo "${alimentoRaw || params.alimento || "ese alimento"}" en mi red de comidas. ¿Te va bien si lo intentamos con pescado, mariscos, carne roja o pasta?`,
          `No reconozco "${alimentoRaw || params.alimento || "eso"}" como categoría en la red. Dame una pista: ¿es pescado, mariscos, carne roja o pasta?`,
          `Me faltó ese nodo de comida: "${alimentoRaw || params.alimento || "eso"}". Prueba con salmón/pescado, mariscos, carne roja o pasta y te recomiendo algo.`
        ])
      });
    }

    const recomendacion = red.recomendaciones[categoria];

    return res.status(200).json({
      fulfillmentText: elegir([
        `¡Vamos a maridar! Para ${alimentoRaw || params.alimento || "eso"}, mi apuesta es ${recomendacion.vino}: ${recomendacion.descripcion}.`,
        `Con ${alimentoRaw || params.alimento || "eso"} yo me iría por ${recomendacion.vino}. En la red encaja porque es ${recomendacion.descripcion}.`,
        `Si quieres una combinación fácil de acertar: ${recomendacion.vino}. Va muy bien con ${alimentoRaw || params.alimento || "eso"} porque es ${recomendacion.descripcion}.`
      ])
    });
  }

  if (intentNormalizado.includes("tipo") && intentNormalizado.includes("vino")) {
    const info = red.vinos[vino];

    if (!info) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `No me aparece "${vinoRaw || params.vino || "ese vino"}" en la red todavía. ¿Probamos con CabernetReserva, ChardonnayPremium o RoseGrajales?`,
          `Todavía no tengo a "${vinoRaw || params.vino || "ese vino"}" en mi lista. Dime otro vino y con gusto te cuento su tipo, uva y perfil.`,
          `No encuentro "${vinoRaw || params.vino || "ese vino"}". Si me lo escribes exacto, lo vuelvo a intentar.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `Te cuento: ${vinoRaw || params.vino || "ese vino"} es un ${info.tipo}. Se elabora con ${info.uva} y su perfil es ${info.perfil}.`,
        `En pocas palabras, ${vinoRaw || params.vino || "ese vino"} va por el lado ${info.perfil}: es ${info.tipo} hecho con ${info.uva}.`,
        `Según mi red: ${vinoRaw || params.vino || "ese vino"} es ${info.tipo}, HECHO_DE ${info.uva}, y con un perfil ${info.perfil}. ¿Quieres que te recomiende comida para acompañarlo?`
      ])
    });
  }

  if (intentNormalizado.includes("bodega")) {
    const info = red.bodegas[bodega];

    if (!info) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `No ubico "${bodegaRaw || params.bodega || "esa bodega"}" en mi red todavía. ¿Te refieres a Casa Grajales o Bodega Andes?`,
          `Mmm… esa bodega no me aparece: "${bodegaRaw || params.bodega || "esa bodega"}". Prueba con "Casa Grajales" o "Bodega Andes".`,
          `No tengo registrada la bodega "${bodegaRaw || params.bodega || "esa bodega"}". Si me das el nombre exacto, la busco de nuevo.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `¡Encontrada! ${bodegaRaw || params.bodega || "Esa bodega"} tiene estos vinos en la red: ${formatearLista(info.vinos)}.`,
        `Según mis conexiones, ${bodegaRaw || params.bodega || "esa bodega"} produce ${formatearLista(info.vinos)}. ¿Quieres saber de qué uva es alguno?`,
        `En mi red semántica, ${bodegaRaw || params.bodega || "esa bodega"} está conectada (PRODUCIDO_POR) con: ${formatearLista(info.vinos)}.`
      ])
    });
  }

  return res.status(200).json({
    fulfillmentText: elegir([
      `Me quedé sin un camino claro en la red para responder eso. ¿Me lo reformulas con vino/uva/comida/bodega? (Intent: ${intent})`,
      `Uff, aquí mi red no alcanza a inferir una respuesta. Si me dices un vino, una uva o una comida, lo conecto mejor. (Intent: ${intent})`,
      `No logré conectar los nodos necesarios para esa pregunta. Prueba preguntándome por maridaje, uva, tipo de vino o bodega. (Intent: ${intent})`
    ])
  });
};

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function desnormalizarVino(clave) {
  // Mínimo para que "cabernetreserva" -> "CabernetReserva"
  // y "chardonnaypremium" -> "ChardonnayPremium"
  const s = String(clave || "").trim();
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