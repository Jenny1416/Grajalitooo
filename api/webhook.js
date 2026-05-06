module.exports = (req, res) => {

  const body = req.body || {};

  const intent =
    body?.queryResult?.intent?.displayName || "";

  const params =
    body?.queryResult?.parameters || {};

  const alimento = normalizar(
    params.alimento ||
    params.Alimento ||
    params.food
  );

  const bodega = normalizar(
    params.bodega ||
    params.Bodega
  );

  const region = normalizar(
    params.region ||
    params.Region
  );

  const vino = normalizar(
    params.vino ||
    params.Vino
  );

  const redSemantica = {

    nodos: {

      vinos: {

        "cabernetreserva": {

          ES_UN: "Vino Tinto",

          HECHO_DE: "Cabernet Sauvignon",

          PRODUCIDO_POR: "BodegaAndes",

          TIENE_PERFIL: "Tánico"

        },

        "chardonnaypremium": {

          ES_UN: "Vino Blanco",

          HECHO_DE: "Chardonnay",

          PRODUCIDO_POR: "CasaGrajales",

          TIENE_PERFIL: "Ácido"

        },

        "rosegrajales": {

          ES_UN: "Vino Rosado",

          HECHO_DE: "Uva Rosada",

          PRODUCIDO_POR: "CasaGrajales",

          TIENE_PERFIL: "Afrutado"

        }

      },

      alimentos: {

        "salmón": {
          ES_UN: "Pescado"
        },

        "salmon": {
          ES_UN: "Pescado"
        },

        "trucha": {
          ES_UN: "Pescado"
        },

        "pescado": {
          ES_UN: "Pescado"
        },

        "mariscos": {
          ES_UN: "Mariscos"
        },

        "langostinos": {
          ES_UN: "Mariscos"
        },

        "camarones": {
          ES_UN: "Mariscos"
        },

        "carne roja": {
          ES_UN: "Carne Roja"
        },

        "filete": {
          ES_UN: "Carne Roja"
        },

        "entrecot": {
          ES_UN: "Carne Roja"
        },

        "churrasco": {
          ES_UN: "Carne Roja"
        },

        "pasta": {
          ES_UN: "Pasta"
        },

        "lasaña": {
          ES_UN: "Pasta"
        }

      },

      relaciones: {

        "Pescado": {

          ACOMPAÑA: "Vino Blanco",

          ES_APROPIADO_PARA: "ChardonnayPremium"

        },

        "Mariscos": {

          ACOMPAÑA: "Vino Blanco",

          ES_APROPIADO_PARA: "ChardonnayPremium"

        },

        "Carne Roja": {

          ACOMPAÑA: "Vino Tinto",

          ES_APROPIADO_PARA: "CabernetReserva"

        },

        "Pasta": {

          ACOMPAÑA: "Vino Rosado",

          ES_APROPIADO_PARA: "RoseGrajales"

        }

      },

      bodegas: {

        "casagrajales": {

          region: "Valle del Cauca",

          vinos: [
            "ChardonnayPremium",
            "RoseGrajales"
          ]

        },

        "bodegaandes": {

          region: "Región Andina",

          vinos: [
            "CabernetReserva"
          ]

        }

      }

    }

  };

  /* ========================================================= */
  /* RECOMENDACIONES DE MARIDAJE */
  /* ========================================================= */

  if (
    intent.includes("maridaje") ||
    intent.includes("recomendar")
  ) {

    const nodoAlimento =
      redSemantica.nodos.alimentos[alimento];

    if (!nodoAlimento) {

      return res.status(200).json({

        fulfillmentText:

          `No encontré relaciones semánticas para ${params.alimento}. ` +

          `Puedes preguntar por pescado, mariscos, carne roja o pasta.`

      });

    }

    const categoria =
      nodoAlimento.ES_UN;

    const relacion =
      redSemantica.nodos.relaciones[categoria];

    const vinoRecomendado =
      relacion.ES_APROPIADO_PARA;

    const nodoVino =
      redSemantica.nodos.vinos[
        vinoRecomendado.toLowerCase()
      ];

    return res.status(200).json({

      fulfillmentText:

        `Te recomiendo ${vinoRecomendado}. ` +

        `Inferencia semántica: ` +

        `${params.alimento} ES_UN ${categoria}; ` +

        `${relacion.ACOMPAÑA} ACOMPAÑA ${categoria}; ` +

        `${vinoRecomendado} ES_UN ${nodoVino.ES_UN}; ` +

        `${vinoRecomendado} HECHO_DE ${nodoVino.HECHO_DE}; ` +

        `${vinoRecomendado} TIENE_PERFIL ${nodoVino.TIENE_PERFIL}. ` +

        `Por eso, este vino es apropiado para ${params.alimento}.`

    });

  }

  /* ========================================================= */
  /* CONSULTAR TIPO DE VINO */
  /* ========================================================= */

  if (
    intent.includes("tipo.vino")
  ) {

    const nodoVino =
      redSemantica.nodos.vinos[vino];

    if (!nodoVino) {

      return res.status(200).json({

        fulfillmentText:
          `No encontré información sobre ${params.vino}.`

      });

    }

    return res.status(200).json({

      fulfillmentText:

        `${params.vino} ES_UN ${nodoVino.ES_UN}. ` +

        `Además, está HECHO_DE ${nodoVino.HECHO_DE} ` +

        `y TIENE_PERFIL ${nodoVino.TIENE_PERFIL}.`

    });

  }

  /* ========================================================= */
  /* CONSULTAR BODEGA */
  /* ========================================================= */

  if (
    intent.includes("bodega")
  ) {

    const nodoBodega =
      redSemantica.nodos.bodegas[bodega];

    if (!nodoBodega) {

      return res.status(200).json({

        fulfillmentText:
          `No encontré información sobre la bodega ${params.bodega}.`

      });

    }

    return res.status(200).json({

      fulfillmentText:

        `${params.bodega} se encuentra en ${nodoBodega.region} ` +

        `y produce los vinos: ` +

        `${nodoBodega.vinos.join(", ")}.`

    });

  }

  /* ========================================================= */
  /* FALLBACK */
  /* ========================================================= */

  return res.status(200).json({

    fulfillmentText:

      "La red semántica recibió la consulta, pero no encontró una relación adecuada."

  });

};

function normalizar(texto) {

  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}