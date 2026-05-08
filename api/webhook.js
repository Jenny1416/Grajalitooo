// #region Dependencias (plegable)
const red = require("./catalogo");
const {
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
  dedupeNombres
} = require("./webhook.utils");
// #endregion

module.exports = (req, res) => {
  // #region Contexto base (plegable)
  const body = req.body || {};
  const params = body?.queryResult?.parameters || {};
  const queryText = body?.queryResult?.queryText || "";
  const queryTextNorm = normalizar(queryText);
  const reply = (opciones) => res.status(200).json({ fulfillmentText: elegir(opciones) });
  const param = (...keys) => {
    for (const k of keys) {
      const v = params?.[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };

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
  const intentTiene = (...etiquetas) => etiquetas.every(intentTieneEtiqueta);

  const esConsultarPerfilIntent = intentTiene("perfil", "consultar");
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

  const alimentoParam = param("alimento", "Alimento");
  const vinoParam = param("vino", "Vino");
  const bodegaParam = param("bodega", "Bodega");
  const uvaParam = param("uva", "Uva", "uvA", "UVA");
  const perfilParam = param("perfil", "Perfil");
  const regionParam = param("region", "Region", "región", "Región");
  const tipoVinoParam = param("tipo", "Tipo", "tipo_vino", "tipoVino");

  const vino = normalizar(vinoParam);
  const uva = normalizar(uvaParam);

  // En respuestas donde queremos “repetir” lo que dijo el usuario, usamos el parámetro
  // original de Dialogflow. En respuestas de webhook NO existe el reemplazo de $entidad.original,
  // así que si no viene el parámetro, usamos fallback “natural” (sin placeholders).
  const platoDe = mencionar(alimentoParam, (v) => `el plato de ${v}`, "el plato que mencionas");
  const vinoDe = mencionar(vinoParam, (v) => `el vino ${v}`, "ese vino");
  const uvaDe = mencionar(uvaParam, (v) => `la uva ${v}`, "esa uva");
  const bodegaDe = mencionar(bodegaParam, (v) => `la bodega ${v}`, "esa bodega");
  const perfilDe = mencionar(perfilParam, (v) => `el perfil ${v}`, "ese perfil");
  const tipoVinoDe = tipoVinoParam ? `el ${tipoVinoParam}` : "ese tipo de vino";
  // #endregion

  // Intent: consultar.uva
  // Resuelve 3 caminos:
  // 1) vino -> devuelve su uva
  // 2) uva -> devuelve vinos asociados
  // 3) sin entidad clara -> guía de uso
  if (intentTiene("consultar", "uva")) {
    if (vino) {
      const info = red.vinos[vino];

      if (!info?.uva) {
        return reply([
          `Mmm… revisé mi catálogo y no encuentro la uva asociada a ${vinoDe}. ¿Me lo puedes escribir tal cual aparece?`,
          `Todavía no tengo registrada la uva de ${vinoDe}. Si quieres, prueba con CabernetReserva, ChardonnayPremium o RoseGrajales.`,
          `No me aparece esa información para ${vinoDe}. ¿Cuál vino es exactamente?`
        ]);
      }

      return reply([
        `Claro: para ${vinoDe}, la uva es ${info.uva}. Si quieres, también te cuento su tipo (${info.tipo}) y su perfil (${info.perfil}).`,
        `Te confirmo: ${vinoDe} está elaborado con ${info.uva}. ¿Lo vas a acompañar con algo? Dime ${platoDe} y te recomiendo un maridaje.`,
        `La uva de ${vinoDe} es ${info.uva}. Si te interesa, puedo decirte qué otros vinos de nuestra selección usan esa misma uva.`
      ]);
    }

    if (uva) {
      const vinosHechosDe = Object.entries(red.vinos)
        .filter(([, info]) => esMismoTexto(info?.uva, uva))
        .map(([key]) => key);

      if (vinosHechosDe.length === 0) {
        return reply([
          `Busqué por ${uvaDe} y no encontré vinos asociados. ¿Te refieres a Cabernet Sauvignon o Chardonnay?`,
          `Por ahora no tengo vinos hechos con ${uvaDe}. Si me dices otra uva, lo intento.`,
          `No encuentro coincidencias para ${uvaDe}. Ojo: ayuda escribirla tal cual (por ejemplo: "Cabernet Sauvignon").`
        ]);
      }

      const nombresBonitos = vinosHechosDe.map((v) => desnormalizarVino(v));

      return reply([
        `Si te gusta ${uvaDe}, te van a interesar estos vinos: ${formatearLista(nombresBonitos)}.`,
        `Listo, esto es lo que encontré para ${uvaDe}: ${formatearLista(nombresBonitos)}. ¿Quieres que te describa alguno?`,
        `Perfecto: para ${uvaDe}, tengo registrados estos vinos: ${formatearLista(nombresBonitos)}.`
      ]);
    }

    return reply([
      `¡Claro! Puedo decirte la uva de un vino o, al revés, qué vinos se hacen con una uva. Ejemplos: "¿De qué uva está hecho CabernetReserva?" o "¿Qué vinos usan Chardonnay?"`,
      `Dime un vino (CabernetReserva, ChardonnayPremium, RoseGrajales) o una uva (Cabernet Sauvignon, Chardonnay) y con gusto te lo confirmo.`,
      `¿Te sirve más empezar por el vino o por la uva? Con cualquiera de las dos opciones te respondo.`
    ]);
  }

  // Intent: consultar.perfil / continuar.perfil
  // Permite consultar o continuar contexto desde:
  // - vino específico
  // - tipo de vino (tinto/blanco/rosado)
  // - perfil sensorial (seco/ácido/afrutado/tánico)
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
        return reply(modoContinuarPerfil ? textosContinuar : textosConsulta);
      }
    }

    // Caso 1b: tipo de vino (vino blanco/tinto/rosado)
    const tipoCanonico = resolverTipoCanonico(vinoTextoNorm);

    const etiquetaTipoUsuario =
      vinoTexto.trim() || etiquetaTipoCanonico(tipoCanonico) || tipoCanonico;

    if (tipoCanonico) {
      const registrosTipo = Object.entries(red.vinos).filter(
        ([, info]) => esMismoTexto(info?.tipo, tipoCanonico)
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
        return reply(modoContinuarPerfil ? textosTipoContinuar : textosTipoConsulta);
      }
    }

    // 2) Si el usuario dio un perfil "real", devolvemos vinos con ese perfil
    const perfilCanonico = resolverPerfilCanonico(perfilNormalizado);

    if (perfilCanonico) {
      const vinosConPerfil = Object.entries(red.vinos)
        .filter(([, info]) => esMismoTexto(info?.perfil, perfilCanonico))
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
        return reply(modoContinuarPerfil ? listaVaciaContinuar : listaVaciaConsulta);
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
      return reply(perfilCanonicoMsgs);
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
    return reply(modoContinuarPerfil ? fallbackContinuarPerfil : fallbackConsultaPerfil);
  }

  // Intent: consultar.region
  // Flujo:
  // - normaliza región y valida existencia
  // - si preguntan por "tipo", calcula predominante
  // - en otro caso, describe región + lista de vinos
  if (intentTiene("consultar", "region")) {
    const regionKey = normalizarRegion(regionParam);
    const infoRegion = regionKey ? red.regiones[regionKey] : null;

    if (!infoRegion) {
      return reply([
        `¡Claro! ¿De qué región te gustaría saber? Puedo ayudarte con Caribe, Pacífica, Andina, Amazónica, Insular u Orinoquía.`,
        `Con gusto. Dime la región (Caribe, Pacífica, Andina, Amazónica, Insular u Orinoquía) y te digo qué vinos tengo registrados.`,
        `¿Qué región quieres consultar? Por ejemplo: región caribe, pacífica, andina, amazónica, insular u orinoquía.`
      ]);
    }

    const vinosRegion = (infoRegion.vinos || []).filter(Boolean);
    const vinosBonitos = vinosRegion.map((v) => String(v));

    const preguntaPorTipo = intentNormalizado.includes("tipo") || queryTextNorm.includes("tipo");

    if (preguntaPorTipo) {
      const conteo = { "Vino Tinto": 0, "Vino Blanco": 0, "Vino Rosado": 0 };
      for (const v of vinosRegion) {
        const key = normalizarClave(v);
        const tipo = red.vinos[key]?.tipo;
        if (tipo && Object.prototype.hasOwnProperty.call(conteo, tipo)) conteo[tipo] += 1;
      }
      const tipoPredominante = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

      return reply([
        `En ${infoRegion.nombre}, el estilo que más se repite en mi selección es ${tipoPredominante || "un mix de estilos"}. Si quieres, te doy ejemplos: ${formatearLista(vinosBonitos)}.`,
        `Si hablamos de ${infoRegion.nombre}, lo más característico en mi catálogo es ${tipoPredominante || "una variedad de estilos"}. ¿Te muestro vinos concretos? ${formatearLista(vinosBonitos)}.`,
        `Para ${infoRegion.nombre}, el tipo que mejor la representa (con lo que tengo registrado) es ${tipoPredominante || "una mezcla"}. Ejemplos: ${formatearLista(vinosBonitos)}.`
      ]);
    }

    return reply([
      `¡Con gusto! En ${infoRegion.nombre} te puedo mostrar estos vinos: ${formatearLista(vinosBonitos)}. Es ${infoRegion.descripcion}. ¿Quieres que te recomiende uno según ${platoDe}?`,
      `En ${infoRegion.nombre} tengo registrados ${formatearLista(vinosBonitos)}. En pocas palabras, es ${infoRegion.descripcion}. ¿Buscas tinto, blanco o rosado?`,
      `Si te interesa ${infoRegion.nombre}, aquí van buenos ejemplos de mi selección: ${formatearLista(vinosBonitos)}. ${capitalizar(infoRegion.descripcion)}.`
    ]);
  }

  // Intent: maridaje/recomendar
  // Convierte alimento del usuario a categoría conocida y devuelve recomendación.
  if (intentNormalizado.includes("maridaje") || intentNormalizado.includes("recomendar")) {
    const categoria = resolverCategoriaMaridaje(alimentoParam);

    if (!categoria) {
      return reply([
        `Todavía no tengo ${platoDe} en mi guía de maridajes. ¿Te va bien si lo intentamos con pescado, mariscos, carne roja o pasta?`,
        `No ubico ${platoDe} como categoría conocida. Dame una pista: ¿es pescado, mariscos, carne roja o pasta?`,
        `Aún no tengo registrado ${platoDe}. Prueba con salmón/pescado, mariscos, carne roja o pasta y te recomiendo algo.`
      ]);
    }

    const recomendacion = red.recomendaciones[categoria];

    return reply([
      `¡Vamos a maridar! Para ${platoDe}, mi apuesta es ${recomendacion.vino}: ${recomendacion.descripcion}.`,
      `Con ${platoDe} yo me iría por ${recomendacion.vino}. Suele funcionar muy bien porque es ${recomendacion.descripcion}.`,
      `Si quieres una combinación fácil de acertar: ${recomendacion.vino}. Va muy bien con ${platoDe} porque es ${recomendacion.descripcion}.`
    ]);
  }

  // Intent: tipo+vino / continuar.tipo+vino
  // Responde por nombre de vino o por tipo; mantiene modo "continuar".
  if (esNombreIntentTipoYVino) {
    const modoContinuarTipoVino = esContinuarTipoVinoIntent;
    const queryTextTipo = queryText;

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
      const muestraVin = mencionar(etiquetaVin, (v) => `el vino ${v}`, "ese vino");
      const textosDefault = [
        `Te cuento: ${muestraVin} es un ${info.tipo}. Está elaborado con ${info.uva} y su perfil es ${info.perfil}.`,
        `En resumen, ${muestraVin} es un ${info.tipo} de perfil ${info.perfil}, elaborado con ${info.uva}.`,
        `Perfecto: ${muestraVin} es un ${info.tipo}, hecho con ${info.uva}, y con un perfil ${info.perfil}. ¿Quieres que te sugiera un platillo para acompañarlo?`
      ];
      const textoNombre = etiquetaVin || desnormalizarVino(claveVinResuelta);
      const textoNombreMencion = mencionar(textoNombre, (v) => `el vino ${v}`, "ese vino");
      const textosContinuo = [
        `${capitalizar(textoNombre)}: ${info.tipo}, uva ${info.uva}, perfil ${info.perfil}. ¿Otro nombre?`,
        `Listo. ${textoNombreMencion} viene como ${info.tipo}, sobre ${info.uva}, rasgo ${info.perfil}.`,
        `${textoNombreMencion} lo tengo así: tipo ${info.tipo}, perfil ${info.perfil}, uva ${info.uva}.`
      ];
      return reply(modoContinuarTipoVino ? textosContinuo : textosDefault);
    }

    const tipoCanonicoTv = resolverTipoCanonico(textoFusionTipoVinoNorm);

    if (tipoCanonicoTv) {
      const registrosTipoVino = Object.entries(red.vinos).filter(
        ([, vi]) => esMismoTexto(vi?.tipo, tipoCanonicoTv)
      );
      const nombresTv = registrosTipoVino.map(([k]) => desnormalizarVino(k)).filter(Boolean);
      const muestraEj = registrosTipoVino[0];
      const sufijoEjemplo = muestraEj
        ? `. Por ejemplo ${desnormalizarVino(muestraEj[0])}: perfil ${muestraEj[1].perfil}.`
        : "";
      const etiqTipoEsp = etiquetaTipoCanonico(tipoCanonicoTv);
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
      return reply(modoContinuarTipoVino ? textosTipoListaCont : textosTipoListaDef);
    }

    const muestraVinNoHallado = mencionar(vinoParam, (v) => `el vino ${v}`, "ese vino");
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
    return reply(modoContinuarTipoVino ? noHalladoCont : noHalladoDefault);
  }

  // Intent: consultar.bodega
  // Lista bodegas por tipo de vino y sugiere siguientes pasos.
  if (intentTiene("consultar", "bodega")) {
    // En tu agente, a veces el parámetro `vino` trae "vino blanco/tinto/rosado".
    // Tomamos primero un `tipo` explícito, y si no, reutilizamos `vino`.
    const tipoTexto = String(tipoVinoParam || params.vino || params.Vino || "").trim();
    const tipoCanonico = resolverTipoCanonico(tipoTexto);

    if (!tipoCanonico) {
      return reply([
        `¡Con gusto! ¿Buscas ${bodegaDe} de vino tinto, blanco o rosado?`,
        `Claro. Para ayudarte mejor, dime qué tipo de vino te interesa: tinto, blanco o rosado.`,
        `Perfecto, ¿qué estilo buscas: vino tinto, vino blanco o vino rosado?`
      ]);
    }

    const bodegasQueProducen = Object.entries(red.bodegas)
      .filter(([, b]) => {
        const vinosBodega = (b?.vinos || []).map((v) => normalizarClave(v));
        return vinosBodega.some((vk) => esMismoTexto(red.vinos[vk]?.tipo, tipoCanonico));
      })
      .map(([k]) => k);

    const bodegasBonitas = dedupeNombres(bodegasQueProducen.map(desnormalizarBodega));
    const hayAlimentoEnPregunta = Boolean(alimentoParam);

    if (bodegasBonitas.length === 0) {
      return reply([
        `Por ahora no tengo registrada ninguna bodega con ${tipoTexto || tipoVinoDe}. Si quieres, puedo mostrarte las bodegas que sí tengo en catálogo.`,
        `De momento no me aparece una bodega que produzca ${tipoTexto || tipoVinoDe}. ¿Quieres que te diga qué bodegas tengo disponibles?`,
        `No encontré bodegas asociadas a ${tipoTexto || tipoVinoDe}. Si me dices otra categoría (tinto/blanco/rosado), lo intento de nuevo.`
      ]);
    }

    return reply([
      `Para ${tipoTexto || tipoVinoDe}, te puedo recomendar estas bodegas: ${formatearLista(bodegasBonitas)}. ¿Quieres que te sugiera un vino de alguna?`,
      `Si estás buscando ${tipoTexto || tipoVinoDe}, nuestras bodegas que aparecen con ese estilo son ${formatearLista(bodegasBonitas)}.`,
      hayAlimentoEnPregunta
        ? `Claro: para ${tipoTexto || tipoVinoDe}, tengo registradas estas bodegas: ${formatearLista(bodegasBonitas)}. ¿Te interesa una recomendación según ${platoDe}?`
        : `Claro: para ${tipoTexto || tipoVinoDe}, tengo registradas estas bodegas: ${formatearLista(bodegasBonitas)}. ¿Te antoja algo más fresco (blanco/rosado) o más intenso (tinto)?`
    ]);
  }

  // Intent: bodega (detalle directo)
  // Devuelve catálogo de vinos de una bodega específica.
  if (intentNormalizado.includes("bodega")) {
    const info = red.bodegas[normalizarClave(bodegaParam)];

    if (!info) {
      return reply([
        `No ubico ${bodegaDe} en mi lista todavía. ¿Te refieres a Casa Grajales o Bodega Andes?`,
        `Mmm… esa bodega no me aparece: ${bodegaDe}. Prueba con "Casa Grajales" o "Bodega Andes".`,
        `Todavía no tengo registrada ${bodegaDe}. Si me das el nombre exacto, la busco de nuevo.`
      ]);
    }

    return reply([
      `¡Claro! En ${bodegaDe} puedes encontrar estos vinos: ${formatearLista(info.vinos)}. ¿Te interesa que te recomiende uno según ${platoDe}?`,
      `${bodegaDe} tiene en su selección ${formatearLista(info.vinos)}. Si me dices cuál te llama la atención, te cuento su uva, tipo y perfil.`,
      `Con gusto: los vinos de ${bodegaDe} son ${formatearLista(info.vinos)}. ¿Buscas un vino blanco, tinto o rosado?`
    ]);
  }

  return reply([
    `Me quedé sin un camino claro en la red para responder eso. ¿Me lo reformulas con vino/uva/comida/bodega? (Intent: ${intent})`,
    `Uff, aquí mi red no alcanza a inferir una respuesta. Si me dices un vino, una uva o una comida, lo conecto mejor. (Intent: ${intent})`,
    `No logré conectar los nodos necesarios para esa pregunta. Prueba preguntándome por maridaje, uva, tipo de vino o bodega. (Intent: ${intent})`
  ]);
};
