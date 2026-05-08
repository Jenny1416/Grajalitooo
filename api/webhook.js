module.exports = (req, res) => {
  const body = req.body || {};

  const intent = body?.queryResult?.intent?.displayName || "";

  let intentNormalizado = normalizar(intent);
  intentNormalizado = intentNormalizado.replace(/\uFEFF|\u200B/g, "");

  /** Consultar_Perfil vs continuar.perfil vs slugs concatenados tipo "continuarperfil" */
  const intentSlugAlfa = intentNormalizado.replace(/[^a-z0-9]/g, "");
  const intentTokensSeparados =
    intentNormalizado.replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);

  /** @returns {boolean} */
  function intentTieneEtiqueta(etiq) {
    if (!etiq) return false;
    if (intentSlugAlfa.includes(etiq)) return true;
    return intentTokensSeparados.some((tok) => tok === etiq);
  }

  const esConsultarPerfilIntent =
    intentTieneEtiqueta("perfil") && intentTieneEtiqueta("consultar");
  const esContinuarPerfilIntent =
    intentTieneEtiqueta("perfil") &&
    (intentTieneEtiqueta("continuar") || intentTieneEtiqueta("continue"));

  /** consultar.perfil ó continuar.perfil (nombre del intent suele llegar como slug sin espacios) */
  const esIntentPerfil = esConsultarPerfilIntent || esContinuarPerfilIntent;

  const esNombreIntentTipoYVino =
    (intentTieneEtiqueta("tipo") && intentTieneEtiqueta("vino")) ||
    (intentSlugAlfa.includes("tipo") && intentSlugAlfa.includes("vino"));
  const esContinuarTipoVinoIntent =
    esNombreIntentTipoYVino &&
    (intentTieneEtiqueta("continuar") || intentTieneEtiqueta("continue"));

  const params = body?.queryResult?.parameters || {};

  const alimento = normalizar(params.alimento || params.Alimento || "");
  const vino = normalizar(params.vino || params.Vino || "");
  const bodega = normalizar(params.bodega || params.Bodega || "");
  const uva = normalizar(params.uva || params.Uva || params.uvA || params.UVA || "");

  // En respuestas donde queremos “repetir” lo que dijo el usuario, usamos el parámetro
  // original de Dialogflow. En respuestas de webhook NO existe el reemplazo de $entidad.original,
  // así que si no viene el parámetro, usamos fallback “natural” (sin placeholders).
  const alimentoParam = String(params.alimento || params.Alimento || "").trim();
  const vinoParam = String(params.vino || params.Vino || "").trim();
  const uvaParam = String(params.uva || params.Uva || params.uvA || params.UVA || "").trim();
  const bodegaParam = String(params.bodega || params.Bodega || "").trim();
  const perfilParam = String(params.perfil || params.Perfil || "").trim();
  const regionParam = String(params.region || params.Region || params.región || params.Región || "").trim();

  const platoDe = mencionarPlato(alimentoParam);
  const vinoDe = mencionarVino(vinoParam);
  const uvaDe = mencionarUva(uvaParam);
  const bodegaDe = mencionarBodega(bodegaParam);
  const perfilDe = mencionarPerfil(perfilParam);
  const regionDe = mencionarRegion(regionParam);
  const tipoVinoParam = params.tipo || params.Tipo || params.tipo_vino || params.tipoVino || "";
  const tipoVinoDe = tipoVinoParam ? `el ${tipoVinoParam}` : "ese tipo de vino";

  const red = {
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
      },
      "zinfandelgranreserva": {
        tipo: "Vino Tinto",
        uva: "Zinfandel",
        perfil: "Tánico"
      },
      "pinotnoirreserva": {
        tipo: "Vino Tinto",
        uva: "Pinot noir",
        perfil: "Seco"
      }
    },

    bodegas: {
      "casagrajales": {
        vinos: ["ChardonnayPremium", "RoseGrajales"]
      },
      "bodegaandes": {
        vinos: ["CabernetReserva", "ZinfandelGranReserva", "PinotNoirReserva"]
      }
    },

    // Regiones (ejemplos). Puedes ajustar los vinos según tu ejercicio.
    regiones: {
      "pacifica": {
        nombre: "Región Pacífica",
        descripcion: "una zona costera y fresca, ideal para estilos ligeros y versátiles",
        vinos: ["ChardonnayPremium", "RoseGrajales"]
      },
      "andina": {
        nombre: "Región Andina",
        descripcion: "una región de altura con noches frescas; suele favorecer tintos con buena estructura",
        vinos: ["CabernetReserva", "PinotNoirReserva"]
      },
      "amazonica": {
        nombre: "Región Amazónica",
        descripcion: "una región cálida y húmeda; aquí te muestro ejemplos pensados para maridajes más tropicales",
        vinos: ["RoseGrajales"]
      },
      "insular": {
        nombre: "Región Insular",
        descripcion: "una zona marítima; suelen preferirse vinos frescos para pescados y mariscos",
        vinos: ["ChardonnayPremium"]
      },
      "orinoquia": {
        nombre: "Región Orinoquía",
        descripcion: "una región de llanura y clima cálido; aquí te comparto opciones con carácter y buena compañía de carnes",
        vinos: ["CabernetReserva", "ZinfandelGranReserva"]
      },
      "caribe": {
        nombre: "Región Caribe",
        descripcion: "una región costera, cálida y festiva; aquí suelen disfrutarse vinos frescos y aromáticos ideales para mariscos y preparaciones tropicales",
        vinos: ["ChardonnayPremium", "RoseGrajales"]
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
            `Mmm… revisé mi catálogo y no encuentro la uva asociada a ${vinoDe}. ¿Me lo puedes escribir tal cual aparece?`,
            `Todavía no tengo registrada la uva de ${vinoDe}. Si quieres, prueba con CabernetReserva, ChardonnayPremium o RoseGrajales.`,
            `No me aparece esa información para ${vinoDe}. ¿Cuál vino es exactamente?`
          ])
        });
      }

      return res.status(200).json({
        fulfillmentText: elegir([
          `Claro: para ${vinoDe}, la uva es ${info.uva}. Si quieres, también te cuento su tipo (${info.tipo}) y su perfil (${info.perfil}).`,
          `Te confirmo: ${vinoDe} está elaborado con ${info.uva}. ¿Lo vas a acompañar con algo? Dime ${platoDe} y te recomiendo un maridaje.`,
          `La uva de ${vinoDe} es ${info.uva}. Si te interesa, puedo decirte qué otros vinos de nuestra selección usan esa misma uva.`
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
            `Busqué por ${uvaDe} y no encontré vinos asociados. ¿Te refieres a Cabernet Sauvignon o Chardonnay?`,
            `Por ahora no tengo vinos hechos con ${uvaDe}. Si me dices otra uva, lo intento.`,
            `No encuentro coincidencias para ${uvaDe}. Ojo: ayuda escribirla tal cual (por ejemplo: "Cabernet Sauvignon").`
          ])
        });
      }

      const nombresBonitos = vinosHechosDe.map((v) => desnormalizarVino(v));

      return res.status(200).json({
        fulfillmentText: elegir([
          `Si te gusta ${uvaDe}, te van a interesar estos vinos: ${formatearLista(nombresBonitos)}.`,
          `Listo, esto es lo que encontré para ${uvaDe}: ${formatearLista(nombresBonitos)}. ¿Quieres que te describa alguno?`,
          `Perfecto: para ${uvaDe}, tengo registrados estos vinos: ${formatearLista(nombresBonitos)}.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `¡Claro! Puedo decirte la uva de un vino o, al revés, qué vinos se hacen con una uva. Ejemplos: "¿De qué uva está hecho CabernetReserva?" o "¿Qué vinos usan Chardonnay?"`,
        `Dime un vino (CabernetReserva, ChardonnayPremium, RoseGrajales) o una uva (Cabernet Sauvignon, Chardonnay) y con gusto te lo confirmo.`,
        `¿Te sirve más empezar por el vino o por la uva? Con cualquiera de las dos opciones te respondo.`
      ])
    });
  }

  // consultar.perfil / continuar.perfil:
  // - vino -> perfil · tipo -> perfil · perfil -> vinos · "y el rosado?" etc.
  if (esIntentPerfil) {
    const modoContinuarPerfil = esContinuarPerfilIntent;

    // A veces Dialogflow rellena `perfil` con algo genérico ("perfil") aunque el usuario
    // realmente esté preguntando por el perfil de un vino. Por eso:
    // - Priorizamos vino/tipo_vino primero
    // - Solo tratamos `perfil` como filtro cuando sea uno de los perfiles esperados
    const perfilNormalizado = normalizar(perfilParam);

    // 1) Si el usuario dio un vino (nombre o "vino blanco/tinto/rosado"), devolvemos el perfil
    // Mismo criterio que consultar.bodega: Dialogflow a veces pone tinto/blanco/rosado en `tipo_*`, no en `vino`.
    const vinoTexto = String(tipoVinoParam || params.vino || params.Vino || "").trim();
    const queryTextNorm = normalizar(body.queryResult?.queryText || "");
    const vinoTextoNorm =
      `${normalizar(vinoTexto)} ${queryTextNorm}`.trim();

    // Caso 1a: vino específico (coincide con red.vinos por clave)
    if (vino) {
      const info = red.vinos[vino];
      if (info?.perfil) {
        const textosConsulta = [
          `Para ${vinoDe}, el perfil es ${info.perfil}. Si quieres, también te cuento su tipo (${info.tipo}) y su uva (${info.uva}).`,
          `El estilo de ${vinoDe} va por el lado ${info.perfil}. ¿Lo vas a acompañar con ${platoDe}?`,
          `${vinoDe} presenta un perfil ${info.perfil}. ¿Te gustaría una recomendación de maridaje?`
        ];
        const textosContinuar = [
          `Sí: ${vinoDe} es ${info.tipo}, uva ${info.uva}, y el perfil que tenemos es ${info.perfil}. ¿Quieres un maridaje rápido con ${platoDe}?`,
          `Listo. ${vinoDe} queda con perfil ${info.perfil} (${info.tipo}, ${info.uva}). Si quieres, lo comparamos con otro vino.`,
          `${vinoDe}: perfil ${info.perfil}, tipo ${info.tipo}, hecho con ${info.uva}. ¿Te sirve ese dato así?`
        ];
        return res.status(200).json({
          fulfillmentText: elegir(modoContinuarPerfil ? textosContinuar : textosConsulta)
        });
      }
    }

    // Caso 1b: tipo de vino (vino blanco/tinto/rosado)
    const tipoCanonico =
      vinoTextoNorm.includes("tinto") ? "Vino Tinto" :
      vinoTextoNorm.includes("blanco") ? "Vino Blanco" :
      (vinoTextoNorm.includes("rosado") || vinoTextoNorm.includes("rose")) ? "Vino Rosado" :
      "";

    const etiquetaTipoUsuario =
      vinoTexto.trim()
        ? vinoTexto
        : tipoCanonico === "Vino Tinto"
          ? "el vino tinto"
          : tipoCanonico === "Vino Blanco"
            ? "el vino blanco"
            : tipoCanonico === "Vino Rosado"
              ? "el vino rosado"
              : tipoCanonico;

    if (tipoCanonico) {
      const registrosTipo = Object.entries(red.vinos).filter(
        ([, info]) => normalizar(info?.tipo) === normalizar(tipoCanonico)
      );
      const perfiles = registrosTipo.map(([, inf]) => inf?.perfil).filter(Boolean);
      const perfilTipo = perfiles[0] || "";
      const ejemploVinosTipo = registrosTipo.map(([k]) => desnormalizarVino(k)).filter(Boolean);
      const ejemploListaTipo = formatearLista(ejemploVinosTipo);

      if (perfilTipo) {
        const textosTipoConsulta = [
          `En general, ${etiquetaTipoUsuario} suele ir con un perfil ${perfilTipo}. ¿Quieres que te recomiende un vino específico?`,
          `Para ${etiquetaTipoUsuario}, el perfil que tenemos registrado es ${perfilTipo}. ¿Buscas algo similar o algo diferente?`,
          `Si hablamos de ${etiquetaTipoUsuario}, el perfil típico es ${perfilTipo}. Si me dices ${platoDe}, te hago una recomendación rápida.`
        ];
        const fragEjEjemplo =
          ejemploListaTipo.length > 0 ? ` Ejemplos: ${ejemploListaTipo}.` : "";
        const textosTipoContinuar = [
          `Sí, ${etiquetaTipoUsuario} suele tener perfil ${perfilTipo}.${fragEjEjemplo} ¿Busco uno concreto?`,
          `${capitalizar(etiquetaTipoUsuario)}: en catálogo lo vemos sobre todo como ${perfilTipo}.${fragEjEjemplo}`,
          `${perfilTipo} es el rasgo habitual de ${etiquetaTipoUsuario}.${fragEjEjemplo} ¿Algo más sobre la comparación anterior?`
        ];
        return res.status(200).json({
          fulfillmentText: elegir(modoContinuarPerfil ? textosTipoContinuar : textosTipoConsulta)
        });
      }
    }

    // 2) Si el usuario dio un perfil "real", devolvemos vinos con ese perfil
    const perfilCanonico =
      perfilNormalizado.includes("tanico") ? "Tánico" :
      perfilNormalizado.includes("acido") ? "Ácido" :
      perfilNormalizado.includes("afrutado") ? "Afrutado" :
      perfilNormalizado.includes("seco") ? "Seco" :
      "";

    if (perfilCanonico) {
      const vinosConPerfil = Object.entries(red.vinos)
        .filter(([, info]) => normalizar(info?.perfil) === normalizar(perfilCanonico))
        .map(([k]) => desnormalizarVino(k));

      if (vinosConPerfil.length === 0) {
        const listaVaciaConsulta = [
          `Busqué por ${perfilDe} y no encontré vinos asociados todavía. Si me dices otro perfil (seco, ácido, afrutado o tánico), lo intento de nuevo.`,
          `Por ahora no tengo vinos registrados con ${perfilDe}. ¿Quieres probar con "ácido" o con "tánico"?`,
          `No encontré coincidencias para ${perfilDe}. Prueba con seco, ácido, afrutado o tánico.`
        ];
        const listaVaciaContinuar = [
          `Aquí sigo, pero ${perfilDe} no encuentra ejemplares en esta red. Repite con otro rasgo u opta por tinto, blanco o rosado.`,
          `${perfilDe} no aparece enlazado a un vino. Prueba otro nombre de perfil o dime un tipo.`,
          `Con ${perfilDe} no hay coincidencias. Usa uno de: seco, ácido, afrutado o tánico.`
        ];
        return res.status(200).json({
          fulfillmentText: elegir(modoContinuarPerfil ? listaVaciaContinuar : listaVaciaConsulta)
        });
      }

      const listaPerfilVin = formatearLista(vinosConPerfil);
      const perfilCanonicoMsgs = modoContinuarPerfil
        ? [
            `${perfilDe} te devuelvo ${listaPerfilVin}. ¿Comparamos alguno con el anterior?`,
            `Continuando: con ${perfilDe} tengo ${listaPerfilVin}. ¿Quieres uva de alguno?`,
            `${perfilDe} → estos vinos: ${listaPerfilVin}. ¿Sigo por maridaje?`
          ]
        : [
            `Si buscas ${perfilDe}, estos vinos te pueden gustar: ${listaPerfilVin}.`,
            `Claro: con ${perfilDe} tengo registrados ${listaPerfilVin}. ¿Quieres que te recomiende uno según ${platoDe}?`,
            `Perfecto, para ${perfilDe} te sugiero mirar ${listaPerfilVin}. ¿Te interesa saber la uva de alguno?`
          ];
      return res.status(200).json({
        fulfillmentText: elegir(perfilCanonicoMsgs)
      });
    }

    const fallbackConsultaPerfil = [
      `¡Claro! Dime un vino (por ejemplo ChardonnayPremium) o un tipo (vino tinto, blanco o rosado), o un perfil (seco, ácido, afrutado, tánico) y armamos la contestación.`,
      `¿Prefieres partir de un vino concreto, de un tipo, o del perfil con una palabra entre seco, ácido, afrutado y tánico? Con cualquiera de las tres rutas te resuelvo usando la misma red.`,
      `Para encaminarnos necesito esa pieza nueva: bien el nombre de la botella, bien el tipo, bien el rasgo sensorial como palabra corta entre las cuatro que listamos.`
    ];
    const fallbackContinuarPerfil = [
      `Te sigo, pero dime en una frase tinto/blanco/rosado, un vino conocido (RoseGrajales…) o solo el perfil (seco…).`,
      `No llegó nueva entidad. Repite como “¿y el blanco?” o “¿qué hay del rosado?” y lo resuelvo igual.`,
      `Necesito un tipo, un nombre de vino o un perfil (seco…). ¿Qué quieres ver ahora respecto del anterior?`
    ];
    return res.status(200).json({
      fulfillmentText: elegir(modoContinuarPerfil ? fallbackContinuarPerfil : fallbackConsultaPerfil)
    });
  }

  // Intent: consultar.region
  // Soporta:
  // - "¿Qué vinos hay en la región pacífica?"
  // - "Dame ejemplos de vinos de la región amazónica."
  // - "¿Qué tipo de vino caracteriza a la región pacífica?"
  if (intentNormalizado.includes("consultar") && intentNormalizado.includes("region")) {
    const regionKey = normalizarRegion(regionParam);
    const infoRegion = regionKey ? red.regiones[regionKey] : null;

    if (!infoRegion) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `¡Claro! ¿De qué región te gustaría saber? Puedo ayudarte con Pacífica, Andina, Amazónica, Insular u Orinoquía.`,
          `Con gusto. Dime la región (Pacífica, Andina, Amazónica, Insular u Orinoquía) y te digo qué vinos tengo registrados.`,
          `¿Qué región quieres consultar? Por ejemplo: región pacífica, andina, amazónica, insular u orinoquía.`
        ])
      });
    }

    const vinosRegion = (infoRegion.vinos || []).filter(Boolean);
    const vinosBonitos = vinosRegion.map((v) => String(v));

    const preguntaPorTipo = intentNormalizado.includes("tipo") || normalizar(body?.queryResult?.queryText || "").includes("tipo");

    if (preguntaPorTipo) {
      const conteo = { "Vino Tinto": 0, "Vino Blanco": 0, "Vino Rosado": 0 };
      for (const v of vinosRegion) {
        const key = normalizarClave(v);
        const tipo = red.vinos[key]?.tipo;
        if (tipo && Object.prototype.hasOwnProperty.call(conteo, tipo)) conteo[tipo] += 1;
      }
      const tipoPredominante = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

      return res.status(200).json({
        fulfillmentText: elegir([
          `En ${infoRegion.nombre}, el estilo que más se repite en mi selección es ${tipoPredominante || "un mix de estilos"}. Si quieres, te doy ejemplos: ${formatearLista(vinosBonitos)}.`,
          `Si hablamos de ${infoRegion.nombre}, lo más característico en mi catálogo es ${tipoPredominante || "una variedad de estilos"}. ¿Te muestro vinos concretos? ${formatearLista(vinosBonitos)}.`,
          `Para ${infoRegion.nombre}, el tipo que mejor la representa (con lo que tengo registrado) es ${tipoPredominante || "una mezcla"}. Ejemplos: ${formatearLista(vinosBonitos)}.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `¡Con gusto! En ${infoRegion.nombre} te puedo mostrar estos vinos: ${formatearLista(vinosBonitos)}. Es ${infoRegion.descripcion}. ¿Quieres que te recomiende uno según ${platoDe}?`,
        `En ${infoRegion.nombre} tengo registrados ${formatearLista(vinosBonitos)}. En pocas palabras, es ${infoRegion.descripcion}. ¿Buscas tinto, blanco o rosado?`,
        `Si te interesa ${infoRegion.nombre}, aquí van buenos ejemplos de mi selección: ${formatearLista(vinosBonitos)}. ${capitalizar(infoRegion.descripcion)}.`
      ])
    });
  }

  if (intentNormalizado.includes("maridaje") || intentNormalizado.includes("recomendar")) {
    // Dialogflow ya debería entregar la categoría (con sinónimos resueltos) en `params.alimento`.
    // Normalizamos para mapear a las llaves de `red.recomendaciones`.
    const categoria =
      normalizarClave(alimentoParam) === "pescado" ? "Pescado" :
      normalizarClave(alimentoParam) === "mariscos" ? "Mariscos" :
      normalizarClave(alimentoParam) === "carneroja" ? "Carne Roja" :
      normalizarClave(alimentoParam) === "pasta" ? "Pasta" :
      "";

    if (!categoria) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `Todavía no tengo ${platoDe} en mi guía de maridajes. ¿Te va bien si lo intentamos con pescado, mariscos, carne roja o pasta?`,
          `No ubico ${platoDe} como categoría conocida. Dame una pista: ¿es pescado, mariscos, carne roja o pasta?`,
          `Aún no tengo registrado ${platoDe}. Prueba con salmón/pescado, mariscos, carne roja o pasta y te recomiendo algo.`
        ])
      });
    }

    const recomendacion = red.recomendaciones[categoria];

    return res.status(200).json({
      fulfillmentText: elegir([
        `¡Vamos a maridar! Para ${platoDe}, mi apuesta es ${recomendacion.vino}: ${recomendacion.descripcion}.`,
        `Con ${platoDe} yo me iría por ${recomendacion.vino}. Suele funcionar muy bien porque es ${recomendacion.descripcion}.`,
        `Si quieres una combinación fácil de acertar: ${recomendacion.vino}. Va muy bien con ${platoDe} porque es ${recomendacion.descripcion}.`
      ])
    });
  }

  if (esNombreIntentTipoYVino) {
    const modoContinuarTipoVino = esContinuarTipoVinoIntent;
    const queryTextTipo = body.queryResult?.queryText || "";

    const tipoParamPlano =
      typeof tipoVinoParam === "string" ? tipoVinoParam.trim() : "";
    const textoFusionTipoVinoNorm = `${normalizar(vinoParam)} ${normalizar(tipoParamPlano)} ${normalizar(queryTextTipo)}`;

    const { clave: claveVinResuelta, etiquetaVin } = resolverClaveVinoCatalogo(red.vinos, {
      textoParamVino: vinoParam,
      textoExtra: tipoParamPlano ? tipoParamPlano : String(params.vino || params.Vino || ""),
      queryTexto: queryTextTipo
    });

    if (claveVinResuelta) {
      const info = red.vinos[claveVinResuelta];
      const muestraVin = mencionarVino(etiquetaVin);
      const textosDefault = [
        `Te cuento: ${muestraVin} es un ${info.tipo}. Está elaborado con ${info.uva} y su perfil es ${info.perfil}.`,
        `En resumen, ${muestraVin} es un ${info.tipo} de perfil ${info.perfil}, elaborado con ${info.uva}.`,
        `Perfecto: ${muestraVin} es un ${info.tipo}, hecho con ${info.uva}, y con un perfil ${info.perfil}. ¿Quieres que te sugiera un platillo para acompañarlo?`
      ];
      const textoNombre = etiquetaVin || desnormalizarVino(claveVinResuelta);
      const textoNombreMencion = mencionarVino(textoNombre);
      const textosContinuo = [
        `${capitalizar(textoNombre)}: ${info.tipo}, uva ${info.uva}, perfil ${info.perfil}. ¿Otro nombre?`,
        `Listo. ${textoNombreMencion} viene como ${info.tipo}, sobre ${info.uva}, rasgo ${info.perfil}.`,
        `${textoNombreMencion} lo tengo así: tipo ${info.tipo}, perfil ${info.perfil}, uva ${info.uva}.`
      ];
      return res.status(200).json({
        fulfillmentText: elegir(modoContinuarTipoVino ? textosContinuo : textosDefault)
      });
    }

    const tipoCanonicoTv =
      textoFusionTipoVinoNorm.includes("tinto") ? "Vino Tinto" :
      textoFusionTipoVinoNorm.includes("blanco") ? "Vino Blanco" :
      (textoFusionTipoVinoNorm.includes("rosado") || textoFusionTipoVinoNorm.includes("rose"))
        ? "Vino Rosado" :
      "";

    if (tipoCanonicoTv) {
      const registrosTipoVino = Object.entries(red.vinos).filter(
        ([, vi]) => normalizar(vi?.tipo) === normalizar(tipoCanonicoTv)
      );
      const nombresTv = registrosTipoVino.map(([k]) => desnormalizarVino(k)).filter(Boolean);
      const muestraEj = registrosTipoVino[0];
      const sufijoEjemplo = muestraEj
        ? `. Por ejemplo ${desnormalizarVino(muestraEj[0])}: perfil ${muestraEj[1].perfil}.`
        : "";
      const etiqTipoEsp =
        tipoCanonicoTv === "Vino Rosado"
          ? "el vino rosado"
          : tipoCanonicoTv === "Vino Blanco"
            ? "el vino blanco"
            : "el vino tinto";
      const listaVinTv = formatearLista(nombresTv);
      const textosTipoListaDef = [
        `Por ${tipoCanonicoTv.toLowerCase()}, en mi lista están ${listaVinTv}.`,
        `${tipoCanonicoTv}: ${listaVinTv}${sufijoEjemplo}`,
        `${etiqTipoEsp}: ${listaVinTv}${sufijoEjemplo}`
      ];
      const textosTipoListaCont = [
        `Sigo: ${tipoCanonicoTv}: ${listaVinTv}${sufijoEjemplo} ¿Nombre concreto?`,
        `${tipoCanonicoTv}: ${listaVinTv}${sufijoEjemplo}`,
        `${etiqTipoEsp}: ${listaVinTv}${sufijoEjemplo}`
      ];
      return res.status(200).json({
        fulfillmentText: elegir(modoContinuarTipoVino ? textosTipoListaCont : textosTipoListaDef)
      });
    }

    const muestraVinNoHallado = mencionarVino(vinoParam);
    const noHalladoDefault = [
      `No me aparece ${muestraVinNoHallado} en la lista todavía. ¿Probamos con CabernetReserva, ChardonnayPremium o RoseGrajales?`,
      `Todavía no tengo registrado ${muestraVinNoHallado}. Dime otro vino y con gusto te cuento su tipo, uva y perfil.`,
      `No encuentro ${muestraVinNoHallado}. Si me lo escribes exacto, lo vuelvo a intentar.`
    ];
    const noHalladoCont = [
      `No ubico ${muestraVinNoHallado}. Prueba RoseGrajales, ChardonnayPremium o CabernetReserva.`,
      `Ese nombre no cuadra con el catálogo. ¿Lo escribes igual que en etiqueta CabernetReserva, ChardonnayPremium o RoseGrajales?`,
      `No lo veo. Opciones rápidas: CabernetReserva, ChardonnayPremium, RoseGrajales.`,
    ];
    return res.status(200).json({
      fulfillmentText: elegir(modoContinuarTipoVino ? noHalladoCont : noHalladoDefault)
    });
  }

  // Intent: consultar.bodega (incluye preguntas tipo "¿qué bodega produce vino tinto/blanco/rosado?")
  if (intentNormalizado.includes("consultar") && intentNormalizado.includes("bodega")) {
    // En tu agente, a veces el parámetro `vino` trae "vino blanco/tinto/rosado".
    // Tomamos primero un `tipo` explícito, y si no, reutilizamos `vino`.
    const tipoTexto = String(tipoVinoParam || params.vino || params.Vino || "").trim();
    const tipoNormalizado = normalizar(tipoTexto);

    const tipoCanonico =
      tipoNormalizado.includes("tinto") ? "Vino Tinto" :
      tipoNormalizado.includes("blanco") ? "Vino Blanco" :
      (tipoNormalizado.includes("rosado") || tipoNormalizado.includes("rose")) ? "Vino Rosado" :
      "";

    if (!tipoCanonico) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `¡Con gusto! ¿Buscas ${bodegaDe} de vino tinto, blanco o rosado?`,
          `Claro. Para ayudarte mejor, dime qué tipo de vino te interesa: tinto, blanco o rosado.`,
          `Perfecto, ¿qué estilo buscas: vino tinto, vino blanco o vino rosado?`
        ])
      });
    }

    const bodegasQueProducen = Object.entries(red.bodegas)
      .filter(([, b]) => {
        const vinosBodega = (b?.vinos || []).map((v) => normalizarClave(v));
        return vinosBodega.some((vk) => normalizar(red.vinos[vk]?.tipo) === normalizar(tipoCanonico));
      })
      .map(([k]) => k);

    const bodegasBonitas = dedupeNombres(bodegasQueProducen.map(desnormalizarBodega));
    const hayAlimentoEnPregunta = Boolean(params.alimento || params.Alimento);

    if (bodegasBonitas.length === 0) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `Por ahora no tengo registrada ninguna bodega con ${tipoTexto || tipoVinoDe}. Si quieres, puedo mostrarte las bodegas que sí tengo en catálogo.`,
          `De momento no me aparece una bodega que produzca ${tipoTexto || tipoVinoDe}. ¿Quieres que te diga qué bodegas tengo disponibles?`,
          `No encontré bodegas asociadas a ${tipoTexto || tipoVinoDe}. Si me dices otra categoría (tinto/blanco/rosado), lo intento de nuevo.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `Para ${tipoTexto || tipoVinoDe}, te puedo recomendar estas bodegas: ${formatearLista(bodegasBonitas)}. ¿Quieres que te sugiera un vino de alguna?`,
        `Si estás buscando ${tipoTexto || tipoVinoDe}, nuestras bodegas que aparecen con ese estilo son ${formatearLista(bodegasBonitas)}.`,
        hayAlimentoEnPregunta
          ? `Claro: para ${tipoTexto || tipoVinoDe}, tengo registradas estas bodegas: ${formatearLista(bodegasBonitas)}. ¿Te interesa una recomendación según ${platoDe}?`
          : `Claro: para ${tipoTexto || tipoVinoDe}, tengo registradas estas bodegas: ${formatearLista(bodegasBonitas)}. ¿Te antoja algo más fresco (blanco/rosado) o más intenso (tinto)?`
      ])
    });
  }

  if (intentNormalizado.includes("bodega")) {
    const info = red.bodegas[normalizarClave(bodegaParam)];

    if (!info) {
      return res.status(200).json({
        fulfillmentText: elegir([
          `No ubico ${bodegaDe} en mi lista todavía. ¿Te refieres a Casa Grajales o Bodega Andes?`,
          `Mmm… esa bodega no me aparece: ${bodegaDe}. Prueba con "Casa Grajales" o "Bodega Andes".`,
          `Todavía no tengo registrada ${bodegaDe}. Si me das el nombre exacto, la busco de nuevo.`
        ])
      });
    }

    return res.status(200).json({
      fulfillmentText: elegir([
        `¡Claro! En ${bodegaDe} puedes encontrar estos vinos: ${formatearLista(info.vinos)}. ¿Te interesa que te recomiende uno según ${platoDe}?`,
        `${bodegaDe} tiene en su selección ${formatearLista(info.vinos)}. Si me dices cuál te llama la atención, te cuento su uva, tipo y perfil.`,
        `Con gusto: los vinos de ${bodegaDe} son ${formatearLista(info.vinos)}. ¿Buscas un vino blanco, tinto o rosado?`
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

function normalizarClave(texto) {
  return normalizar(texto).replace(/\s+/g, "");
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
  if (n === "casagrajales") return "Casa Grajales";
  if (n === "bodegaandes") return "Bodega Andes";
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

function mencionarPlato(valor) {
  return valor ? `el plato de ${valor}` : "el plato que mencionas";
}

function mencionarVino(valor) {
  return valor ? `el vino ${valor}` : "ese vino";
}

function mencionarUva(valor) {
  return valor ? `la uva ${valor}` : "esa uva";
}

function mencionarBodega(valor) {
  return valor ? `la bodega ${valor}` : "esa bodega";
}

function mencionarPerfil(valor) {
  return valor ? `el perfil ${valor}` : "ese perfil";
}

function mencionarRegion(valor) {
  return valor ? `la región ${valor}` : "esa región";
}

function normalizarRegion(valor) {
  const n = normalizar(valor);
  if (!n) return "";
  if (n.includes("pacific")) return "pacifica";
  if (n.includes("andin")) return "andina";
  if (n.includes("amaz")) return "amazonica";
  if (n.includes("insul")) return "insular";
  if (n.includes("orino")) return "orinoquia";
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