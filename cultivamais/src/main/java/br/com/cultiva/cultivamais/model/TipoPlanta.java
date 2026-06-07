package br.com.cultiva.cultivamais.model;

public enum TipoPlanta {
    // --- Categorias legadas (mantidas para compatibilidade com registros existentes) ---
    HORTALICA,
    FRUTA,
    GRAO,
    LEGUME,
    VERDURA,
    FLOR,
    ERVA_MEDICINAL,
    TEMPERO,
    ARBUSTO,
    OUTRO,

    // --- Lavouras Temporárias ---
    CEREAL,
    OLEAGINOSA,
    LEGUMINOSA,
    FIBRA,
    CULTURA_INDUSTRIAL,
    FORRAGEIRA,

    // --- Horticultura ---
    HORTALICA_FOLHOSA,
    HORTALICA_FRUTO,
    HORTALICA_RAIZ,
    TEMPERO_AROMATICA,
    MEDICINAL,
    ORNAMENTAL,
    FUNGICULTURA,

    // --- Fruticultura (Permanentes) ---
    FRUTA_CARNOSA,
    FRUTO_SECO,
    FRUTO_INDUSTRIAL
}
