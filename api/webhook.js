module.exports = (req, res) => {
  const body = req.body || {};

  const intent = body?.queryResult?.intent?.displayName || "";
  const intentNormalizado = normalizar(intent);

  const params = body?.queryResult?.parameters || {};

  const alimento = normalizar(params.alimento || params.Alimento || "");
  const vino = normalizar(params.vino || params.Vino || "");
  const bodega = normalizar(params.bodega || params.Bodega || "");
  const uva = normalizar(params.uva || params.Uva || params.uvA || params.UVA || "");

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
          fulfillmentText: `No encontré información sobre la uva de ${params.vino || "ese vino"}.`
        });
      }

      return res.status(200).json({
        fulfillmentText: `${params.vino || "Ese vino"} está hecho de ${info.uva}.`
      });
    }

    if (uva) {
      const vinosHechosDe = Object.entries(red.vinos)
        .filter(([, info]) => normalizar(info?.uva) === uva)
        .map(([key]) => key);

      if (vinosHechosDe.length === 0) {
        return res.status(200).json({
          fulfillmentText: `No encontré vinos hechos con ${params.uva || "esa uva"}.`
        });
      }

      // Intentamos mostrar nombres "bonitos" si tenemos alguno en bodegas/recomendaciones;
      // si no, devolvemos la clave (ya normalizada) como fallback.
      const nombresBonitos = vinosHechosDe.map((v) => {
        const match = Object.keys(red.vinos).find((k) => k === v);
        return match ? desnormalizarVino(match) : v;
      });

      return res.status(200).json({
        fulfillmentText: `Los vinos hechos con ${params.uva || "esa uva"} son: ${nombresBonitos.join(", ")}.`
      });
    }

    return res.status(200).json({
      fulfillmentText: `¿Quieres consultar la uva de un vino (por ejemplo: "¿De qué uva está hecho CabernetReserva?") o qué vinos usan una uva (por ejemplo: "¿Qué vinos usan Chardonnay?")?`
    });
  }

  if (intentNormalizado.includes("maridaje") || intentNormalizado.includes("recomendar")) {
    const categoria = red.alimentos[alimento];

    if (!categoria) {
      return res.status(200).json({
        fulfillmentText: `No encontré una recomendación para ${params.alimento}. Puedes preguntarme por salmón, pescado, mariscos, carne roja o pasta.`
      });
    }

    const recomendacion = red.recomendaciones[categoria];

    return res.status(200).json({
      fulfillmentText: `Te recomiendo ${recomendacion.vino}, ${recomendacion.descripcion}.`
    });
  }

  if (intentNormalizado.includes("tipo") && intentNormalizado.includes("vino")) {
    const info = red.vinos[vino];

    if (!info) {
      return res.status(200).json({
        fulfillmentText: `No encontré información sobre ${params.vino}.`
      });
    }

    return res.status(200).json({
      fulfillmentText: `${params.vino} es un ${info.tipo}, elaborado con ${info.uva} y con perfil ${info.perfil}.`
    });
  }

  if (intentNormalizado.includes("bodega")) {
    const info = red.bodegas[bodega];

    if (!info) {
      return res.status(200).json({
        fulfillmentText: `No encontré información sobre ${params.bodega}.`
      });
    }

    return res.status(200).json({
      fulfillmentText: `${params.bodega} produce los vinos ${info.vinos.join(", ")}.`
    });
  }

  return res.status(200).json({
    fulfillmentText: `No encontré una relación adecuada en la red semántica. Intent recibido: ${intent}`
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