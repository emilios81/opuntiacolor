const {
  useState,
  useRef,
  useCallback,
  useEffect
} = React;
const OPC_LOGO = "data:image/jpeg;base64,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";

// ============================================================
// OPC – OpuntiaColor v3.2
// Decorrelation Stretch & pigment enhancement for archaeology
// v3.1: PCs ordenados, estadísticas por zona, CLAHE real,
//       imagen integral (rápido), TIFF válido, EXIF preservado
// v3.2: Procesado por lote para fotogrametría — pipeline con
//       estadísticas congeladas de la foto de referencia,
//       mismo nombre de archivo y EXIF conservado por foto
// ============================================================

// --- Color Conversion Core ---

function rgb2lab(r, g, b) {
  let rr = r / 255,
    gg = g / 255,
    bb = b / 255;
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
  let x = (rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) / 0.95047;
  let y = rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750;
  let z = (rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  x = f(x);
  y = f(y);
  z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
function lab2rgb(L, a, b) {
  let y = (L + 16) / 116,
    x = a / 500 + y,
    z = y - b / 200;
  const finv = t => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };
  x = 0.95047 * finv(x);
  y = 1.0 * finv(y);
  z = 1.08883 * finv(z);
  let rr = x * 3.2404542 - y * 1.5371385 - z * 0.4985314;
  let gg = -x * 0.9692660 + y * 1.8760108 + z * 0.0415560;
  let bb = x * 0.0556434 - y * 0.2040259 + z * 1.0572252;
  const gamma = c => c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
  return [Math.max(0, Math.min(255, Math.round(gamma(rr) * 255))), Math.max(0, Math.min(255, Math.round(gamma(gg) * 255))), Math.max(0, Math.min(255, Math.round(gamma(bb) * 255)))];
}
function rgb2ycbcr(r, g, b) {
  return [0.299 * r + 0.587 * g + 0.114 * b, 128 - 0.168736 * r - 0.331264 * g + 0.5 * b, 128 + 0.5 * r - 0.418688 * g - 0.081312 * b];
}
function ycbcr2rgb(y, cb, cr) {
  return [Math.max(0, Math.min(255, Math.round(y + 1.402 * (cr - 128)))), Math.max(0, Math.min(255, Math.round(y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128)))), Math.max(0, Math.min(255, Math.round(y + 1.772 * (cb - 128))))];
}

// ============================================================
// HELPERS ESTADÍSTICOS COMPARTIDOS
// Todos aceptan una máscara opcional (Uint8Array): las estadísticas
// se calculan solo sobre los píxeles seleccionados, como en DStretch.
// ============================================================

// Media y covarianza 3x3 sobre los píxeles de la máscara (o todos si no hay)
function meanCov3(CH, n, mask) {
  const mean = [0, 0, 0];
  let cnt = 0;
  for (let i = 0; i < n; i++) {
    if (mask && !mask[i]) continue;
    mean[0] += CH[0][i];
    mean[1] += CH[1][i];
    mean[2] += CH[2][i];
    cnt++;
  }
  if (!cnt) {
    mask = null;
    for (let i = 0; i < n; i++) {
      mean[0] += CH[0][i];
      mean[1] += CH[1][i];
      mean[2] += CH[2][i];
    }
    cnt = n;
  }
  mean[0] /= cnt;
  mean[1] /= cnt;
  mean[2] /= cnt;
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n; i++) {
    if (mask && !mask[i]) continue;
    const d0 = CH[0][i] - mean[0],
      d1 = CH[1][i] - mean[1],
      d2 = CH[2][i] - mean[2];
    cov[0][0] += d0 * d0;
    cov[0][1] += d0 * d1;
    cov[0][2] += d0 * d2;
    cov[1][1] += d1 * d1;
    cov[1][2] += d1 * d2;
    cov[2][2] += d2 * d2;
  }
  for (let j = 0; j < 3; j++) for (let k = j; k < 3; k++) {
    cov[j][k] /= cnt;
    cov[k][j] = cov[j][k];
  }
  const eps = 1e-10;
  cov[0][0] += eps;
  cov[1][1] += eps;
  cov[2][2] += eps;
  return {
    mean,
    cov,
    mask
  };
}

// Media y desvío estándar de un canal sobre la máscara (o todos)
function meanStd1(arr, n, mask) {
  let s = 0,
    cnt = 0;
  for (let i = 0; i < n; i++) {
    if (mask && !mask[i]) continue;
    s += arr[i];
    cnt++;
  }
  if (!cnt) {
    mask = null;
    for (let i = 0; i < n; i++) s += arr[i];
    cnt = n;
  }
  const m = s / cnt;
  let v = 0;
  for (let i = 0; i < n; i++) {
    if (mask && !mask[i]) continue;
    v += (arr[i] - m) ** 2;
  }
  return {
    mean: m,
    std: Math.sqrt(v / cnt) || 1
  };
}

// Eigendecomposición Jacobi 3x3 con eigenvectores ORDENADOS por
// eigenvalor descendente: PC1 es siempre la componente de mayor varianza.
// Sin esto, la asignación PC→canal era aleatoria y los resultados no
// eran comparables entre fotos.
function jacobiEigen3(cov) {
  let a = cov.map(r => [...r]),
    ev = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let it = 0; it < 50; it++) {
    let mx = 0,
      p = 0,
      q = 1;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(a[i][j]) > mx) {
      mx = Math.abs(a[i][j]);
      p = i;
      q = j;
    }
    if (mx < 1e-12) break;
    const th = 0.5 * Math.atan2(2 * a[p][q], a[p][p] - a[q][q]),
      co = Math.cos(th),
      si = Math.sin(th);
    const nA = a.map(r => [...r]);
    for (let i = 0; i < 3; i++) {
      nA[i][p] = co * a[i][p] + si * a[i][q];
      nA[i][q] = -si * a[i][p] + co * a[i][q];
    }
    for (let j = 0; j < 3; j++) {
      a[p][j] = co * nA[p][j] + si * nA[q][j];
      a[q][j] = -si * nA[p][j] + co * nA[q][j];
    }
    const nV = ev.map(r => [...r]);
    for (let i = 0; i < 3; i++) {
      ev[i][p] = co * nV[i][p] + si * nV[i][q];
      ev[i][q] = -si * nV[i][p] + co * nV[i][q];
    }
  }
  const eps = 1e-10;
  const order = [0, 1, 2].sort((x, y) => a[y][y] - a[x][x]);
  const stds = order.map(k => Math.sqrt(Math.max(a[k][k], eps)));
  const evS = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) evS[i][k] = ev[i][order[k]];
  return {
    ev: evS,
    stds
  };
}

// Summed-area table: promedio de cualquier ventana en O(1) por píxel.
// Reemplaza los muestreos por vecindario que congelaban el navegador.
function buildSAT(src, w, h) {
  const sat = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += src[y * w + x];
      sat[(y + 1) * (w + 1) + (x + 1)] = sat[y * (w + 1) + (x + 1)] + row;
    }
  }
  return sat;
}
function satMean(sat, w, x0, y0, x1, y1) {
  const W = w + 1;
  const s = sat[(y1 + 1) * W + (x1 + 1)] - sat[y0 * W + (x1 + 1)] - sat[(y1 + 1) * W + x0] + sat[y0 * W + x0];
  return s / ((x1 - x0 + 1) * (y1 - y0 + 1));
}

// ============================================================
// FILTER FUNCTIONS
// ============================================================

// --- Pinturas ---

function enhanceRedPigment(imageData, intensity = 1.5) {
  const data = imageData.data,
    n = data.length / 4,
    output = new Uint8ClampedArray(data.length);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    const [L, a, bL] = rgb2lab(r, g, b);
    const nA = a * intensity,
      nB = bL * (1 + (intensity - 1) * 0.3),
      nL = L + (a > 0 ? (intensity - 1) * 8 : -(intensity - 1) * 5);
    const [nr, ng, nb] = lab2rgb(Math.max(0, Math.min(100, nL)), Math.max(-128, Math.min(127, nA)), Math.max(-128, Math.min(127, nB)));
    output[i * 4] = nr;
    output[i * 4 + 1] = ng;
    output[i * 4 + 2] = nb;
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}
function enhanceWhitePigment(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    n = data.length / 4,
    output = new Uint8ClampedArray(data.length);
  const lv = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [L] = rgb2lab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    lv[i] = L;
  }
  // Estadísticas congeladas (lote) o calculadas sobre esta imagen
  const {
    mean: mL,
    std: stdL
  } = store && store.frozen || meanStd1(lv, n, mask);
  if (store && !store.frozen) store.frozen = {
    mean: mL,
    std: stdL
  };
  for (let i = 0; i < n; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    const [L, a, bL] = rgb2lab(r, g, b);
    const z = (L - mL) / (stdL || 1),
      boost = z > 0 ? z * intensity * 5 : z * intensity * 2,
      nL = Math.max(0, Math.min(100, L + boost)),
      sf = L > mL ? 1 / (1 + (intensity - 1) * 0.5) : 1;
    const [nr, ng, nb] = lab2rgb(nL, a * sf, bL * sf);
    output[i * 4] = nr;
    output[i * 4 + 1] = ng;
    output[i * 4 + 2] = nb;
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}
function enhanceBichrome(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    n = data.length / 4,
    output = new Uint8ClampedArray(data.length);
  const labs = new Array(n);
  const lv = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    labs[i] = rgb2lab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    lv[i] = labs[i][0];
  }
  const mL = store && store.frozen ? store.frozen.mL : meanStd1(lv, n, mask).mean;
  if (store && !store.frozen) store.frozen = {
    mL
  };
  for (let i = 0; i < n; i++) {
    let [L, a, bL] = labs[i];
    const rb = a > 5 ? intensity * 1.3 : a > 0 ? intensity : 1,
      nA = a * rb,
      ch = Math.sqrt(a * a + bL * bL),
      isW = L > mL && ch < 25,
      wb = isW ? (L - mL) * intensity * 0.15 : 0,
      nL = Math.max(0, Math.min(100, L + wb)),
      isR = !isW && a < 5 && L < mL,
      rs = isR ? 0.7 : 1;
    const [nr, ng, nb] = lab2rgb(nL * rs + (1 - rs) * (nL * 0.6), Math.max(-128, Math.min(127, nA)), Math.max(-128, Math.min(127, bL * (isW ? 0.5 : 1))));
    output[i * 4] = nr;
    output[i * 4 + 1] = ng;
    output[i * 4 + 2] = nb;
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}
function enhanceBlackPigment(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    n = data.length / 4,
    output = new Uint8ClampedArray(data.length);
  const lv = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [L] = rgb2lab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    lv[i] = L;
  }
  const {
    mean: mL,
    std: stdL
  } = store && store.frozen || meanStd1(lv, n, mask);
  if (store && !store.frozen) store.frozen = {
    mean: mL,
    std: stdL
  };
  for (let i = 0; i < n; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    const [L, a, bL] = rgb2lab(r, g, b);
    const ch = Math.sqrt(a * a + bL * bL),
      z = (L - mL) / stdL,
      isDLC = L < mL && ch < 20;
    let nL = L,
      nA = a,
      nB = bL;
    if (isDLC) {
      const df = Math.max(0, (mL - L) / mL);
      nL = L - df * intensity * 18;
      const cr = 1 / (1 + (intensity - 1) * 0.8);
      nA = a * cr;
      nB = bL * cr;
    } else {
      nL = L + Math.max(0, z) * intensity * 3;
      nA = a * (1 + (intensity - 1) * 0.15);
      nB = bL * (1 + (intensity - 1) * 0.15);
    }
    const [nr, ng, nb] = lab2rgb(Math.max(0, Math.min(100, nL)), Math.max(-128, Math.min(127, nA)), Math.max(-128, Math.min(127, nB)));
    output[i * 4] = nr;
    output[i * 4 + 1] = ng;
    output[i * 4 + 2] = nb;
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}

// --- Grabados ---

function enhancePetroglyph(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    w = imageData.width,
    h = imageData.height,
    n = w * h;
  const output = new Uint8ClampedArray(data.length);
  const Lchan = new Float64Array(n),
    Achan = new Float64Array(n),
    Bchan = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [L, a, b] = rgb2lab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    Lchan[i] = L;
    Achan[i] = a;
    Bchan[i] = b;
  }
  const scaleSmall = Math.max(8, Math.floor(Math.min(w, h) / 40));
  const scaleLarge = Math.max(24, Math.floor(Math.min(w, h) / 10));
  // Promedios locales exactos vía imagen integral: O(1) por píxel
  const sat = buildSAT(Lchan, w, h);
  const localEnhL = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const x = i % w,
      y = i / w | 0;
    const mS = satMean(sat, w, Math.max(0, x - scaleSmall), Math.max(0, y - scaleSmall), Math.min(w - 1, x + scaleSmall), Math.min(h - 1, y + scaleSmall));
    const mLg = satMean(sat, w, Math.max(0, x - scaleLarge), Math.max(0, y - scaleLarge), Math.min(w - 1, x + scaleLarge), Math.min(h - 1, y + scaleLarge));
    const devS = (Lchan[i] - mS) * intensity * 2.5,
      devL = (Lchan[i] - mLg) * intensity * 1.2;
    localEnhL[i] = Lchan[i] + devS * 0.6 + devL * 0.4;
  }
  const edges = new Float64Array(n);
  let maxEdge = 0;
  for (let i = 0; i < n; i++) {
    const x = i % w,
      y = Math.floor(i / w);
    if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
      edges[i] = 0;
      continue;
    }
    const gx = -Lchan[(y - 1) * w + (x - 1)] + Lchan[(y - 1) * w + (x + 1)] - 2 * Lchan[y * w + (x - 1)] + 2 * Lchan[y * w + (x + 1)] - Lchan[(y + 1) * w + (x - 1)] + Lchan[(y + 1) * w + (x + 1)];
    const gy = -Lchan[(y - 1) * w + (x - 1)] - 2 * Lchan[(y - 1) * w + x] - Lchan[(y - 1) * w + (x + 1)] + Lchan[(y + 1) * w + (x - 1)] + 2 * Lchan[(y + 1) * w + x] + Lchan[(y + 1) * w + (x + 1)];
    edges[i] = Math.sqrt(gx * gx + gy * gy);
    if (edges[i] > maxEdge) maxEdge = edges[i];
  }
  // Rango cromático sobre la zona seleccionada (o toda la imagen),
  // o congelado desde la foto de referencia en modo lote
  let minA = Infinity,
    maxA = -Infinity,
    minB = Infinity,
    maxB = -Infinity;
  if (store && store.frozen) {
    ({
      minA,
      maxA,
      minB,
      maxB
    } = store.frozen);
  } else {
    for (let i = 0; i < n; i++) {
      if (mask && !mask[i]) continue;
      if (Achan[i] < minA) minA = Achan[i];
      if (Achan[i] > maxA) maxA = Achan[i];
      if (Bchan[i] < minB) minB = Bchan[i];
      if (Bchan[i] > maxB) maxB = Bchan[i];
    }
    if (minA === Infinity) {
      for (let i = 0; i < n; i++) {
        if (Achan[i] < minA) minA = Achan[i];
        if (Achan[i] > maxA) maxA = Achan[i];
        if (Bchan[i] < minB) minB = Bchan[i];
        if (Bchan[i] > maxB) maxB = Bchan[i];
      }
    }
    if (store) store.frozen = {
      minA,
      maxA,
      minB,
      maxB
    };
  }
  const rangeA = maxA - minA || 1,
    rangeB = maxB - minB || 1,
    chromaBoost = intensity * 3;
  const edgeNorm = maxEdge || 1,
    edgeMix = intensity * 0.25;
  for (let i = 0; i < n; i++) {
    let newL = localEnhL[i] + edges[i] / edgeNorm * 20 * edgeMix;
    newL = Math.max(0, Math.min(100, newL));
    const midA = (minA + maxA) / 2,
      midB = (minB + maxB) / 2;
    let newA = midA + (Achan[i] - midA) * chromaBoost,
      newB = midB + (Bchan[i] - midB) * chromaBoost;
    newA = Math.max(-128, Math.min(127, newA));
    newB = Math.max(-128, Math.min(127, newB));
    const [r, g, b] = lab2rgb(newL, newA, newB);
    output[i * 4] = r;
    output[i * 4 + 1] = g;
    output[i * 4 + 2] = b;
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, w, h);
}

// CRGB — Decorrelation Stretch puro en RGB
// Mapeo directo de componentes principales a canales R,G,B
// SIN reproyectar al espacio original — máxima separación cromática
function crgbEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    w = imageData.width,
    h = imageData.height,
    n = w * h;

  // Paso 1: Leer RGB como float
  const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    CH[0][i] = data[i * 4];
    CH[1][i] = data[i * 4 + 1];
    CH[2][i] = data[i * 4 + 2];
  }

  // Paso 2-4: Matriz congelada del lote, o media/covarianza + Jacobi
  // (sobre la zona seleccionada si la hay)
  const frozen = store && store.frozen;
  let mean, ev, stds;
  if (frozen) {
    ({
      mean,
      ev,
      stds
    } = frozen);
  } else {
    const stats = meanCov3(CH, n, mask);
    mask = stats.mask;
    mean = stats.mean;
    ({
      ev,
      stds
    } = jacobiEigen3(stats.cov));
  }

  // Paso 5: Proyectar a PCs y ecualizar varianza
  // CLAVE: cada PC normalizada se asigna DIRECTO a un canal RGB
  // PC1→R, PC2→G, PC3→B — sin reproyección al espacio original
  const pc = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const d0 = CH[0][i] - mean[0],
      d1 = CH[1][i] - mean[1],
      d2 = CH[2][i] - mean[2];
    for (let k = 0; k < 3; k++) {
      pc[k][i] = (ev[0][k] * d0 + ev[1][k] * d1 + ev[2][k] * d2) / stds[k];
    }
  }

  // Paso 6: Normalizar cada PC independientemente a 0-255
  // Recorte por percentil para máximo contraste (más bajo = más agresivo)
  // En modo lote los recortes también van congelados: misma normalización
  // en todas las fotos → colores idénticos en todo el lote
  const output = new Uint8ClampedArray(data.length);
  let clips;
  if (frozen) {
    clips = frozen.clips;
  } else {
    const clipStd = Math.max(0.8, 3.5 / intensity); // intensity alta = clip más agresivo
    clips = [];
    for (let k = 0; k < 3; k++) {
      const st = meanStd1(pc[k], n, mask);
      clips.push({
        lo: st.mean - st.std * clipStd,
        hi: st.mean + st.std * clipStd
      });
    }
    if (store) store.frozen = {
      mean,
      ev,
      stds,
      clips
    };
  }
  for (let k = 0; k < 3; k++) {
    const {
        lo,
        hi
      } = clips[k],
      range = hi - lo || 1;
    for (let i = 0; i < n; i++) {
      const clamped = Math.max(lo, Math.min(hi, pc[k][i]));
      output[i * 4 + k] = Math.round((clamped - lo) / range * 255);
    }
  }
  for (let i = 0; i < n; i++) output[i * 4 + 3] = 255;
  return new ImageData(output, w, h);
}

// NUEVO: Mapa de Relieve — Solo detección de bordes multi-escala
// Genera un "calco digital" ideal para grabados rupestres
function reliefMap(imageData, intensity = 1.5) {
  const data = imageData.data,
    w = imageData.width,
    h = imageData.height,
    n = w * h;
  const output = new Uint8ClampedArray(data.length);
  const lum = new Float64Array(n);
  for (let i = 0; i < n; i++) lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];

  // Multi-scale Sobel: escala fina (surcos) + gruesa (paneles)
  const edges = new Float64Array(n);
  let maxEdge = 0;
  for (let i = 0; i < n; i++) {
    const x = i % w,
      y = Math.floor(i / w);
    if (x < 2 || x >= w - 2 || y < 2 || y >= h - 2) {
      edges[i] = 0;
      continue;
    }
    // 3x3 Sobel
    const gx1 = -lum[(y - 1) * w + (x - 1)] + lum[(y - 1) * w + (x + 1)] - 2 * lum[y * w + (x - 1)] + 2 * lum[y * w + (x + 1)] - lum[(y + 1) * w + (x - 1)] + lum[(y + 1) * w + (x + 1)];
    const gy1 = -lum[(y - 1) * w + (x - 1)] - 2 * lum[(y - 1) * w + x] - lum[(y - 1) * w + (x + 1)] + lum[(y + 1) * w + (x - 1)] + 2 * lum[(y + 1) * w + x] + lum[(y + 1) * w + (x + 1)];
    // 5x5 extended
    const gx2 = -lum[(y - 2) * w + (x - 2)] + lum[(y - 2) * w + (x + 2)] - 2 * lum[y * w + (x - 2)] + 2 * lum[y * w + (x + 2)] - lum[(y + 2) * w + (x - 2)] + lum[(y + 2) * w + (x + 2)];
    const gy2 = -lum[(y - 2) * w + (x - 2)] - 2 * lum[(y - 2) * w + x] - lum[(y - 2) * w + (x + 2)] + lum[(y + 2) * w + (x - 2)] + 2 * lum[(y + 2) * w + x] + lum[(y + 2) * w + (x + 2)];
    edges[i] = Math.sqrt(gx1 * gx1 + gy1 * gy1) * 0.65 + Math.sqrt(gx2 * gx2 + gy2 * gy2) * 0.35;
    if (edges[i] > maxEdge) maxEdge = edges[i];
  }
  const norm = maxEdge || 1;
  for (let i = 0; i < n; i++) {
    const e = Math.pow(Math.min(1, edges[i] / norm * intensity * 1.2), 0.7);
    const v = Math.round(e * 255);
    // Falso color cálido para mejor lectura: bordes claros sobre fondo oscuro
    output[i * 4] = Math.min(255, Math.round(v * 1.05));
    output[i * 4 + 1] = Math.min(255, Math.round(v * 0.92));
    output[i * 4 + 2] = Math.min(255, Math.round(v * 0.78));
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, w, h);
}

// --- Técnico ---

function ybkEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    n = data.length / 4,
    output = new Uint8ClampedArray(data.length);
  // Estadísticas de crominancia sobre la zona seleccionada (o toda la imagen)
  const Yc = new Float64Array(n),
    Cbc = new Float64Array(n),
    Crc = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [y, cb, cr] = rgb2ycbcr(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    Yc[i] = y;
    Cbc[i] = cb;
    Crc[i] = cr;
  }
  let mCb, mCr, mY, stdCb, stdCr;
  if (store && store.frozen) {
    ({
      mCb,
      mCr,
      mY,
      stdCb,
      stdCr
    } = store.frozen);
  } else {
    const sY = meanStd1(Yc, n, mask),
      sCb = meanStd1(Cbc, n, mask),
      sCr = meanStd1(Crc, n, mask);
    mCb = sCb.mean;
    mCr = sCr.mean;
    mY = sY.mean;
    stdCb = sCb.std;
    stdCr = sCr.std;
    if (store) store.frozen = {
      mCb,
      mCr,
      mY,
      stdCb,
      stdCr
    };
  }
  // Factor de amplificación agresivo: normalizar crominancia y luego escalar
  const chromaBoost = intensity * 3.0; // 3x más agresivo que antes
  const lumaContrast = 1 + (intensity - 1) * 0.6; // contraste en luminancia
  for (let i = 0; i < n; i++) {
    // Ecualizar crominancia: centrar, normalizar por std, escalar agresivamente
    const cb = 128 + (Cbc[i] - mCb) / stdCb * 40 * chromaBoost;
    const cr = 128 + (Crc[i] - mCr) / stdCr * 40 * chromaBoost;
    // Contraste en luminancia
    const y = mY + (Yc[i] - mY) * lumaContrast;
    const [nr, ng, nb] = ycbcr2rgb(Math.max(0, Math.min(255, y)), Math.max(0, Math.min(255, cb)), Math.max(0, Math.min(255, cr)));
    output[i * 4] = nr;
    output[i * 4 + 1] = ng;
    output[i * 4 + 2] = nb;
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}

// LDS — Decorrelation Stretch en RGB con reproyección ecualizada
// Amplifica componentes menores manteniendo aspecto más natural que CRGB
function ldsEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    w = imageData.width,
    h = imageData.height,
    n = w * h;
  const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    CH[0][i] = data[i * 4];
    CH[1][i] = data[i * 4 + 1];
    CH[2][i] = data[i * 4 + 2];
  }
  const frozen = store && store.frozen;
  let mean, ev, stds;
  if (frozen) {
    ({
      mean,
      ev,
      stds
    } = frozen);
  } else {
    const stats = meanCov3(CH, n, mask);
    mask = stats.mask;
    mean = stats.mean;
    ({
      ev,
      stds
    } = jacobiEigen3(stats.cov));
  }
  const tgtStd = (stds[0] + stds[1] + stds[2]) / 3;
  const boost = intensity * 2.0;
  const output = new Uint8ClampedArray(data.length);
  const out = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const d0 = CH[0][i] - mean[0],
      d1 = CH[1][i] - mean[1],
      d2 = CH[2][i] - mean[2];
    let pc0 = (ev[0][0] * d0 + ev[1][0] * d1 + ev[2][0] * d2) / stds[0] * tgtStd * boost;
    let pc1 = (ev[0][1] * d0 + ev[1][1] * d1 + ev[2][1] * d2) / stds[1] * tgtStd * boost;
    let pc2 = (ev[0][2] * d0 + ev[1][2] * d1 + ev[2][2] * d2) / stds[2] * tgtStd * boost;
    out[0][i] = mean[0] + ev[0][0] * pc0 + ev[0][1] * pc1 + ev[0][2] * pc2;
    out[1][i] = mean[1] + ev[1][0] * pc0 + ev[1][1] * pc1 + ev[1][2] * pc2;
    out[2][i] = mean[2] + ev[2][0] * pc0 + ev[2][1] * pc1 + ev[2][2] * pc2;
  }
  // Normalización con rango tomado de la zona seleccionada (o toda la
  // imagen); en modo lote los rangos van congelados de la referencia
  const ranges = frozen ? frozen.ranges : [];
  for (let ch = 0; ch < 3; ch++) {
    let mn, mx;
    if (frozen) {
      ({
        mn,
        mx
      } = ranges[ch]);
    } else {
      mn = Infinity;
      mx = -Infinity;
      for (let i = 0; i < n; i++) {
        if (mask && !mask[i]) continue;
        if (out[ch][i] < mn) mn = out[ch][i];
        if (out[ch][i] > mx) mx = out[ch][i];
      }
      if (mn === Infinity) {
        for (let i = 0; i < n; i++) {
          if (out[ch][i] < mn) mn = out[ch][i];
          if (out[ch][i] > mx) mx = out[ch][i];
        }
      }
      ranges.push({
        mn,
        mx
      });
    }
    const rng = mx - mn || 1;
    for (let i = 0; i < n; i++) output[i * 4 + ch] = Math.max(0, Math.min(255, Math.round((out[ch][i] - mn) / rng * 255)));
  }
  if (store && !store.frozen) store.frozen = {
    mean,
    ev,
    stds,
    ranges
  };
  for (let i = 0; i < n; i++) output[i * 4 + 3] = 255;
  return new ImageData(output, w, h);
}

// DS-LAB — Decorrelation Stretch en CIE-LAB con mapeo directo de PCs
// Más sensible a diferencias perceptuales; PCs se mapean directo a RGB
function dsLabEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    w = imageData.width,
    h = imageData.height,
    n = w * h;
  const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const [L, a, b] = rgb2lab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    CH[0][i] = L;
    CH[1][i] = a;
    CH[2][i] = b;
  }
  const frozen = store && store.frozen;
  let mean, ev, stds;
  if (frozen) {
    ({
      mean,
      ev,
      stds
    } = frozen);
  } else {
    const stats = meanCov3(CH, n, mask);
    mask = stats.mask;
    mean = stats.mean;
    ({
      ev,
      stds
    } = jacobiEigen3(stats.cov));
  }
  // Mapeo directo PC→RGB (como CRGB pero desde espacio LAB)
  const pc = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const d0 = CH[0][i] - mean[0],
      d1 = CH[1][i] - mean[1],
      d2 = CH[2][i] - mean[2];
    for (let k = 0; k < 3; k++) pc[k][i] = (ev[0][k] * d0 + ev[1][k] * d1 + ev[2][k] * d2) / stds[k];
  }
  const output = new Uint8ClampedArray(data.length);
  let clips;
  if (frozen) {
    clips = frozen.clips;
  } else {
    const clipStd = Math.max(0.8, 3.5 / intensity);
    clips = [];
    for (let k = 0; k < 3; k++) {
      const st = meanStd1(pc[k], n, mask);
      clips.push({
        lo: st.mean - st.std * clipStd,
        hi: st.mean + st.std * clipStd
      });
    }
    if (store) store.frozen = {
      mean,
      ev,
      stds,
      clips
    };
  }
  for (let k = 0; k < 3; k++) {
    const {
        lo,
        hi
      } = clips[k],
      rng = hi - lo || 1;
    for (let i = 0; i < n; i++) {
      const v = Math.max(lo, Math.min(hi, pc[k][i]));
      output[i * 4 + k] = Math.round((v - lo) / rng * 255);
    }
  }
  for (let i = 0; i < n; i++) output[i * 4 + 3] = 255;
  return new ImageData(output, w, h);
}

// CLAHE real (Zuiderveld 1994): ecualización adaptativa de histograma
// con límite de contraste. Grilla de 8×8 tiles, histograma de 256 bins
// por tile con recorte y redistribución, e interpolación bilineal entre
// los mapeos de los 4 tiles vecinos. La intensidad controla el clip limit.
function claheEnhance(imageData, intensity = 1.5) {
  const data = imageData.data,
    w = imageData.width,
    h = imageData.height,
    n = w * h;
  const output = new Uint8ClampedArray(data.length);
  const lum = new Float64Array(n);
  for (let i = 0; i < n; i++) lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  const grid = 8;
  const tw = Math.ceil(w / grid),
    th = Math.ceil(h / grid);
  const nx = Math.ceil(w / tw),
    ny = Math.ceil(h / th);
  const clipFactor = 1 + intensity * 2; // límite de recorte relativo al histograma uniforme
  const maps = new Array(nx * ny);
  for (let ty = 0; ty < ny; ty++) for (let tx = 0; tx < nx; tx++) {
    const x0 = tx * tw,
      y0 = ty * th,
      x1 = Math.min(w, x0 + tw),
      y1 = Math.min(h, y0 + th);
    const hist = new Float64Array(256);
    let cnt = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      hist[Math.max(0, Math.min(255, Math.round(lum[y * w + x])))]++;
      cnt++;
    }
    if (!cnt) cnt = 1;
    // Recorte del histograma y redistribución uniforme del exceso
    const clip = Math.max(1, clipFactor * cnt / 256);
    let excess = 0;
    for (let v = 0; v < 256; v++) {
      if (hist[v] > clip) {
        excess += hist[v] - clip;
        hist[v] = clip;
      }
    }
    const add = excess / 256;
    // CDF → función de mapeo del tile
    const map = new Float64Array(256);
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v] + add;
      map[v] = acc / cnt * 255;
    }
    maps[ty * nx + tx] = map;
  }
  for (let i = 0; i < n; i++) {
    const x = i % w,
      y = i / w | 0;
    // Posición fraccional respecto a los centros de tile → interpolación bilineal
    const fx = Math.max(0, Math.min(nx - 1, (x - tw / 2) / tw)),
      fy = Math.max(0, Math.min(ny - 1, (y - th / 2) / th));
    const tx0 = Math.floor(fx),
      ty0 = Math.floor(fy),
      tx1 = Math.min(nx - 1, tx0 + 1),
      ty1 = Math.min(ny - 1, ty0 + 1);
    const ax = fx - tx0,
      ay = fy - ty0;
    const v = Math.max(0, Math.min(255, Math.round(lum[i])));
    const m00 = maps[ty0 * nx + tx0][v],
      m10 = maps[ty0 * nx + tx1][v],
      m01 = maps[ty1 * nx + tx0][v],
      m11 = maps[ty1 * nx + tx1][v];
    const newLum = (m00 * (1 - ax) + m10 * ax) * (1 - ay) + (m01 * (1 - ax) + m11 * ax) * ay;
    const ratio = lum[i] > 0.5 ? newLum / lum[i] : 1;
    for (let ch = 0; ch < 3; ch++) output[i * 4 + ch] = Math.max(0, Math.min(255, Math.round(data[i * 4 + ch] * ratio)));
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, w, h);
}
function pigmentMapping(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data,
    n = data.length / 4,
    output = new Uint8ClampedArray(data.length);
  const labs = new Array(n);
  const lv = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    labs[i] = rgb2lab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    lv[i] = labs[i][0];
  }
  const mL = store && store.frozen ? store.frozen.mL : meanStd1(lv, n, mask).mean;
  if (store && !store.frozen) store.frozen = {
    mL
  };
  for (let i = 0; i < n; i++) {
    const [L, a, bL] = labs[i];
    const ch = Math.sqrt(a * a + bL * bL);
    if (a > 8 && ch > 12) {
      const ri = Math.min(1, a / 40);
      output[i * 4] = Math.round(255 * ri);
      output[i * 4 + 1] = Math.round(80 * (1 - ri));
      output[i * 4 + 2] = 0;
    } else if (L < mL - 10 && ch < 15) {
      const bi = Math.min(1, (mL - L) / (mL * 0.6));
      output[i * 4] = Math.round(40 * (1 - bi));
      output[i * 4 + 1] = Math.round(200 + 55 * bi);
      output[i * 4 + 2] = Math.round(40 * (1 - bi));
    } else if (L > 65 && ch < 18) {
      const wi = Math.min(1, (L - 65) / 35);
      output[i * 4] = Math.round(100 * (1 - wi));
      output[i * 4 + 1] = Math.round(200 + 55 * wi);
      output[i * 4 + 2] = Math.round(220 + 35 * wi);
    } else {
      const g = Math.min(255, Math.round(L * 1.2));
      output[i * 4] = g;
      output[i * 4 + 1] = g;
      output[i * 4 + 2] = g;
    }
    output[i * 4 + 3] = 255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}

// ============================================================
// EXIF / GPS PARSER
// ============================================================

// Extrae el segmento APP1 (EXIF) crudo de un JPEG, incluyendo marcador y
// longitud, para reinyectarlo en el JPG exportado y no perder GPS/fecha.
function extractExifSegment(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return null;
  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) {
      const length = view.getUint16(offset + 2);
      return new Uint8Array(arrayBuffer.slice(offset, Math.min(view.byteLength, offset + 2 + length)));
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}
function parseExifData(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0) !== 0xFFD8) return null;
  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) {
      const length = view.getUint16(offset + 2);
      return parseExifBlock(arrayBuffer, offset + 4, length - 2);
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}
function parseExifBlock(buffer, start, length) {
  const view = new DataView(buffer, start, Math.min(length, buffer.byteLength - start));
  if (view.getUint32(0) !== 0x45786966 || view.getUint16(4) !== 0x0000) return null;
  const tiffStart = start + 6,
    tiffView = new DataView(buffer, tiffStart);
  const le = tiffView.getUint16(0) === 0x4949;
  const ifdOff = tiffView.getUint32(4, le);
  const result = {
    dateTime: null,
    gps: null
  };
  const ifd0 = parseIFD(buffer, tiffStart, ifdOff, le);
  if (ifd0[0x0132]) result.dateTime = ifd0[0x0132];
  if (ifd0[0x8769]) {
    const exifIFD = parseIFD(buffer, tiffStart, ifd0[0x8769], le);
    if (exifIFD[0x9003]) result.dateTime = exifIFD[0x9003];else if (exifIFD[0x9004]) result.dateTime = exifIFD[0x9004];
  }
  if (ifd0[0x8825]) {
    const gpsIFD = parseIFD(buffer, tiffStart, ifd0[0x8825], le);
    result.gps = extractGPS(gpsIFD);
  }
  return result;
}
function parseIFD(buffer, tiffStart, ifdOffset, le) {
  const view = new DataView(buffer, tiffStart);
  const entries = {};
  try {
    const count = view.getUint16(ifdOffset, le);
    for (let i = 0; i < count; i++) {
      const eOff = ifdOffset + 2 + i * 12,
        tag = view.getUint16(eOff, le),
        type = view.getUint16(eOff + 2, le),
        numV = view.getUint32(eOff + 4, le),
        vOff = eOff + 8;
      const typeSize = {
        1: 1,
        2: 1,
        3: 2,
        4: 4,
        5: 8,
        7: 1,
        10: 8
      };
      const totalBytes = (typeSize[type] || 1) * numV;
      const realOff = totalBytes > 4 ? tiffStart + view.getUint32(vOff, le) : tiffStart + eOff + 8;
      if (type === 2) {
        let str = "";
        for (let j = 0; j < numV - 1; j++) {
          const cc = new DataView(buffer).getUint8(realOff + j);
          if (cc === 0) break;
          str += String.fromCharCode(cc);
        }
        entries[tag] = str;
      } else if (type === 3) {
        entries[tag] = view.getUint16(vOff, le);
      } else if (type === 4) {
        entries[tag] = view.getUint32(vOff, le);
      } else if (type === 5) {
        const rV = new DataView(buffer, realOff);
        if (numV === 1) {
          entries[tag] = rV.getUint32(0, le) / (rV.getUint32(4, le) || 1);
        } else {
          const rats = [];
          for (let j = 0; j < numV; j++) rats.push(rV.getUint32(j * 8, le) / (rV.getUint32(j * 8 + 4, le) || 1));
          entries[tag] = rats;
        }
      } else if (type === 1) {
        entries[tag] = new DataView(buffer).getUint8(realOff);
      }
    }
  } catch (e) {}
  return entries;
}
function extractGPS(gpsIFD) {
  const latRef = gpsIFD[1] || "N",
    lat = gpsIFD[2],
    lonRef = gpsIFD[3] || "W",
    lon = gpsIFD[4],
    alt = gpsIFD[6];
  if (!lat || !lon || !Array.isArray(lat) || !Array.isArray(lon)) return null;
  const toD = (dms, ref) => {
    const d = dms[0] + dms[1] / 60 + (dms[2] || 0) / 3600;
    return ref === "S" || ref === "W" ? -d : d;
  };
  return {
    latitude: toD(lat, latRef),
    longitude: toD(lon, lonRef),
    altitude: typeof alt === "number" ? alt : null,
    latRef,
    lonRef
  };
}
function formatGPSCoord(decimal, isLat) {
  const abs = Math.abs(decimal),
    d = Math.floor(abs),
    m = Math.floor((abs - d) * 60),
    s = ((abs - d - m / 60) * 3600).toFixed(1);
  return `${d}\u00B0 ${m}' ${s}" ${isLat ? decimal >= 0 ? "N" : "S" : decimal >= 0 ? "E" : "W"}`;
}

// ============================================================
// THEMES
// ============================================================

const TD = {
  bg: "#1a1714",
  text: "#e8e0d4",
  tm: "#8a7e6e",
  td: "#6a5e4e",
  ac: "#c0392b",
  acBg: "rgba(192,57,43,0.12)",
  acBd: "rgba(192,57,43,0.35)",
  cBg: "rgba(232,224,212,0.04)",
  cBd: "rgba(232,224,212,0.08)",
  hBd: "rgba(232,224,212,0.08)",
  ov: "rgba(26,23,20,0.7)",
  gn: "#6db85d",
  gnBg: "rgba(109,184,93,0.1)",
  gnBd: "rgba(109,184,93,0.15)",
  iBg: "#0e0d0b",
  fTx: "#5a4e3e",
  fBd: "rgba(232,224,212,0.06)",
  bBg: "rgba(232,224,212,0.06)",
  sT: "rgba(232,224,212,0.15)",
  tB: "#1a1714"
};
const TS = {
  bg: "#FFFFFF",
  text: "#000000",
  tm: "#333333",
  td: "#555555",
  ac: "#B71C1C",
  acBg: "rgba(183,28,28,0.1)",
  acBd: "rgba(183,28,28,0.4)",
  cBg: "#F5F5F5",
  cBd: "#CCCCCC",
  hBd: "#BBBBBB",
  ov: "rgba(255,255,255,0.8)",
  gn: "#2E7D32",
  gnBg: "rgba(46,125,50,0.1)",
  gnBd: "rgba(46,125,50,0.3)",
  iBg: "#EEEEEE",
  fTx: "#555555",
  fBd: "#CCCCCC",
  bBg: "#EEEEEE",
  sT: "#BBBBBB",
  tB: "#FFFFFF"
};

// ============================================================
// PRESETS (con categorías)
// ============================================================

const PRESETS = [{
  id: "red",
  name: "Rojo",
  desc: "Pinturas y pigmentos rojos / ocres",
  icon: "\uD83D\uDD34",
  fn: enhanceRedPigment
}, {
  id: "white",
  name: "Blanco",
  desc: "Pinturas y pigmentos blancos / claros",
  icon: "\u26AA",
  fn: enhanceWhitePigment
}, {
  id: "black",
  name: "Negro",
  desc: "Pigmentos oscuros / negros / carbones",
  icon: "\u26AB",
  fn: enhanceBlackPigment
}, {
  id: "bichrome",
  name: "Bicromo",
  desc: "Combina realce rojo + blanco",
  icon: "\u25D1",
  fn: enhanceBichrome
}, {
  id: "crgb",
  name: "CRGB",
  desc: "Decorrelaci\u00F3n pura RGB / variabilidad espectral",
  icon: "\uD83C\uDF08",
  fn: crgbEnhance
}, {
  id: "dslab",
  name: "DS-LAB",
  desc: "Decorrelaci\u00F3n perceptual CIE-LAB / pigmentos sutiles",
  icon: "\uD83D\uDD35",
  fn: dsLabEnhance
}, {
  id: "lds",
  name: "LDS",
  desc: "Decorrelation Stretch RGB / an\u00E1lisis general",
  icon: "\uD83D\uDFE3",
  fn: ldsEnhance
}, {
  id: "petro",
  name: "Micro-relieve",
  desc: "P\u00E1tina + textura + bordes / grabados y surcos",
  icon: "\uD83E\uDEA8",
  fn: enhancePetroglyph
}, {
  id: "relief",
  name: "Relieve",
  desc: "Mapa de bordes multi-escala / calco digital",
  icon: "\uD83D\uDDFA",
  fn: reliefMap
}, {
  id: "ybk",
  name: "YBK",
  desc: "Crominancia YCbCr / separaci\u00F3n crom\u00E1tica",
  icon: "\uD83D\uDFE1",
  fn: ybkEnhance
}, {
  id: "clahe",
  name: "CLAHE",
  desc: "Ecualizaci\u00F3n adaptativa de histograma / sombras",
  icon: "\u25D0",
  fn: claheEnhance
}, {
  id: "map",
  name: "Mapa pigmentos",
  desc: "Falso color por tipo de pigmento detectado",
  icon: "\uD83D\uDDFA\uFE0F",
  fn: pigmentMapping
}];
const INTENSITY_PRESETS = [{
  label: "Sutil",
  value: 0.4
}, {
  label: "Suave",
  value: 1.0
}, {
  label: "Medio",
  value: 1.8
}, {
  label: "Fuerte",
  value: 3.0
}, {
  label: "Extremo",
  value: 4.5
}];

// ============================================================
// MAIN COMPONENT
// ============================================================

function RockArtEnhancer() {
  const [image, setImage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [processedSrc, setProcessedSrc] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [intensity, setIntensity] = useState(1.5);
  const [processing, setProcessing] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imageSize, setImageSize] = useState({
    w: 0,
    h: 0
  });
  const [solar, setSolar] = useState(false);
  const [exifData, setExifData] = useState(null);
  // Segmento EXIF crudo (APP1) para reinyectar en el JPG exportado
  const [exifRaw, setExifRaw] = useState(null);
  // Resolución de trabajo: 2000px (rápido) o completa (hasta 8192px)
  const [fullRes, setFullRes] = useState(false);
  // NUEVO: modo acumular (stacking)
  const [stackMode, setStackMode] = useState(false);
  // NUEVO: ajustes post-procesamiento
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  // NUEVO: formato de exportación
  const [exportFmt, setExportFmt] = useState("png"); // png|jpg|tiff
  // NUEVO: herramientas de selección — solo 2 estados React
  const [selTool, setSelTool] = useState("none"); // none|rect|circle|free
  const [selData, setSelData] = useState(null); // {type,x1,y1,x2,y2} or {type,points:[]}
  const drawRef = useRef({
    active: false,
    tool: "",
    start: null,
    pts: []
  });
  // NUEVO v3.2: pipeline registrado para procesado por lote (fotogrametría)
  // Cada paso: { presetId, intensity, frozen } — frozen son las estadísticas
  // capturadas de la foto de referencia (matriz congelada, como DStretch)
  const pipelineRef = useRef([]);
  const [showBatch, setShowBatch] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchFmt, setBatchFmt] = useState("jpg"); // jpg|png|tiff
  const [batchRes, setBatchRes] = useState(8192); // 8192|4000|2000
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    done: 0,
    total: 0,
    current: "",
    errors: []
  });
  const batchInputRef = useRef(null);
  const batchCancelRef = useRef(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const compareRef = useRef(null);
  const T = solar ? TS : TD;

  // Calcular el área real de la imagen dentro del contenedor (objectFit contain)
  const getImageBounds = useCallback(() => {
    if (!compareRef.current || !imageSize.w || !imageSize.h) return null;
    const rect = compareRef.current.getBoundingClientRect();
    const cw = rect.width,
      ch = rect.height;
    const imgAspect = imageSize.w / imageSize.h;
    const cntAspect = cw / ch;
    let iw, ih, ix, iy;
    if (imgAspect > cntAspect) {
      // imagen más ancha que contenedor → barras arriba/abajo
      iw = cw;
      ih = cw / imgAspect;
      ix = 0;
      iy = (ch - ih) / 2;
    } else {
      // imagen más alta que contenedor → barras a los lados
      ih = ch;
      iw = ch * imgAspect;
      ix = (cw - iw) / 2;
      iy = 0;
    }
    return {
      ix,
      iy,
      iw,
      ih,
      rect
    };
  }, [imageSize]);

  // Convertir coordenadas de pantalla a proporción de imagen (0-1)
  const clientToImageNorm = useCallback((clientX, clientY) => {
    const bounds = getImageBounds();
    if (!bounds) return null;
    const {
      ix,
      iy,
      iw,
      ih,
      rect
    } = bounds;
    const lx = clientX - rect.left - ix;
    const ly = clientY - rect.top - iy;
    return {
      x: Math.max(0, Math.min(1, lx / iw)),
      y: Math.max(0, Math.min(1, ly / ih))
    };
  }, [getImageBounds]);
  const generateMask = useCallback((sel, w, h) => {
    if (!sel) return null;
    const mask = new Uint8Array(w * h);
    if (sel.type === "rect") {
      const x1 = Math.round(Math.min(sel.x1, sel.x2) * w),
        x2 = Math.round(Math.max(sel.x1, sel.x2) * w);
      const y1 = Math.round(Math.min(sel.y1, sel.y2) * h),
        y2 = Math.round(Math.max(sel.y1, sel.y2) * h);
      for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) if (x >= 0 && x < w && y >= 0 && y < h) mask[y * w + x] = 1;
    } else if (sel.type === "circle") {
      const cx = (sel.x1 + sel.x2) / 2 * w,
        cy = (sel.y1 + sel.y2) / 2 * h;
      const rx = Math.abs(sel.x2 - sel.x1) / 2 * w,
        ry = Math.abs(sel.y2 - sel.y1) / 2 * h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) mask[y * w + x] = 1;
      }
    } else if (sel.type === "free" && sel.points && sel.points.length > 2) {
      // Rasterizar el polígono con canvas (mucho más rápido que
      // point-in-polygon por píxel con cientos de vértices)
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(sel.points[0].x * w, sel.points[0].y * h);
      for (let i = 1; i < sel.points.length; i++) ctx.lineTo(sel.points[i].x * w, sel.points[i].y * h);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
      const d = ctx.getImageData(0, 0, w, h).data;
      for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 127) mask[i] = 1;
    }
    return mask;
  }, []);

  // CSS filter para contraste y saturación en tiempo real
  const postFilter = contrast === 0 && saturation === 0 ? "none" : `contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100})`;

  // Tamaño de trabajo: 2000px por defecto (rápido), resolución completa opcional
  const computeSize = (img, full) => {
    const mx = full ? 8192 : 2000;
    let w = img.naturalWidth,
      h = img.naturalHeight;
    if (w > mx || h > mx) {
      const s = mx / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    return {
      w,
      h
    };
  };
  const handleFile = useCallback(file => {
    if (!file || !file.type.startsWith("image/")) return;
    setFileName(file.name);
    setExifData(null);
    setExifRaw(null);
    const er = new FileReader();
    er.onload = e => {
      try {
        const p = parseExifData(e.target.result);
        if (p) setExifData(p);
        const seg = extractExifSegment(e.target.result);
        if (seg) setExifRaw(seg);
      } catch (e) {}
    };
    er.readAsArrayBuffer(file);
    const dr = new FileReader();
    dr.onload = e => {
      const img = new Image();
      img.onload = () => {
        setImageSize(computeSize(img, fullRes));
        setImage(img);
        setImageSrc(e.target.result);
        setProcessedSrc(null);
        setActivePreset(null);
        setStackMode(false);
        setSelData(null);
        setSelTool("none");
        setContrast(0);
        setSaturation(0);
        drawRef.current = {
          active: false,
          tool: "",
          start: null,
          pts: []
        };
        pipelineRef.current = [];
      };
      img.src = e.target.result;
    };
    dr.readAsDataURL(file);
  }, [fullRes]);
  const toggleFullRes = () => {
    const nv = !fullRes;
    setFullRes(nv);
    if (image) {
      setImageSize(computeSize(image, nv));
      setProcessedSrc(null);
      setSelData(null);
      setSelTool("none");
      drawRef.current = {
        active: false,
        tool: "",
        start: null,
        pts: []
      };
      pipelineRef.current = [];
    }
  };

  // processImage: soporta stacking y máscara de selección
  const processImage = useCallback((preset, int) => {
    if (!image) return;
    setProcessing(true);
    setActivePreset(preset.id);
    // setTimeout directo (no requestAnimationFrame): rAF se pausa si la
    // pestaña pierde visibilidad y el procesamiento quedaba colgado
    setTimeout(() => {
      try {
        const cv = document.createElement("canvas"),
          ctx = cv.getContext("2d"),
          {
            w,
            h
          } = imageSize;
        cv.width = w;
        cv.height = h;
        const applyWithMask = (sourceData, resultData, mask) => {
          if (!mask) return resultData;
          const merged = new ImageData(new Uint8ClampedArray(sourceData.data), w, h);
          for (let i = 0; i < w * h; i++) {
            if (mask[i]) {
              merged.data[i * 4] = resultData.data[i * 4];
              merged.data[i * 4 + 1] = resultData.data[i * 4 + 1];
              merged.data[i * 4 + 2] = resultData.data[i * 4 + 2];
            }
            merged.data[i * 4 + 3] = 255;
          }
          return merged;
        };
        const mask = generateMask(selData, w, h);

        // Si stackMode y hay resultado previo, usar ese como fuente
        if (stackMode && processedSrc) {
          const tmpImg = new Image();
          tmpImg.onload = () => {
            try {
              ctx.drawImage(tmpImg, 0, 0, w, h);
              const sourceData = ctx.getImageData(0, 0, w, h);
              const id = new ImageData(new Uint8ClampedArray(sourceData.data), w, h);
              const store = {};
              const result = preset.fn(id, int, mask, store);
              const final = applyWithMask(sourceData, result, mask);
              ctx.putImageData(final, 0, 0);
              setProcessedSrc(cv.toDataURL("image/png"));
              // Registrar el paso acumulado en el pipeline del lote
              pipelineRef.current.push({
                presetId: preset.id,
                intensity: int,
                frozen: store.frozen || null
              });
            } catch (err) {
              console.error(err);
            }
            setProcessing(false);
          };
          tmpImg.onerror = () => setProcessing(false);
          tmpImg.src = processedSrc;
          return;
        }
        ctx.drawImage(image, 0, 0, w, h);
        const sourceData = ctx.getImageData(0, 0, w, h);
        const id = new ImageData(new Uint8ClampedArray(sourceData.data), w, h);
        // La máscara también se pasa al filtro: las estadísticas se calculan
        // sobre la zona seleccionada (decorrelación local, como DStretch)
        const store = {};
        const result = preset.fn(id, int, mask, store);
        const final = applyWithMask(sourceData, result, mask);
        ctx.putImageData(final, 0, 0);
        setProcessedSrc(cv.toDataURL("image/png"));
        // Aplicación fresca → el pipeline arranca de cero con este paso
        pipelineRef.current = [{
          presetId: preset.id,
          intensity: int,
          frozen: store.frozen || null
        }];
      } catch (e) {
        console.error(e);
      }
      setProcessing(false);
    }, 50);
  }, [image, imageSize, stackMode, processedSrc, selData, generateMask]);
  useEffect(() => {
    // En modo acumular NO se reaplica automáticamente al mover la intensidad:
    // cada reaplicación tomaría el resultado previo como fuente y el filtro
    // se acumularía sin control. El usuario reaplica con el botón del filtro.
    if (stackMode) return;
    if (activePreset && image) {
      const p = PRESETS.find(x => x.id === activePreset);
      if (p) {
        const t = setTimeout(() => processImage(p, intensity), 250);
        return () => clearTimeout(t);
      }
    }
  }, [intensity]);
  const handleSliderMove = useCallback(cx => {
    if (!compareRef.current) return;
    const r = compareRef.current.getBoundingClientRect();
    setSliderPos(Math.max(0, Math.min(100, (cx - r.left) / r.width * 100)));
  }, []);
  const handlePointerDown = e => {
    setDragging(true);
    handleSliderMove(e.clientX);
  };
  useEffect(() => {
    if (!dragging) return;
    const m = e => handleSliderMove(e.clientX),
      u = () => setDragging(false);
    window.addEventListener("pointermove", m);
    window.addEventListener("pointerup", u);
    return () => {
      window.removeEventListener("pointermove", m);
      window.removeEventListener("pointerup", u);
    };
  }, [dragging, handleSliderMove]);

  // Encoder TIFF sin comprimir (RGB 8-bit)
  const encodeTIFF = canvas => {
    const w = canvas.width,
      h = canvas.height;
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, w, h).data;
    const pixelBytes = w * h * 3; // RGB sin alpha
    const ifdOffset = 8;
    const ifdEntries = 12;
    const ifdSize = 2 + ifdEntries * 12 + 4;
    // Área de valores fuera de línea (BitsPerSample necesita 3 SHORTs,
    // X/YResolution son RATIONAL de 8 bytes según spec TIFF 6.0)
    const bitsOffset = ifdOffset + ifdSize;
    const xresOffset = bitsOffset + 8; // 6 bytes + 2 de alineación
    const yresOffset = xresOffset + 8;
    const stripOffset = yresOffset + 8;
    const fileSize = stripOffset + pixelBytes;
    const buf = new ArrayBuffer(fileSize);
    const view = new DataView(buf);
    const u8 = new Uint8Array(buf);
    // Header: little-endian TIFF
    view.setUint16(0, 0x4949, false); // II
    view.setUint16(2, 42, true);
    view.setUint32(4, ifdOffset, true);
    let off = ifdOffset;
    // IFD entry count
    view.setUint16(off, ifdEntries, true);
    off += 2;
    const writeIFD = (tag, type, count, value) => {
      view.setUint16(off, tag, true);
      off += 2;
      view.setUint16(off, type, true);
      off += 2;
      view.setUint32(off, count, true);
      off += 4;
      view.setUint32(off, value, true);
      off += 4;
    };
    writeIFD(256, 3, 1, w); // ImageWidth
    writeIFD(257, 3, 1, h); // ImageLength
    writeIFD(258, 3, 3, bitsOffset); // BitsPerSample [8,8,8]
    writeIFD(259, 3, 1, 1); // Compression: none
    writeIFD(262, 3, 1, 2); // PhotometricInterpretation: RGB
    writeIFD(273, 4, 1, stripOffset); // StripOffsets
    writeIFD(277, 3, 1, 3); // SamplesPerPixel
    writeIFD(278, 4, 1, h); // RowsPerStrip
    writeIFD(279, 4, 1, pixelBytes); // StripByteCounts
    writeIFD(282, 5, 1, xresOffset); // XResolution: RATIONAL 72/1
    writeIFD(283, 5, 1, yresOffset); // YResolution: RATIONAL 72/1
    writeIFD(296, 3, 1, 2); // ResolutionUnit: pulgadas
    // Next IFD offset = 0
    view.setUint32(off, 0, true);
    // Valores fuera de línea
    view.setUint16(bitsOffset, 8, true);
    view.setUint16(bitsOffset + 2, 8, true);
    view.setUint16(bitsOffset + 4, 8, true);
    view.setUint32(xresOffset, 72, true);
    view.setUint32(xresOffset + 4, 1, true);
    view.setUint32(yresOffset, 72, true);
    view.setUint32(yresOffset + 4, 1, true);
    // Pixel data: RGB (sin alpha)
    let pOff = stripOffset;
    for (let i = 0; i < w * h; i++) {
      u8[pOff++] = imgData[i * 4];
      u8[pOff++] = imgData[i * 4 + 1];
      u8[pOff++] = imgData[i * 4 + 2];
    }
    return new Blob([buf], {
      type: "image/tiff"
    });
  };
  const handleDownload = () => {
    if (!processedSrc) return;
    try {
      const tmpImg = new Image();
      tmpImg.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = tmpImg.naturalWidth;
        cv.height = tmpImg.naturalHeight;
        const ctx = cv.getContext("2d");
        if (contrast !== 0 || saturation !== 0) {
          ctx.filter = `contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100})`;
        }
        ctx.drawImage(tmpImg, 0, 0);
        // Nombre reproducible: filtro + intensidad + ajustes post aplicados
        const params = `_i${intensity.toFixed(1)}${contrast !== 0 ? `_c${contrast}` : ""}${saturation !== 0 ? `_s${saturation}` : ""}`;
        const base = `${(fileName || "opc").replace(/\.[^.]+$/, "")}_OPC_${activePreset}${params}`;
        const doDownload = (blob, ext) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${base}.${ext}`;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 300);
        };
        if (exportFmt === "tiff") {
          doDownload(encodeTIFF(cv), "tif");
        } else if (exportFmt === "jpg") {
          cv.toBlob(async blob => {
            if (!blob) return;
            let out = blob;
            // Reinyectar el EXIF original (GPS/fecha) en el JPG exportado
            if (exifRaw) {
              try {
                const buf = new Uint8Array(await blob.arrayBuffer());
                if (buf[0] === 0xFF && buf[1] === 0xD8) {
                  out = new Blob([buf.slice(0, 2), exifRaw, buf.slice(2)], {
                    type: "image/jpeg"
                  });
                }
              } catch (err) {}
            }
            doDownload(out, "jpg");
          }, "image/jpeg", 0.92);
        } else {
          cv.toBlob(blob => {
            if (blob) doDownload(blob, "png");
          }, "image/png");
        }
      };
      tmpImg.src = processedSrc;
    } catch (e) {
      const w = window.open();
      if (w) w.document.write(`<img src="${processedSrc}" style="max-width:100%"/>`);
    }
  };

  // ============================================================
  // PROCESADO POR LOTE (fotogrametría)
  // Aplica el pipeline registrado (filtros + intensidades + estadísticas
  // CONGELADAS de la foto de referencia) a N fotos y las guarda con el
  // mismo nombre de archivo, conservando el EXIF de cada una.
  // ============================================================
  const runBatch = async () => {
    const files = batchFiles,
      pipeline = pipelineRef.current;
    if (!files.length || !pipeline.length || batchRunning) return;
    // Carpeta destino vía File System Access API (Chrome/Edge).
    // Si no está disponible, cada foto se descarga individualmente.
    let dirHandle = null;
    if (window.showDirectoryPicker) {
      try {
        dirHandle = await window.showDirectoryPicker({
          mode: "readwrite"
        });
      } catch (e) {
        return;
      } // usuario canceló
    }
    setBatchRunning(true);
    batchCancelRef.current = false;
    setBatchProgress({
      done: 0,
      total: files.length,
      current: "",
      errors: []
    });
    const errors = [];
    for (let fi = 0; fi < files.length; fi++) {
      if (batchCancelRef.current) break;
      const file = files[fi];
      setBatchProgress(p => ({
        ...p,
        current: file.name
      }));
      // Ceder el hilo para que la UI actualice el progreso
      await new Promise(r => setTimeout(r, 30));
      try {
        // EXIF crudo de ESTA foto (cada una conserva su propio GPS/fecha)
        let exifSeg = null;
        if (batchFmt === "jpg") {
          try {
            exifSeg = extractExifSegment(await file.arrayBuffer());
          } catch (e) {}
        }
        const bmp = await createImageBitmap(file);
        let w = bmp.width,
          h = bmp.height;
        if (w > batchRes || h > batchRes) {
          const s = batchRes / Math.max(w, h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d");
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        let id = ctx.getImageData(0, 0, w, h);
        // Aplicar cada paso del pipeline con sus estadísticas congeladas
        // (sin máscara: en el lote el realce cubre la imagen completa)
        for (const step of pipeline) {
          const preset = PRESETS.find(p => p.id === step.presetId);
          if (!preset) continue;
          id = preset.fn(id, step.intensity, null, step.frozen ? {
            frozen: step.frozen
          } : null);
          await new Promise(r => setTimeout(r, 0));
        }
        ctx.putImageData(id, 0, 0);
        // Ajustes post (contraste/saturación) como en la descarga individual
        let outCv = cv;
        if (contrast !== 0 || saturation !== 0) {
          outCv = document.createElement("canvas");
          outCv.width = w;
          outCv.height = h;
          const octx = outCv.getContext("2d");
          octx.filter = `contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100})`;
          octx.drawImage(cv, 0, 0);
        }
        // Codificar según formato
        const base = file.name.replace(/\.[^.]+$/, "");
        let blob, ext;
        if (batchFmt === "tiff") {
          blob = encodeTIFF(outCv);
          ext = "tif";
        } else if (batchFmt === "png") {
          blob = await new Promise(r => outCv.toBlob(r, "image/png"));
          ext = "png";
        } else {
          blob = await new Promise(r => outCv.toBlob(r, "image/jpeg", 0.95));
          ext = "jpg";
          if (blob && exifSeg) {
            try {
              const u8 = new Uint8Array(await blob.arrayBuffer());
              if (u8[0] === 0xFF && u8[1] === 0xD8) blob = new Blob([u8.slice(0, 2), exifSeg, u8.slice(2)], {
                type: "image/jpeg"
              });
            } catch (e) {}
          }
        }
        if (!blob) throw new Error("No se pudo codificar la imagen");
        // MISMO nombre que el original (workflow de reemplazo de texturas):
        // guardar siempre en una carpeta DISTINTA a la de los originales
        const outName = `${base}.${ext}`;
        if (dirHandle) {
          const fh = await dirHandle.getFileHandle(outName, {
            create: true
          });
          const ws = await fh.createWritable();
          await ws.write(blob);
          await ws.close();
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = outName;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
      } catch (err) {
        console.error("Lote:", file.name, err);
        errors.push(file.name);
      }
      setBatchProgress(p => ({
        ...p,
        done: fi + 1,
        errors: [...errors]
      }));
    }
    setBatchRunning(false);
  };
  const handleDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };
  const handleReset = () => {
    setImage(null);
    setImageSrc(null);
    setProcessedSrc(null);
    setActivePreset(null);
    setExifData(null);
    setExifRaw(null);
    setFileName("");
    setStackMode(false);
    setContrast(0);
    setSaturation(0);
    setSelTool("none");
    setSelData(null);
    drawRef.current = {
      active: false,
      tool: "",
      start: null,
      pts: []
    };
    pipelineRef.current = [];
    setShowBatch(false);
    setBatchFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Herramientas de selección ---
  const clearSelection = () => {
    setSelData(null);
    setSelTool("none");
    setProcessedSrc(null);
    drawRef.current = {
      active: false,
      tool: "",
      start: null,
      pts: []
    };
    pipelineRef.current = [];
  };
  const handleSelDown = e => {
    if (selTool === "none") return;
    e.preventDefault();
    e.stopPropagation();
    const pt = clientToImageNorm(e.clientX, e.clientY);
    if (!pt) return;
    if (compareRef.current) compareRef.current.setPointerCapture(e.pointerId);
    drawRef.current = {
      active: true,
      tool: selTool,
      start: pt,
      pts: [pt]
    };
    setSelData(null);
  };
  const handleSelMoveEvt = e => {
    const dr = drawRef.current;
    if (!dr.active) return;
    const pt = clientToImageNorm(e.clientX, e.clientY);
    if (!pt) return;
    if (dr.tool === "rect" || dr.tool === "circle") {
      setSelData({
        type: dr.tool,
        x1: dr.start.x,
        y1: dr.start.y,
        x2: pt.x,
        y2: pt.y
      });
    } else if (dr.tool === "free") {
      dr.pts.push(pt);
      if (dr.pts.length % 3 === 0) {
        setSelData({
          type: "free",
          points: [...dr.pts]
        });
      }
    }
  };
  const handleSelUpEvt = e => {
    const dr = drawRef.current;
    if (!dr.active) return;
    try {
      if (compareRef.current) compareRef.current.releasePointerCapture(e.pointerId);
    } catch (ex) {}
    dr.active = false;
    if (dr.tool === "free" && dr.pts.length > 2) {
      setSelData({
        type: "free",
        points: [...dr.pts]
      });
    }
    setSelTool("none");
  };

  // Convertir coords imagen-norm a coords contenedor-% para el SVG overlay
  const imgToSvg = useCallback((nx, ny) => {
    const bounds = getImageBounds();
    if (!bounds) return {
      x: nx * 100,
      y: ny * 100
    };
    const {
      ix,
      iy,
      iw,
      ih,
      rect
    } = bounds;
    return {
      x: (ix + nx * iw) / rect.width * 100,
      y: (iy + ny * ih) / rect.height * 100
    };
  }, [getImageBounds]);
  const imgToSvgW = useCallback((nw, nh) => {
    const bounds = getImageBounds();
    if (!bounds) return {
      w: nw * 100,
      h: nh * 100
    };
    return {
      w: nw * bounds.iw / bounds.rect.width * 100,
      h: nh * bounds.ih / bounds.rect.height * 100
    };
  }, [getImageBounds]);
  const mono = "'JetBrains Mono', monospace";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Crimson Pro','Georgia',serif",
      background: T.bg,
      color: T.text,
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      transition: "background 0.3s,color 0.3s"
    }
  }, !solar && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      opacity: 0.04,
      pointerEvents: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
    }
  }), /*#__PURE__*/React.createElement("header", {
    style: {
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
      borderBottom: `1px solid ${T.hBd}`,
      position: "relative",
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      color: T.text,
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.gn,
      fontFamily: mono,
      fontSize: 11,
      fontWeight: 500,
      background: T.gnBg,
      padding: "1px 6px",
      borderRadius: 4,
      border: `1px solid ${T.gnBd}`
    }
  }, "OPC"), "Opuntia", /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.ac,
      fontWeight: 700
    }
  }, "Color"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: T.tm,
      fontFamily: mono
    }
  }, "v3.2")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSolar(!solar),
    style: {
      background: solar ? "#000" : "#FFD600",
      border: `1px solid ${solar ? "#333" : "#FFA000"}`,
      color: solar ? "#FFD600" : "#000",
      borderRadius: 8,
      padding: "6px 12px",
      cursor: "pointer",
      fontSize: 11,
      fontFamily: mono,
      fontWeight: 600
    }
  }, solar ? "\u263E Normal" : "\u2600 Solar"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowInfo(!showInfo),
    style: {
      background: showInfo ? T.acBg : T.bBg,
      border: `1px solid ${showInfo ? T.acBd : T.cBd}`,
      color: showInfo ? T.ac : T.tm,
      borderRadius: 8,
      padding: "6px 12px",
      cursor: "pointer",
      fontSize: 11,
      fontFamily: mono
    }
  }, showInfo ? "\u2715 Cerrar" : "\u24D8 Info"))), showInfo && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 20px",
      padding: 20,
      background: T.cBg,
      border: `1px solid ${T.cBd}`,
      borderRadius: 10,
      fontSize: 13,
      lineHeight: 1.7,
      position: "relative",
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 10px",
      color: T.ac,
      fontSize: 15
    }
  }, "OPC v3.2 \u2014 Novedades"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      color: T.tm
    }
  }, "12 filtros para pinturas, grabados y an\xE1lisis t\xE9cnico. Funciona 100% offline: procesamiento local sin conexi\xF3n."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      color: T.tm
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Procesado por lote (fotogrametr\xEDa)"), " \u2014 Ajust\xE1 el filtro en una foto de referencia y aplicalo autom\xE1ticamente a todo el lote fotogram\xE9trico. Las estad\xEDsticas (matriz de decorrelaci\xF3n) se congelan de la referencia: colores id\xE9nticos en todas las fotos, textura coherente en el modelo 3D. Cada foto conserva su nombre y su EXIF/GPS."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      color: T.tm
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Estad\xEDsticas por zona"), " \u2014 Con una selecci\xF3n activa, la decorrelaci\xF3n (CRGB, DS-LAB, LDS, YBK) se calcula con los datos de esa zona: mejor separaci\xF3n de pigmentos locales, como en DStretch."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      color: T.tm
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Resultados reproducibles"), " \u2014 Componentes principales ordenados por varianza: el mismo panel da los mismos colores en fotos distintas."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      color: T.tm
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "CLAHE real"), " \u2014 Ecualizaci\xF3n adaptativa de histograma con l\xEDmite de contraste (Zuiderveld 1994)."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      color: T.tm
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Mucho m\xE1s r\xE1pido"), " \u2014 Micro-relieve optimizado con imagen integral. Opci\xF3n de procesar a resoluci\xF3n completa."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      color: T.tm
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Exportaci\xF3n con metadatos"), " \u2014 El nombre del archivo registra filtro e intensidad; el JPG conserva el EXIF/GPS original. TIFF v\xE1lido seg\xFAn spec 6.0."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: T.tm,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Dr. Emilio A. Villafa\xF1ez"), " \xB7 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "LATDAA"), " \xB7 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Fund. F\xE9lix de Azara"), " \xB7 ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "Universidad Nacional de Catamarca (UNCA), Argentina"))), /*#__PURE__*/React.createElement("main", {
    style: {
      padding: "16px 20px",
      position: "relative",
      zIndex: 5
    }
  }, !image && /*#__PURE__*/React.createElement("div", {
    onDrop: handleDrop,
    onDragOver: e => e.preventDefault(),
    onClick: () => fileInputRef.current?.click(),
    style: {
      maxWidth: 680,
      margin: "50px auto",
      borderRadius: 14,
      padding: "50px 36px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      cursor: "pointer",
      background: solar ? "#e8e5e2" : "#373334",
      border: solar ? "2px dashed #999" : "none",
      transition: "all 0.3s"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: OPC_LOGO,
    alt: "OPC Logo",
    style: {
      width: 140,
      height: 140,
      marginBottom: 16,
      opacity: 0.95
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      fontWeight: 600,
      margin: "0 0 6px",
      color: solar ? "#000" : "#e8e0d4"
    }
  }, "Arrastr\xE1 tu foto aqu\xED"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: solar ? "#555" : "#8a7e6e",
      margin: 0
    }
  }, "o hac\xE9 clic para seleccionar \xB7 JPG, PNG, WebP"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: solar ? "#777" : "#6a5e4e",
      margin: "14px 0 0",
      fontFamily: mono
    }
  }, "Procesamiento 100% local, sin conexi\xF3n \xB7 RAW: convertir antes a JPG/PNG")), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      handleFile(e.target.files?.[0]);
      e.target.value = "";
    }
  }), image && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      maxHeight: "85vh",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, processedSrc && /*#__PURE__*/React.createElement("button", {
    onClick: handleDownload,
    style: {
      flex: 1,
      padding: "8px 8px",
      background: `linear-gradient(135deg,${T.ac},${solar ? "#7f1d1d" : "#8e2118"})`,
      border: "none",
      borderRadius: 8,
      color: "#fff",
      fontWeight: 600,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Crimson Pro',serif"
    }
  }, "\u2B07", " Descargar"), /*#__PURE__*/React.createElement("button", {
    onClick: handleReset,
    style: {
      flex: 1,
      padding: "8px 8px",
      background: T.cBg,
      border: `1px solid ${T.cBd}`,
      borderRadius: 8,
      color: T.tm,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Crimson Pro',serif"
    }
  }, "\u21BB", " Nueva imagen")), processedSrc && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, ["png", "jpg", "tiff"].map(fmt => /*#__PURE__*/React.createElement("button", {
    key: fmt,
    onClick: () => setExportFmt(fmt === "tiff" ? "tiff" : fmt),
    style: {
      flex: 1,
      padding: "4px 2px",
      fontSize: 9,
      fontFamily: mono,
      fontWeight: exportFmt === fmt || fmt === "tiff" && exportFmt === "tiff" ? 700 : 400,
      background: exportFmt === fmt || fmt === "tiff" && exportFmt === "tiff" ? T.acBg : T.bBg,
      border: `1px solid ${exportFmt === fmt || fmt === "tiff" && exportFmt === "tiff" ? T.acBd : T.cBd}`,
      borderRadius: 4,
      cursor: "pointer",
      color: exportFmt === fmt || fmt === "tiff" && exportFmt === "tiff" ? T.ac : T.tm,
      textTransform: "uppercase"
    }
  }, fmt))), processedSrc && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowBatch(true);
      setBatchFiles([]);
      setBatchProgress({
        done: 0,
        total: 0,
        current: "",
        errors: []
      });
    },
    style: {
      padding: "7px 8px",
      background: T.gnBg,
      border: `1px solid ${T.gnBd}`,
      borderRadius: 8,
      color: T.gn,
      fontWeight: 600,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Crimson Pro',serif"
    }
  }, "▦", " Procesar lote (fotogrametr\xEDa)")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontFamily: mono,
      color: T.ac,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      margin: "4px 0 3px 4px",
      fontWeight: 600
    }
  }, "Filtros"), PRESETS.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    onClick: () => processImage(p, intensity),
    disabled: processing,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      width: "100%",
      background: activePreset === p.id ? T.acBg : T.cBg,
      border: `1px solid ${activePreset === p.id ? T.acBd : T.cBd}`,
      borderRadius: 7,
      cursor: processing ? "wait" : "pointer",
      transition: "all 0.2s",
      textAlign: "left",
      color: T.text,
      opacity: processing ? 0.6 : 1,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      width: 22,
      textAlign: "center"
    }
  }, p.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      color: T.tm,
      fontFamily: mono,
      lineHeight: 1.3
    }
  }, p.desc)))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStackMode(!stackMode),
    style: {
      margin: "6px 0 2px",
      padding: "7px 10px",
      background: stackMode ? "rgba(109,184,93,0.15)" : T.cBg,
      border: `1px solid ${stackMode ? "rgba(109,184,93,0.4)" : T.cBd}`,
      borderRadius: 7,
      cursor: "pointer",
      fontSize: 10,
      fontFamily: mono,
      color: stackMode ? T.gn : T.tm,
      fontWeight: stackMode ? 600 : 400,
      textAlign: "left"
    }
  }, stackMode ? "\uD83D\uDD17 Acumular: ON" : "\uD83D\uDD17 Acumular: OFF", stackMode && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      display: "block",
      fontWeight: 400,
      marginTop: 1
    }
  }, "Aplica sobre resultado previo")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "8px 10px",
      background: T.cBg,
      border: `1px solid ${T.cBd}`,
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontFamily: mono,
      color: T.td,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      marginBottom: 5
    }
  }, "Selecci\xF3n"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, [{
    id: "rect",
    icon: "\u25A1",
    tip: "Rect\u00E1ngulo"
  }, {
    id: "circle",
    icon: "\u25CB",
    tip: "C\u00EDrculo"
  }, {
    id: "free",
    icon: "\u270E",
    tip: "Mano alzada"
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => {
      setSelData(null);
      setProcessedSrc(null);
      setSelTool(selTool === t.id ? "none" : t.id);
      drawRef.current = {
        active: false,
        tool: "",
        start: null,
        pts: []
      };
      pipelineRef.current = [];
    },
    title: t.tip,
    style: {
      flex: 1,
      padding: "5px 4px",
      fontSize: 13,
      background: selTool === t.id ? T.acBg : T.bBg,
      border: `1px solid ${selTool === t.id ? T.acBd : T.cBd}`,
      borderRadius: 5,
      cursor: "pointer",
      color: selTool === t.id ? T.ac : T.tm,
      fontWeight: selTool === t.id ? 700 : 400,
      transition: "all 0.2s"
    }
  }, t.icon)), selData && /*#__PURE__*/React.createElement("button", {
    onClick: clearSelection,
    title: "Limpiar selecci\\u00F3n",
    style: {
      flex: 1,
      padding: "5px 4px",
      fontSize: 10,
      background: T.bBg,
      border: `1px solid ${T.cBd}`,
      borderRadius: 5,
      cursor: "pointer",
      color: T.tm,
      fontFamily: mono
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      fontFamily: mono,
      color: T.td,
      marginTop: 4,
      lineHeight: 1.4
    }
  }, selTool !== "none" ? `Dibuj\u00E1 sobre la imagen \u2192 ${selTool === "rect" ? "rect\u00E1ngulo" : selTool === "circle" ? "c\u00EDrculo" : "forma libre"}` : selData ? `\u2713 Zona seleccionada \u2014 el filtro se aplica solo ah\u00ED` : "Sin selecci\u00F3n \u2014 filtro en toda la imagen")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "10px 12px",
      background: T.cBg,
      border: `1px solid ${T.cBd}`,
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontFamily: mono,
      color: T.td,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "Intensidad: ", intensity.toFixed(1)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.2",
    max: "5.0",
    step: "0.1",
    value: intensity,
    onChange: e => setIntensity(parseFloat(e.target.value)),
    style: {
      width: "100%",
      accentColor: T.ac
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 7.5,
      color: T.td,
      fontFamily: mono,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "0.2"), /*#__PURE__*/React.createElement("span", null, "5.0")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      flexWrap: "wrap"
    }
  }, INTENSITY_PRESETS.map(ip => /*#__PURE__*/React.createElement("button", {
    key: ip.label,
    onClick: () => setIntensity(ip.value),
    style: {
      flex: 1,
      minWidth: 36,
      padding: "4px 2px",
      fontSize: 8.5,
      fontFamily: mono,
      fontWeight: Math.abs(intensity - ip.value) < 0.2 ? 700 : 400,
      background: Math.abs(intensity - ip.value) < 0.2 ? T.acBg : T.cBg,
      border: `1px solid ${Math.abs(intensity - ip.value) < 0.2 ? T.acBd : T.cBd}`,
      borderRadius: 5,
      cursor: "pointer",
      color: Math.abs(intensity - ip.value) < 0.2 ? T.ac : T.tm
    }
  }, ip.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      padding: "10px 12px",
      background: T.cBg,
      border: `1px solid ${T.cBd}`,
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontFamily: mono,
      color: T.td,
      letterSpacing: "1.5px",
      textTransform: "uppercase"
    }
  }, "Ajustes post"), (contrast !== 0 || saturation !== 0) && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setContrast(0);
      setSaturation(0);
    },
    style: {
      fontSize: 8,
      fontFamily: mono,
      background: "none",
      border: `1px solid ${T.cBd}`,
      borderRadius: 4,
      padding: "1px 6px",
      color: T.tm,
      cursor: "pointer"
    }
  }, "Reset")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 8.5,
      fontFamily: mono,
      color: T.tm,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, "Contraste"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: contrast !== 0 ? T.ac : T.td
    }
  }, contrast > 0 ? "+" : "", contrast)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "-80",
    max: "80",
    step: "5",
    value: contrast,
    onChange: e => setContrast(parseInt(e.target.value)),
    style: {
      width: "100%",
      accentColor: T.ac
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 8.5,
      fontFamily: mono,
      color: T.tm,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, "Saturaci\xF3n"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: saturation !== 0 ? T.ac : T.td
    }
  }, saturation > 0 ? "+" : "", saturation)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "-100",
    max: "100",
    step: "5",
    value: saturation,
    onChange: e => setSaturation(parseInt(e.target.value)),
    style: {
      width: "100%",
      accentColor: T.ac
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "8px 12px",
      background: solar ? "#f5f5f5" : "rgba(232,224,212,0.02)",
      borderRadius: 6,
      fontSize: 9,
      fontFamily: mono,
      color: T.td,
      lineHeight: 1.6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      wordBreak: "break-all",
      marginBottom: 1,
      fontWeight: 600,
      color: T.tm
    }
  }, fileName), /*#__PURE__*/React.createElement("div", null, imageSize.w, " \xD7 ", imageSize.h, " px", image && (image.naturalWidth !== imageSize.w || image.naturalHeight !== imageSize.h) ? ` (orig. ${image.naturalWidth}×${image.naturalHeight})` : ""), image && Math.max(image.naturalWidth, image.naturalHeight) > 2000 && /*#__PURE__*/React.createElement("button", {
    onClick: toggleFullRes,
    title: fullRes ? "Volver a 2000px (más rápido)" : "Procesar a resolución completa (más lento)",
    style: {
      marginTop: 4,
      padding: "3px 8px",
      fontSize: 8.5,
      fontFamily: mono,
      background: fullRes ? T.acBg : T.bBg,
      border: `1px solid ${fullRes ? T.acBd : T.cBd}`,
      borderRadius: 4,
      cursor: "pointer",
      color: fullRes ? T.ac : T.tm,
      width: "100%"
    }
  }, fullRes ? "✓ Resolución completa" : "Usar resolución completa")), exifData ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 12px",
      background: solar ? "#E8F5E9" : "rgba(109,184,93,0.06)",
      border: `1px solid ${solar ? "#A5D6A7" : "rgba(109,184,93,0.15)"}`,
      borderRadius: 6,
      fontSize: 9,
      fontFamily: mono,
      color: T.tm,
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: T.gn,
      marginBottom: 3,
      fontSize: 10
    }
  }, "\uD83D\uDCCD", " Datos EXIF / GPS"), exifData.dateTime && /*#__PURE__*/React.createElement("div", null, "\uD83D\uDCC5", " ", exifData.dateTime), exifData.gps ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, "Lat: ", formatGPSCoord(exifData.gps.latitude, true)), /*#__PURE__*/React.createElement("div", null, "Lon: ", formatGPSCoord(exifData.gps.longitude, false)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: T.td,
      marginTop: 1
    }
  }, "(", exifData.gps.latitude.toFixed(6), ", ", exifData.gps.longitude.toFixed(6), ")"), exifData.gps.altitude != null && /*#__PURE__*/React.createElement("div", null, "Alt: ", exifData.gps.altitude.toFixed(1), " m")) : !exifData.dateTime && /*#__PURE__*/React.createElement("div", {
    style: {
      fontStyle: "italic"
    }
  }, "Sin GPS/fecha")) : image && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 12px",
      borderRadius: 6,
      fontSize: 9,
      fontFamily: mono,
      color: T.td,
      fontStyle: "italic",
      background: solar ? "#f5f5f5" : "rgba(232,224,212,0.02)"
    }
  }, "\uD83D\uDCCD", " Sin datos EXIF")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: compareRef,
    style: {
      position: "relative",
      width: "100%",
      aspectRatio: `${imageSize.w}/${imageSize.h}`,
      maxHeight: "75vh",
      borderRadius: 10,
      overflow: "hidden",
      border: `1px solid ${selTool !== "none" ? T.acBd : T.cBd}`,
      cursor: selTool !== "none" ? "crosshair" : processedSrc ? "col-resize" : "default",
      userSelect: "none",
      background: T.iBg,
      transition: "border 0.2s",
      touchAction: "none"
    },
    onPointerDown: selTool !== "none" ? handleSelDown : processedSrc ? handlePointerDown : undefined,
    onPointerMove: handleSelMoveEvt,
    onPointerUp: handleSelUpEvt
  }, /*#__PURE__*/React.createElement("img", {
    src: imageSrc,
    alt: "Original",
    draggable: false,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "contain",
      pointerEvents: "none"
    }
  }), processedSrc && /*#__PURE__*/React.createElement("img", {
    src: processedSrc,
    alt: "Procesada",
    draggable: false,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "contain",
      clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
      filter: postFilter,
      pointerEvents: "none"
    }
  }), processedSrc && selTool === "none" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: `${sliderPos}%`,
      width: 2,
      background: "rgba(255,255,255,0.7)",
      transform: "translateX(-1px)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      left: `${sliderPos}%`,
      transform: "translate(-50%,-50%)",
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: solar ? "rgba(255,255,255,0.9)" : "rgba(30,28,24,0.85)",
      border: "2px solid rgba(255,255,255,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: solar ? "#000" : "#fff",
      fontSize: 13,
      pointerEvents: "none"
    }
  }, "\u27FA")), selData && (() => {
    const s1 = imgToSvg(Math.min(selData.x1 || 0, selData.x2 || 0), Math.min(selData.y1 || 0, selData.y2 || 0));
    const s2 = imgToSvg(Math.max(selData.x1 || 0, selData.x2 || 0), Math.max(selData.y1 || 0, selData.y2 || 0));
    const sw = s2.x - s1.x,
      sh = s2.y - s1.y;
    const scx = (s1.x + s2.x) / 2,
      scy = (s1.y + s2.y) / 2,
      srx = sw / 2,
      sry = sh / 2;
    const fpts = selData.points ? selData.points.map(p => imgToSvg(p.x, p.y)) : [];
    return /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5
      },
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none"
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("mask", {
      id: "sm"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "0",
      y: "0",
      width: "100",
      height: "100",
      fill: "white"
    }), selData.type === "rect" && /*#__PURE__*/React.createElement("rect", {
      x: s1.x,
      y: s1.y,
      width: sw,
      height: sh,
      fill: "black"
    }), selData.type === "circle" && /*#__PURE__*/React.createElement("ellipse", {
      cx: scx,
      cy: scy,
      rx: srx,
      ry: sry,
      fill: "black"
    }), selData.type === "free" && fpts.length > 2 && /*#__PURE__*/React.createElement("polygon", {
      points: fpts.map(p => `${p.x},${p.y}`).join(" "),
      fill: "black"
    }))), /*#__PURE__*/React.createElement("rect", {
      x: "0",
      y: "0",
      width: "100",
      height: "100",
      fill: "rgba(0,0,0,0.45)",
      mask: "url(#sm)"
    }), selData.type === "rect" && /*#__PURE__*/React.createElement("rect", {
      x: s1.x,
      y: s1.y,
      width: sw,
      height: sh,
      fill: "none",
      stroke: "rgba(192,57,43,0.8)",
      strokeWidth: "0.3",
      strokeDasharray: "1"
    }), selData.type === "circle" && /*#__PURE__*/React.createElement("ellipse", {
      cx: scx,
      cy: scy,
      rx: srx,
      ry: sry,
      fill: "none",
      stroke: "rgba(192,57,43,0.8)",
      strokeWidth: "0.3",
      strokeDasharray: "1"
    }), selData.type === "free" && fpts.length > 2 && /*#__PURE__*/React.createElement("polygon", {
      points: fpts.map(p => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: "rgba(192,57,43,0.8)",
      strokeWidth: "0.3",
      strokeDasharray: "1"
    }));
  })(), processedSrc && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 10,
      left: 10,
      padding: "3px 8px",
      borderRadius: 5,
      background: solar ? "rgba(183,28,28,0.85)" : "rgba(192,57,43,0.65)",
      fontSize: 10,
      fontFamily: mono,
      color: "#fff"
    }
  }, PRESETS.find(p => p.id === activePreset)?.name.toUpperCase() || "PROCESADA", stackMode && " \u26A1", selData && " \u2702"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 10,
      right: 10,
      padding: "3px 8px",
      borderRadius: 5,
      background: "rgba(0,0,0,0.65)",
      fontSize: 10,
      fontFamily: mono,
      color: "#aaa"
    }
  }, "ORIGINAL")), selTool !== "none" && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 10,
      left: "50%",
      transform: "translateX(-50%)",
      padding: "4px 12px",
      borderRadius: 6,
      background: "rgba(192,57,43,0.85)",
      fontSize: 10,
      fontFamily: mono,
      color: "#fff",
      pointerEvents: "none"
    }
  }, "Dibuj\xE1 la zona \xB7 ", selTool === "rect" ? "\u25A1 Rect\u00E1ngulo" : selTool === "circle" ? "\u25CB C\u00EDrculo" : "\u270E Mano alzada"), processing && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: T.ov
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 20px",
      borderRadius: 10,
      background: solar ? "rgba(255,255,255,0.95)" : "rgba(26,23,20,0.9)",
      border: `1px solid ${T.acBd}`,
      color: T.ac,
      fontSize: 13,
      fontFamily: mono,
      animation: "pulse 1.5s ease-in-out infinite"
    }
  }, "Procesando p\xEDxeles...")), !processedSrc && !processing && selTool === "none" && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: solar ? "rgba(255,255,255,0.3)" : "rgba(26,23,20,0.3)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 20px",
      borderRadius: 10,
      background: solar ? "rgba(255,255,255,0.9)" : "rgba(26,23,20,0.8)",
      border: `1px solid ${T.cBd}`,
      color: T.tm,
      fontSize: 13,
      textAlign: "center"
    }
  }, "\u2190", " Seleccion\xE1 un filtro"))), processedSrc && /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      fontSize: 10,
      color: T.td,
      marginTop: 6,
      fontFamily: mono
    }
  }, "Arrastr\xE1 el deslizador \xB7 Ajust\xE1 intensidad en el panel lateral", stackMode && " \u00B7 \u26A1 Modo acumular activo", selData && " \u00B7 \u2702 Selecci\u00F3n activa")))), /*#__PURE__*/React.createElement("input", {
    ref: batchInputRef,
    type: "file",
    accept: "image/*",
    multiple: true,
    style: {
      display: "none"
    },
    onChange: e => {
      setBatchFiles(Array.from(e.target.files || []));
      e.target.value = "";
    }
  }), showBatch && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: T.ov,
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 480,
      maxHeight: "88vh",
      overflowY: "auto",
      background: T.bg,
      border: `1px solid ${T.acBd}`,
      borderRadius: 12,
      padding: "18px 20px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 15,
      color: T.ac
    }
  }, "▦", " Procesado por lote"), !batchRunning && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowBatch(false),
    style: {
      background: "none",
      border: "none",
      color: T.tm,
      fontSize: 16,
      cursor: "pointer"
    }
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 10px",
      background: T.cBg,
      border: `1px solid ${T.cBd}`,
      borderRadius: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontFamily: mono,
      color: T.td,
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      marginBottom: 4
    }
  }, "Pipeline a aplicar"), pipelineRef.current.map((step, i) => {
    const p = PRESETS.find(x => x.id === step.presetId);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 10.5,
        fontFamily: mono,
        color: T.text,
        lineHeight: 1.7
      }
    }, i + 1, ". ", p?.icon, " ", p?.name, " \xB7 intensidad ", step.intensity.toFixed(1), step.frozen && /*#__PURE__*/React.createElement("span", {
      style: {
        color: T.gn,
        fontSize: 8.5
      }
    }, " \xB7 ", "❄", " matriz congelada"));
  }), (contrast !== 0 || saturation !== 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: mono,
      color: T.tm,
      marginTop: 2
    }
  }, "+ Ajustes post: ", contrast !== 0 ? `contraste ${contrast > 0 ? "+" : ""}${contrast}` : "", contrast !== 0 && saturation !== 0 ? " · " : "", saturation !== 0 ? `saturación ${saturation > 0 ? "+" : ""}${saturation}` : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontFamily: mono,
      color: T.td,
      marginTop: 5,
      lineHeight: 1.5
    }
  }, "❄", " = estad\xEDsticas de la foto de referencia aplicadas id\xE9nticas a todo el lote ", "→", " colores consistentes entre fotos (textura coherente en el modelo 3D)")), /*#__PURE__*/React.createElement("button", {
    disabled: batchRunning,
    onClick: () => batchInputRef.current?.click(),
    style: {
      width: "100%",
      padding: "9px 10px",
      background: T.cBg,
      border: `1px dashed ${T.cBd}`,
      borderRadius: 8,
      color: T.text,
      fontSize: 12,
      cursor: batchRunning ? "default" : "pointer",
      fontFamily: "'Crimson Pro',serif",
      marginBottom: 8,
      opacity: batchRunning ? 0.5 : 1
    }
  }, batchFiles.length ? `✓ ${batchFiles.length} fotos seleccionadas` : "📂 Elegir las fotos del lote…"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontFamily: mono,
      color: T.td,
      letterSpacing: "1px",
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, "Formato"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, ["jpg", "png", "tiff"].map(fmt => /*#__PURE__*/React.createElement("button", {
    key: fmt,
    disabled: batchRunning,
    onClick: () => setBatchFmt(fmt),
    style: {
      flex: 1,
      padding: "4px 2px",
      fontSize: 9,
      fontFamily: mono,
      fontWeight: batchFmt === fmt ? 700 : 400,
      background: batchFmt === fmt ? T.acBg : T.bBg,
      border: `1px solid ${batchFmt === fmt ? T.acBd : T.cBd}`,
      borderRadius: 4,
      cursor: "pointer",
      color: batchFmt === fmt ? T.ac : T.tm,
      textTransform: "uppercase"
    }
  }, fmt)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontFamily: mono,
      color: T.td,
      letterSpacing: "1px",
      textTransform: "uppercase",
      marginBottom: 3
    }
  }, "Resoluci\xF3n m\xE1x."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, [{
    v: 8192,
    l: "Full"
  }, {
    v: 4000,
    l: "4000"
  }, {
    v: 2000,
    l: "2000"
  }].map(r => /*#__PURE__*/React.createElement("button", {
    key: r.v,
    disabled: batchRunning,
    onClick: () => setBatchRes(r.v),
    style: {
      flex: 1,
      padding: "4px 2px",
      fontSize: 9,
      fontFamily: mono,
      fontWeight: batchRes === r.v ? 700 : 400,
      background: batchRes === r.v ? T.acBg : T.bBg,
      border: `1px solid ${batchRes === r.v ? T.acBd : T.cBd}`,
      borderRadius: 4,
      cursor: "pointer",
      color: batchRes === r.v ? T.ac : T.tm
    }
  }, r.l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontFamily: mono,
      color: T.tm,
      lineHeight: 1.6,
      marginBottom: 10
    }
  }, batchFmt === "jpg" ? "✓ JPG conserva el EXIF/GPS de cada foto (recomendado para fotogrametría)" : "⚠ Solo JPG conserva EXIF; para alinear en Metashape convienen los JPG", /*#__PURE__*/React.createElement("br", null), "Cada foto se guarda con su ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "mismo nombre"), ": eleg\xED una carpeta ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.text
    }
  }, "distinta"), " a la de los originales para no sobreescribirlos.", !window.showDirectoryPicker && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("br", null), "⚠", " Este navegador no permite elegir carpeta: las fotos se descargar\xE1n una por una.")), (batchRunning || batchProgress.total > 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: T.bBg,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${batchProgress.total ? Math.round(batchProgress.done / batchProgress.total * 100) : 0}%`,
      background: `linear-gradient(90deg,${T.gn},${T.ac})`,
      transition: "width 0.3s",
      borderRadius: 4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: mono,
      color: T.tm
    }
  }, batchRunning ? `Procesando ${batchProgress.done + 1}/${batchProgress.total}: ${batchProgress.current}` : batchProgress.done > 0 ? `✓ Listo: ${batchProgress.done - batchProgress.errors.length}/${batchProgress.total} procesadas${batchProgress.errors.length ? ` · ${batchProgress.errors.length} con error` : ""}` : ""), !batchRunning && batchProgress.errors.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontFamily: mono,
      color: T.ac,
      marginTop: 3,
      lineHeight: 1.5
    }
  }, "Errores: ", batchProgress.errors.join(", "))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, !batchRunning ? /*#__PURE__*/React.createElement("button", {
    disabled: !batchFiles.length,
    onClick: runBatch,
    style: {
      flex: 1,
      padding: "9px 10px",
      background: batchFiles.length ? `linear-gradient(135deg,${T.ac},${solar ? "#7f1d1d" : "#8e2118"})` : T.bBg,
      border: "none",
      borderRadius: 8,
      color: batchFiles.length ? "#fff" : T.td,
      fontWeight: 600,
      fontSize: 12,
      cursor: batchFiles.length ? "pointer" : "default",
      fontFamily: "'Crimson Pro',serif"
    }
  }, "▶", " Procesar ", batchFiles.length || "", " foto", batchFiles.length === 1 ? "" : "s", window.showDirectoryPicker ? " → elegir carpeta destino" : "") : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      batchCancelRef.current = true;
    },
    style: {
      flex: 1,
      padding: "9px 10px",
      background: T.cBg,
      border: `1px solid ${T.acBd}`,
      borderRadius: 8,
      color: T.ac,
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "'Crimson Pro',serif"
    }
  }, "■", " Cancelar")))), /*#__PURE__*/React.createElement("footer", {
    style: {
      padding: "14px 20px",
      borderTop: `1px solid ${T.fBd}`,
      textAlign: "center",
      fontSize: 10,
      color: T.fTx,
      fontFamily: mono,
      position: "relative",
      zIndex: 5,
      lineHeight: 1.8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.gn,
      fontWeight: 500
    }
  }, "OPC"), " \u2013 OpuntiaColor v3.2 \xB7 12 filtros \xB7 Lote fotogram\xE9trico \xB7 Estad\xEDsticas por zona \xB7 Stacking \xB7 GPS/EXIF \xB7 100% offline"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.tm
    }
  }, "Dr. Emilio A. Villafa\xF1ez"), " \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.tm
    }
  }, "LATDAA"), " \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.tm
    }
  }, "Fund. F\xE9lix de Azara"), " \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.tm
    }
  }, "Universidad Nacional de Catamarca (UNCA), Argentina"))), /*#__PURE__*/React.createElement("style", null, `
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input[type="range"]{-webkit-appearance:none;height:3px;border-radius:2px;background:${T.sT};outline:none}
        input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${T.ac};cursor:pointer;border:2px solid ${T.tB};box-shadow:0 1px 4px rgba(0,0,0,0.3)}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.sT};border-radius:2px}
      `), /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      display: "none"
    }
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(RockArtEnhancer));