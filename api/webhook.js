export default function handler(req, res) {

  const body = req.body;

  const intent =
    body?.queryResult?.intent?.displayName || "";

  const params =
    body?.queryResult?.parameters || {};

  const alimento = normalizar(params.alimento);

  const redSemantica = {

    alimentos: {

      "salmón": {
        es_un: "Pescado"
      },

      "salmon": {
        es_un: "Pescado"
      },

      "pescado": {
        es_un: "Pescado"
      },

      "mariscos": {
        es_un: "Mariscos"
      },

      "camarones": {
        es_un: "Mariscos"
      },

      "langostinos": {
        es_un: "Mariscos"
      },

      "carne roja": {
        es_un: "Carne Roja"
      },

      "filete": {
        es_un: "Carne Roja"
      },

      "entrecot": {
        es_un: "Carne Roja"
      },

      "pasta": {
        es_un: "Pasta"
      }

    },

    recomendaciones: {

      "Pescado": {
        vino: "ChardonnayPremium",
        tipo: "Vino Blanco",
        perfil: "Ácido",
        razon:
          "los vinos blancos acompañan bien pescados"
      },

      "Mariscos": {
        vino: "ChardonnayPremium",
        tipo: "Vino Blanco",
        perfil: "Ácido",
        razon:
          "los vinos blancos frescos acompañan mariscos"
      },

      "Carne Roja": {
        vino: "CabernetReserva",
        tipo: "Vino Tinto",
        perfil: "Tánico",
        razon:
          "los vinos tintos tánicos equilibran carnes intensas"
      },

      "Pasta": {
        vino: "RoseGrajales",
        tipo: "Vino Rosado",
        perfil: "Afrutado",
        razon:
          "los vinos rosados afrutados acompañan pastas suaves"
      }

    }

  };

  if (intent === "recomendar.maridaje") {

    const nodo = redSemantica.alimentos[alimento];

    if (!nodo) {

      return res.status(200).json({
        fulfillmentText:
          `No encontré relaciones semánticas para ${params.alimento}.`
      });

    }

    const categoria = nodo.es_un;

    const recomendacion =
      redSemantica.recomendaciones[categoria];

    return res.status(200).json({

      fulfillmentText:

        `Te recomiendo ${recomendacion.vino}. ` +

        `Inferencia semántica: ` +

        `${params.alimento} ES_UN ${categoria}; ` +

        `${recomendacion.tipo} ACOMPAÑA ${categoria}; ` +

        `${recomendacion.vino} TIENE_PERFIL ${recomendacion.perfil}. ` +

        `Por eso, ${recomendacion.razon}.`

    });

  }

  return res.status(200).json({
    fulfillmentText:
      "Intent reconocido, pero sin lógica configurada."
  });

}

function normalizar(texto) {

  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}

//hola