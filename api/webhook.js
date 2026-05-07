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
            `No encontré la uva asociada a ${vinoRaw || "ese vino"}. ¿Puedes verificar el nombre?`,
            `Aún no tengo registrada la uva de ${vinoRaw || "ese vino"}. Prueba con CabernetReserva, ChardonnayPremium o RoseGrajales.`,
            `No veo información de la uva para ${vinoRaw || "ese vino"}. Dime el vino exacto y lo reviso.`
          ])
        });
      }

      return res.status(200).json({
        fulfillmentText: elegir([
          `${vinoRaw || "Ese vino"} está hecho de ${info.uva}.`,
          `La uva de ${vinoRaw || "ese vino"} es ${info.uva}.`,
          `${vinoRaw || "Ese vino"} se elabora con ${info.uva}.`
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
            `No encontré vinos hechos con ${uvaRaw || "esa uva"}. ¿La escribiste igual que en la red?`,
            `Por ahora no tengo vinos asociados a ${uvaRaw || "esa uva"}. Prueba con Cabernet Sauvignon o Chardonnay.`,
            `No veo vinos vinculados a ${uvaRaw || "esa uva"}. Si me dices otra uva, lo intento de nuevo.`
          ])
        });
      }

      const nombresBonitos = vinosHechosDe.map((v) => desnormalizarVino(v));

      return res.status(200).json({
        fulfillmentText: elegir([
          `Con ${uvaRaw || "esa uva"} se elaboran: ${formatearLista(nombresBonitos)}.`,
          `Los vinos que encontré hechos con ${uvaRaw || "esa uva"} son ${formatearLista(nombresBonitos)}.`,
          `En la red, ${uvaRaw || "esa uva"} aparece en estos vinos: ${formatearLista(nombresBonitos)}.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `Puedo responder dos cosas: (1) la uva de un vino y (2) qué vinos usan una uva. Ejemplos: "¿De qué uva está hecho CabernetReserva?" o "¿Qué vinos usan Chardonnay?"`,
        `¿Buscas la uva de un vino o los vinos de una uva? Prueba: "¿Cuál es la uva de RoseGrajales?" / "¿Qué vinos usan Cabernet Sauvignon?"`,
        `Dime un vino (CabernetReserva, ChardonnayPremium, RoseGrajales) o una uva (Cabernet Sauvignon, Chardonnay) y te contesto con la relación HECHO_DE.`
      ])
    });
  }

  if (intentNormalizado.includes("maridaje") || intentNormalizado.includes("recomendar")) {
    const categoria = red.alimentos[alimento];

    if (!categoria) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `No encontré una recomendación para "${alimentoRaw || params.alimento || "ese alimento"}". Prueba con salmón/pescado, mariscos, carne roja o pasta.`,
          `Aún no tengo esa comida en la red: "${alimentoRaw || params.alimento || "ese alimento"}". Puedo recomendar para pescado, mariscos, carne roja o pasta.`,
          `No identifiqué "${alimentoRaw || params.alimento || "ese alimento"}" como categoría conocida. ¿Te refieres a pescado, mariscos, carne roja o pasta?`
        ])
      });
    }

    const recomendacion = red.recomendaciones[categoria];

    return res.status(200).json({
      fulfillmentText: elegir([
        `Para ${alimentoRaw || params.alimento || "eso"} (categoría: ${categoria}), te sugiero ${recomendacion.vino}: ${recomendacion.descripcion}.`,
        `Buena elección. Con ${alimentoRaw || params.alimento || "eso"} suele funcionar ${recomendacion.vino}, porque es ${recomendacion.descripcion}.`,
        `Mi recomendación de maridaje para ${alimentoRaw || params.alimento || "eso"} es ${recomendacion.vino}. En la red está marcado como una opción ${recomendacion.descripcion}.`
      ])
    });
  }

  if (intentNormalizado.includes("tipo") && intentNormalizado.includes("vino")) {
    const info = red.vinos[vino];

    if (!info) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `No encontré información sobre "${vinoRaw || params.vino || "ese vino"}". ¿Quieres intentar con CabernetReserva, ChardonnayPremium o RoseGrajales?`,
          `Aún no tengo registrado "${vinoRaw || params.vino || "ese vino"}" en la red. Prueba con uno de los vinos disponibles.`,
          `No me aparece "${vinoRaw || params.vino || "ese vino"}". Si me lo escribes tal cual, lo vuelvo a buscar.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `${vinoRaw || params.vino || "Ese vino"} es un ${info.tipo}, hecho con ${info.uva}, de perfil ${info.perfil}.`,
        `En la red: ${vinoRaw || params.vino || "ese vino"} → ${info.tipo} → HECHO_DE ${info.uva} → perfil ${info.perfil}.`,
        `${vinoRaw || params.vino || "Ese vino"} pertenece a la categoría ${info.tipo}; se elabora con ${info.uva} y su perfil es ${info.perfil}.`
      ])
    });
  }

  if (intentNormalizado.includes("bodega")) {
    const info = red.bodegas[bodega];

    if (!info) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `No encontré información sobre "${bodegaRaw || params.bodega || "esa bodega"}". Prueba con Casa Grajales o Bodega Andes.`,
          `Aún no tengo registrada la bodega "${bodegaRaw || params.bodega || "esa bodega"}". ¿Te refieres a Casa Grajales o Bodega Andes?`,
          `No veo datos de "${bodegaRaw || params.bodega || "esa bodega"}" en la red. Dime el nombre exacto.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `${bodegaRaw || params.bodega || "Esa bodega"} produce: ${formatearLista(info.vinos)}.`,
        `Según la red, ${bodegaRaw || params.bodega || "esa bodega"} está vinculada a estos vinos: ${formatearLista(info.vinos)}.`,
        `En producción por bodega: ${bodegaRaw || params.bodega || "esa bodega"} → ${formatearLista(info.vinos)}.`
      ])
    });
  }

  return res.status(200).json({
    fulfillmentText: elegir([
      `No encontré una relación adecuada en la red semántica para esa consulta. (Intent: ${intent})`,
      `Aún no tengo cómo inferir eso con las relaciones actuales. Intent recibido: ${intent}`,
      `No pude conectar conceptos suficientes para responder. Intent: ${intent}`
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