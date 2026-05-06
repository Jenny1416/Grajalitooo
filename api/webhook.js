module.exports = (req, res) => {

  const body = req.body || {};

  const intent =
    body?.queryResult?.intent?.displayName || "";

  const params =
    body?.queryResult?.parameters || {};

  const alimento = normalizar(
    params.alimento || ""
  );

  const vino = normalizar(
    params.vino || ""
  );

  const bodega = normalizar(
    params.bodega || ""
  );

  const red = {

    alimentos: {

      "salmón": "Pescado",
      "salmon": "Pescado",
      "trucha": "Pescado",
      "pescado": "Pescado",

      "mariscos": "Mariscos",
      "langostinos": "Mariscos",
      "camarones": "Mariscos",

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

        descripcion:
          "un vino blanco fresco y ácido ideal para pescados"

      },

      "Mariscos": {

        vino: "ChardonnayPremium",

        descripcion:
          "un vino blanco ligero que acompaña muy bien mariscos"

      },

      "Carne Roja": {

        vino: "CabernetReserva",

        descripcion:
          "un vino tinto tánico perfecto para carnes intensas"

      },

      "Pasta": {

        vino: "RoseGrajales",

        descripcion:
          "un vino rosado afrutado que combina bien con pasta"

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

        vinos: [
          "ChardonnayPremium",
          "RoseGrajales"
        ]

      },

      "bodegaandes": {

        vinos: [
          "CabernetReserva"
        ]

      }

    }

  };

  /* ===================================================== */
  /* MARIDAJE */
  /* ===================================================== */

  if (
    intent.includes("maridaje") ||
    intent.includes("recomendar")
  ) {

    const categoria =
      red.alimentos[alimento];

    if (!categoria) {

      return res.status(200).json({

        fulfillmentText:
          `No encontré una recomendación para ${params.alimento}.`

      });

    }

    const recomendacion =
      red.recomendaciones[categoria];

    return res.status(200).json({

      fulfillmentText:

        `Te recomiendo ${recomendacion.vino}, ${recomendacion.descripcion}.`

    });

  }

  /* ===================================================== */
  /* TIPO DE VINO */
  /* ===================================================== */

  if (
    intent.includes("tipo.vino")
  ) {

    const info =
      red.vinos[vino];

    if (!info) {

      return res.status(200).json({

        fulfillmentText:
          `No encontré información sobre ${params.vino}.`

      });

    }

    return res.status(200).json({

      fulfillmentText:

        `${params.vino} es un ${info.tipo} elaborado con ${info.uva} y tiene un perfil ${info.perfil}.`

    });

  }

  /* ===================================================== */
  /* BODEGAS */
  /* ===================================================== */

  if (
    intent.includes("bodega")
  ) {

    const info =
      red.bodegas[bodega];

    if (!info) {

      return res.status(200).json({

        fulfillmentText:
          `No encontré información sobre ${params.bodega}.`

      });

    }

    return res.status(200).json({

      fulfillmentText:

        `${params.bodega} produce los vinos ${info.vinos.join(", ")}.`

    });

  }

  return res.status(200).json({

    fulfillmentText:
      "No encontré una relación adecuada en la red semántica."

  });

};

function normalizar(texto) {

  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}