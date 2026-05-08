module.exports = {
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
