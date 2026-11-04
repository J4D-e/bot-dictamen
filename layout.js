const ANCHO_CARGO = 80; // caracteres por línea del cargo

// Divide el cargo en líneas "escalera": cada línea <= a la siguiente, la última es la más larga.
export function escalera(texto, ancho = ANCHO_CARGO) {
  const p = String(texto || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '';
  if (p.join(' ').length <= ancho) return p.join(' ');
  const len = (a, b) => p.slice(a, b).join(' ').length;

  let n = 1, cur = 0;
  for (const w of p) {
    if (!cur) cur = w.length;
    else if (cur + 1 + w.length <= ancho) cur += 1 + w.length;
    else { n++; cur = w.length; }
  }

  for (let k = n; k <= n + 2; k++) {
    let best = null;
    const rec = (ini, quedan, cortes) => {
      if (quedan === 1) {
        const tramos = [...cortes, [ini, p.length]];
        const ls = tramos.map(([a, b]) => len(a, b));
        if (ls.some((l, i) => l > ancho || (i && l < ls[i - 1]))) return;
        const media = ls.reduce((s, l) => s + l, 0) / ls.length;
        const score = ls.reduce((s, l) => s + (l - media) ** 2, 0);
        if (!best || score < best.score) best = { score, tramos };
        return;
      }
      for (let fin = ini + 1; fin <= p.length - (quedan - 1); fin++) {
        if (len(ini, fin) > ancho) break;
        rec(fin, quedan - 1, [...cortes, [ini, fin]]);
      }
    };
    rec(0, k, []);
    if (best) return best.tramos.map(([a, b]) => p.slice(a, b).join(' ')).join('\n');
  }
  return p.join(' ');
}

// ---- Estimación de espacio en la primera hoja (unidad: 1 fila de tabla) ----
const LIMITES_COL = { numero_inventario: 12, tipo_equipo: 12, marca: 14, modelo: 15, numero_serie: 22 };
const AREA_HOJA_1 = 19.8;  // filas + cierre que caben en la hoja 1 (caso base: 4 filas, cargo de 2 líneas, intro de 4)
const AREA_HOJA_N = 35;    // filas + cierre que caben en las hojas siguientes
const CIERRE = { normal: 13.8, compacto: 12.1, minimo: 11.1 };

export function filasEquipo(eq) {
  return Math.max(1, ...Object.entries(LIMITES_COL).map(([k, lim]) => Math.ceil(String(eq[k] || '').length / lim)));
}

export function lineasIntro(oficio, fecha, frase) {
  return Math.ceil((290 + String(oficio).length + String(fecha).length + String(frase).length) / 90);
}

export function elegirModo({ equipos, lineasCargo, lineasIntroduccion }) {
  const filas = equipos.reduce((s, e) => s + filasEquipo(e), 0);
  let cap = AREA_HOJA_1 - (lineasCargo - 2) - (lineasIntroduccion - 4);
  let resto = filas;
  while (resto > cap) { resto -= cap; cap = AREA_HOJA_N; }
  const libre = cap - resto;
  for (const m of ['normal', 'compacto', 'minimo']) if (CIERRE[m] <= libre) return m;
  return libre >= CIERRE.minimo - 1.5 ? 'minimo' : 'normal';
}

export const ESPACIOS = {
  normal:   { sp_a1: true, sp_a2: true,  sp_a3: true,  sp_b1: true, sp_b2: true },
  compacto: { sp_a1: true, sp_a2: false, sp_a3: false, sp_b1: true, sp_b2: true },
  minimo:   { sp_a1: true, sp_a2: false, sp_a3: false, sp_b1: true, sp_b2: false }
};
