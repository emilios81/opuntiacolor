/*
 * OPC – OpuntiaColor · pruebas automáticas del núcleo de procesamiento
 *
 * Copyright (C) 2025-2026  Emilio A. Villafañez
 * LATDAA – Universidad Nacional de Catamarca (UNCa), Argentina
 *
 * Este programa es software libre bajo la GNU General Public License v3.0
 * o posterior. Ver el archivo LICENSE.
 *
 * Uso:  node tests/run-tests.js
 *
 * Sin dependencias externas y sin imágenes de entrada: todos los casos son
 * sintéticos y deterministas. Las funciones no se copian acá: se extraen del
 * propio src/app.jsx en tiempo de ejecución, de modo que la prueba siempre
 * corre contra el código que se publica.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src", "app.jsx");

// ============================================================
// Mini framework
// ============================================================

let passed = 0, failed = 0, current = "";
const failures = [];

function suite(name, fn) {
  console.log("\n\x1b[1m" + name + "\x1b[0m");
  fn();
}

function test(name, fn) {
  current = name;
  try {
    fn();
    passed++;
    console.log("  \x1b[32m✓\x1b[0m " + name);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log("  \x1b[31m✗\x1b[0m " + name);
    console.log("    \x1b[31m" + e.message.split("\n").join("\n    ") + "\x1b[0m");
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function assertClose(actual, expected, tol, msg) {
  const d = Math.abs(actual - expected);
  const rel = d / Math.max(1, Math.abs(expected));
  if (rel > tol) {
    throw new Error(
      (msg ? msg + ": " : "") +
      "esperado " + expected + ", obtenido " + actual +
      " (error relativo " + rel.toExponential(3) + " > " + tol + ")"
    );
  }
}

function assertBytesEqual(a, b, msg) {
  if (a.length !== b.length) throw new Error((msg || "") + " — longitudes distintas: " + a.length + " vs " + b.length);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) throw new Error((msg || "") + " — primer byte distinto en " + i + ": " + a[i] + " vs " + b[i]);
  }
}

// ============================================================
// Extracción de funciones desde src/app.jsx
//
// src/app.jsx es JSX y en su nivel superior desestructura React, así que no
// puede requerirse directamente. Se extraen por nombre las funciones puras
// del núcleo de procesamiento —todas declaradas en el nivel superior, con la
// llave de cierre en la columna 0— y se evalúan en un contexto aislado.
// ============================================================

const source = fs.readFileSync(SRC, "utf8").replace(/\r\n/g, "\n");

function extractFunction(name) {
  const marker = "\nfunction " + name + "(";
  const start = source.indexOf(marker);
  if (start === -1) throw new Error("no se encontró la función " + name + " en src/app.jsx");
  const end = source.indexOf("\n}\n", start);
  if (end === -1) throw new Error("no se encontró el cierre de la función " + name);
  return source.slice(start + 1, end + 3);
}

const CORE = [
  "rgb2lab", "lab2rgb", "rgb2ycbcr", "ycbcr2rgb",
  "meanCov3", "meanStd1", "jacobiEigen3", "tukeyFences",
  "buildSAT", "satMean",
  "crgbEnhance", "dsLabEnhance", "ldsEnhance", "ybkEnhance",
  "claheEnhance", "applyPostAdjust", "chromaTarget", "applyPickChain",
  "enhanceRedPigment", "reliefMap", "reliefEscala", "relieveBanda", "quitarTendencia", "boxBlur",
  "opcionesRelieve", "sufijoRelieve",
];

// ImageData no existe en Node: se implementa la parte de la API que usa el
// núcleo (data / width / height), con la misma semántica de recorte que da
// Uint8ClampedArray en el navegador.
const sandbox = {
  Math, Float64Array, Uint8ClampedArray, Uint8Array, Array, Number, Object, JSON, console,
  ImageData: class ImageData {
    constructor(data, width, height) {
      if (typeof data === "number") { height = width; width = data; data = new Uint8ClampedArray(width * height * 4); }
      this.data = data; this.width = width; this.height = height;
    }
  },
};
vm.createContext(sandbox);
// Constantes sueltas que usa el núcleo: se leen del fuente para que la prueba
// siga al valor real y no a una copia que se pueda desactualizar.
const CONSTANTES = ["SRGB_LINEAL", "LDS_TUKEY_K", "RED_SIGMA", "RED_PISO", "RED_ENFASIS", "RELIEF_ESCALAS", "RELIEF_FONDO", "RELIEF_OBJETO", "RELIEF_SUAVE_K", "RELIEF_SUAVE_TOPE"].map(nombre => {
  const m = source.match(new RegExp("^const " + nombre + " = .+;$", "m"));
  if (!m) throw new Error("no se encontró la constante " + nombre + " en src/app.jsx");
  return m[0];
}).join("\n");
vm.runInContext(CONSTANTES + "\n" + CORE.map(extractFunction).join("\n"), sandbox);

const {
  rgb2lab, lab2rgb, rgb2ycbcr, ycbcr2rgb,
  meanCov3, meanStd1, jacobiEigen3, tukeyFences,
  buildSAT, satMean,
  crgbEnhance, dsLabEnhance, ldsEnhance,
  applyPostAdjust, chromaTarget, applyPickChain,
  enhanceRedPigment, reliefMap, quitarTendencia, boxBlur,
  opcionesRelieve, sufijoRelieve,
} = sandbox;
const ImageData = sandbox.ImageData;

// ============================================================
// Utilidades de los casos de prueba
// ============================================================

// Generador congruencial lineal: imágenes reproducibles sin Math.random()
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Imagen sintética con estructura cromática: un fondo de roca con manchas
// rojizas de bajo contraste, que es el caso al que apunta la herramienta.
function syntheticImage(w, h, seed) {
  const rnd = lcg(seed);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const grain = rnd() * 18 - 9;
      const pigment = ((x - w / 2) ** 2 + (y - h / 2) ** 2) < (Math.min(w, h) / 3) ** 2 ? 1 : 0;
      data[i] = 148 + grain + pigment * 14;
      data[i + 1] = 126 + grain + pigment * 3;
      data[i + 2] = 104 + grain - pigment * 2;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, w, h);
}

function cloneImage(img) {
  return new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
}

// --- Referencia independiente para la eigendescomposición ---
//
// Solución analítica de los eigenvalores de una matriz simétrica 3x3 vía las
// raíces del polinomio característico (método trigonométrico de Viète). No
// comparte ni una línea con la rotación de Jacobi que se está probando: si
// ambas coinciden, es porque las dos están bien.
function eigenvaluesAnalytic(A) {
  const p1 = A[0][1] ** 2 + A[0][2] ** 2 + A[1][2] ** 2;
  const q = (A[0][0] + A[1][1] + A[2][2]) / 3;
  if (p1 === 0) return [A[0][0], A[1][1], A[2][2]].sort((a, b) => b - a);
  const p2 = (A[0][0] - q) ** 2 + (A[1][1] - q) ** 2 + (A[2][2] - q) ** 2 + 2 * p1;
  const p = Math.sqrt(p2 / 6);
  const B = [0, 1, 2].map(i => [0, 1, 2].map(j => (A[i][j] - (i === j ? q : 0)) / p));
  const detB =
    B[0][0] * (B[1][1] * B[2][2] - B[1][2] * B[2][1]) -
    B[0][1] * (B[1][0] * B[2][2] - B[1][2] * B[2][0]) +
    B[0][2] * (B[1][0] * B[2][1] - B[1][1] * B[2][0]);
  const r = Math.max(-1, Math.min(1, detB / 2));
  const phi = Math.acos(r) / 3;
  const e1 = q + 2 * p * Math.cos(phi);
  const e3 = q + 2 * p * Math.cos(phi + (2 * Math.PI) / 3);
  return [e1, 3 * q - e1 - e3, e3];
}

function matVec(A, v) {
  return [0, 1, 2].map(i => A[i][0] * v[0] + A[i][1] * v[1] + A[i][2] * v[2]);
}

// Matriz de covarianza simétrica y definida positiva, construida como CᵀC
function randomCovariance(rnd) {
  const C = [0, 1, 2].map(() => [0, 1, 2].map(() => rnd() * 120 - 60));
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    let s = 0;
    for (let k = 0; k < 3; k++) s += C[k][i] * C[k][j];
    M[i][j] = s;
  }
  return M;
}

// ============================================================
// 1. Conversiones de color
// ============================================================

suite("Conversiones de color", () => {
  test("rgb2lab: valores de referencia sRGB / D65", () => {
    // Blanco de referencia: L*=100, a*=b*=0
    const [Lw, aw, bw] = rgb2lab(255, 255, 255);
    assertClose(Lw, 100, 1e-4, "L* del blanco");
    assert(Math.abs(aw) < 0.01 && Math.abs(bw) < 0.01, "el blanco debe ser acromático, dio a*=" + aw + " b*=" + bw);

    // Negro
    const [Lk] = rgb2lab(0, 0, 0);
    assertClose(Lk, 0, 1e-6, "L* del negro");

    // Gris medio sRGB (128,128,128): L* ≈ 53.585
    const [Lg, ag, bg] = rgb2lab(128, 128, 128);
    assertClose(Lg, 53.5850, 1e-4, "L* del gris 128");
    assert(Math.abs(ag) < 0.01 && Math.abs(bg) < 0.01, "el gris debe ser acromático");

    // Rojo primario sRGB: L*≈53.24, a*≈80.09, b*≈67.20
    const [Lr, ar, br] = rgb2lab(255, 0, 0);
    assertClose(Lr, 53.2408, 1e-3, "L* del rojo");
    assertClose(ar, 80.0925, 1e-3, "a* del rojo");
    assertClose(br, 67.2032, 1e-3, "b* del rojo");
  });

  test("la tabla sRGB → lineal da lo mismo que la fórmula, en los 16,7 millones de colores (v3.7.1)", () => {
    // Desde v3.7.1 rgb2lab toma el sRGB lineal de una tabla de 256 valores en
    // vez de calcular la potencia en cada píxel. Si la tabla se apartara de la
    // fórmula aunque sea en el último bit, cambiarían los resultados de todos
    // los filtros LAB: acá se la compara contra la versión anterior, completa.
    const lin = (v) => { const c = v / 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; };
    const f = (t) => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
    for (let r = 0; r < 256; r++) for (let g = 0; g < 256; g++) for (let b = 0; b < 256; b++) {
      const rr = lin(r), gg = lin(g), bb = lin(b);
      const x = f((rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) / 0.95047);
      const y = f(rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750);
      const z = f((rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041) / 1.08883);
      const [L, A, B] = rgb2lab(r, g, b);
      if (L !== 116 * y - 16 || A !== 500 * (x - y) || B !== 200 * (y - z))
        throw new Error("rgb2lab(" + r + "," + g + "," + b + ") se aparta de la fórmula directa");
    }
  });

  test("rgb2lab → lab2rgb: ida y vuelta sin deriva", () => {
    const rnd = lcg(7);
    let maxErr = 0;
    for (let i = 0; i < 4000; i++) {
      const r = Math.floor(rnd() * 256), g = Math.floor(rnd() * 256), b = Math.floor(rnd() * 256);
      const [L, a, bb] = rgb2lab(r, g, b);
      const [r2, g2, b2] = lab2rgb(L, a, bb);
      maxErr = Math.max(maxErr, Math.abs(r - r2), Math.abs(g - g2), Math.abs(b - b2));
    }
    // lab2rgb redondea a entero: 1 nivel de 255 es el error máximo admisible
    assert(maxErr <= 1, "la ida y vuelta RGB→LAB→RGB se desvía hasta " + maxErr + " niveles");
  });

  test("rgb2ycbcr → ycbcr2rgb: ida y vuelta sin deriva", () => {
    const rnd = lcg(11);
    let maxErr = 0;
    for (let i = 0; i < 4000; i++) {
      const r = Math.floor(rnd() * 256), g = Math.floor(rnd() * 256), b = Math.floor(rnd() * 256);
      const [y, cb, cr] = rgb2ycbcr(r, g, b);
      const [r2, g2, b2] = ycbcr2rgb(y, cb, cr);
      maxErr = Math.max(maxErr, Math.abs(r - r2), Math.abs(g - g2), Math.abs(b - b2));
    }
    assert(maxErr <= 1, "la ida y vuelta RGB→YCbCr→RGB se desvía hasta " + maxErr + " niveles");
  });

  test("rgb2ycbcr: los grises quedan centrados en 128", () => {
    for (const v of [0, 64, 128, 200, 255]) {
      const [y, cb, cr] = rgb2ycbcr(v, v, v);
      assertClose(y, v, 1e-9, "luma del gris " + v);
      assertClose(cb, 128, 1e-9, "Cb del gris " + v);
      assertClose(cr, 128, 1e-9, "Cr del gris " + v);
    }
  });
});

// ============================================================
// 2. Eigendescomposición  (regresión del error corregido en v3.3.0)
// ============================================================

suite("Eigendescomposición de Jacobi", () => {
  test("eigenvalores contra valores conocidos de forma cerrada", () => {
    // Matriz tridiagonal clásica: eigenvalores exactos 2+√2, 2, 2−√2
    const A = [[2, -1, 0], [-1, 2, -1], [0, -1, 2]];
    const { stds } = jacobiEigen3(A);
    const got = stds.map(s => s * s);
    const want = [2 + Math.SQRT2, 2, 2 - Math.SQRT2];
    for (let k = 0; k < 3; k++) assertClose(got[k], want[k], 1e-12, "λ" + (k + 1));
  });

  test("eigenvalores con multiplicidad (caso degenerado)", () => {
    // [[4,1,1],[1,4,1],[1,1,4]] → λ = 6, 3, 3
    const { stds } = jacobiEigen3([[4, 1, 1], [1, 4, 1], [1, 1, 4]]);
    const got = stds.map(s => s * s);
    for (let k = 0; k < 3; k++) assertClose(got[k], [6, 3, 3][k], 1e-12, "λ" + (k + 1));
  });

  test("eigenvalores contra la solución analítica, 500 covarianzas al azar", () => {
    // Este es el caso que fallaba hasta v3.2.1: la iteración perdía la
    // simetría de la matriz y convergía a eigenvalores incorrectos.
    const rnd = lcg(1986);
    let peor = 0;
    for (let t = 0; t < 500; t++) {
      const A = randomCovariance(rnd);
      const want = eigenvaluesAnalytic(A);
      const got = jacobiEigen3(A).stds.map(s => s * s);
      for (let k = 0; k < 3; k++) {
        const rel = Math.abs(got[k] - want[k]) / Math.max(1, Math.abs(want[k]));
        peor = Math.max(peor, rel);
      }
    }
    assert(peor < 1e-9, "el peor error relativo contra la solución analítica fue " + peor.toExponential(3));
  });

  test("la traza se conserva (suma de eigenvalores = traza)", () => {
    const rnd = lcg(2024);
    for (let t = 0; t < 200; t++) {
      const A = randomCovariance(rnd);
      const traza = A[0][0] + A[1][1] + A[2][2];
      const suma = jacobiEigen3(A).stds.reduce((s, v) => s + v * v, 0);
      assertClose(suma, traza, 1e-10, "traza");
    }
  });

  test("A·v = λ·v para cada eigenvector", () => {
    const rnd = lcg(31);
    for (let t = 0; t < 200; t++) {
      const A = randomCovariance(rnd);
      const { ev, stds } = jacobiEigen3(A);
      for (let k = 0; k < 3; k++) {
        const v = [ev[0][k], ev[1][k], ev[2][k]];
        const Av = matVec(A, v);
        const lv = v.map(c => c * stds[k] * stds[k]);
        const escala = Math.max(1, ...Av.map(Math.abs));
        for (let i = 0; i < 3; i++) {
          assert(Math.abs(Av[i] - lv[i]) / escala < 1e-9,
            "A·v ≠ λ·v en la componente " + i + " del PC" + (k + 1));
        }
      }
    }
  });

  test("los eigenvectores son ortonormales", () => {
    const rnd = lcg(101);
    for (let t = 0; t < 200; t++) {
      const { ev } = jacobiEigen3(randomCovariance(rnd));
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const dot = ev[0][a] * ev[0][b] + ev[1][a] * ev[1][b] + ev[2][a] * ev[2][b];
        assertClose(dot, a === b ? 1 : 0, 1e-9, "v" + a + "·v" + b);
      }
    }
  });

  test("las componentes principales salen ordenadas por varianza descendente", () => {
    // Sin este orden la asignación PC→canal sería arbitraria y los colores
    // no serían comparables entre fotografías del mismo panel.
    const rnd = lcg(55);
    for (let t = 0; t < 300; t++) {
      const { stds } = jacobiEigen3(randomCovariance(rnd));
      assert(stds[0] >= stds[1] && stds[1] >= stds[2],
        "orden incorrecto: " + stds.join(", "));
    }
  });
});

// ============================================================
// 3. Estadísticas y máscara de selección
// ============================================================

suite("Estadísticas y máscara de selección", () => {
  test("meanStd1 sobre la máscara ignora los píxeles no seleccionados", () => {
    const n = 100;
    const arr = new Float64Array(n);
    const mask = new Uint8Array(n);
    for (let i = 0; i < n; i++) { arr[i] = i < 50 ? 10 : 1000; mask[i] = i < 50 ? 1 : 0; }
    const { mean, std } = meanStd1(arr, n, mask);
    assertClose(mean, 10, 1e-12, "media enmascarada");
    assert(std <= 1, "el desvío debería ser nulo dentro de la zona, dio " + std);
  });

  test("meanCov3 sobre la máscara equivale a calcular solo esa zona", () => {
    const rnd = lcg(3);
    const n = 600;
    const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
    const mask = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const sel = i % 3 === 0;
      mask[i] = sel ? 1 : 0;
      for (let k = 0; k < 3; k++) CH[k][i] = sel ? 40 + rnd() * 30 : 200 + rnd() * 50;
    }
    const conMascara = meanCov3(CH, n, mask);

    // Los mismos píxeles seleccionados, pero compactados y sin máscara
    const sel = [];
    for (let i = 0; i < n; i++) if (mask[i]) sel.push(i);
    const SUB = [0, 1, 2].map(k => Float64Array.from(sel.map(i => CH[k][i])));
    const sinMascara = meanCov3(SUB, sel.length, null);

    for (let k = 0; k < 3; k++) assertClose(conMascara.mean[k], sinMascara.mean[k], 1e-10, "media " + k);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      assertClose(conMascara.cov[i][j], sinMascara.cov[i][j], 1e-9, "cov[" + i + "][" + j + "]");
    }
  });

  test("una máscara vacía cae de vuelta a la imagen completa", () => {
    // Si la selección quedó fuera de la imagen no debe dividirse por cero
    const n = 120;
    const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) CH[k][i] = i + k;
    const vacia = new Uint8Array(n); // todos en 0
    const conVacia = meanCov3(CH, n, vacia);
    const completa = meanCov3(CH, n, null);
    assert(conVacia.mask === null, "la máscara vacía debería descartarse");
    for (let k = 0; k < 3; k++) assertClose(conVacia.mean[k], completa.mean[k], 1e-12, "media " + k);
  });

  test("la máscara cambia el resultado del filtro", () => {
    // Comprobación de que la selección realmente se propaga al pipeline
    const img = syntheticImage(40, 40, 5);
    const n = 40 * 40;
    const mask = new Uint8Array(n);
    for (let i = 0; i < n; i++) mask[i] = (i % 40) < 12 ? 1 : 0;
    const sinSel = crgbEnhance(cloneImage(img), 1.5, null, null);
    const conSel = crgbEnhance(cloneImage(img), 1.5, mask, null);
    let distintos = 0;
    for (let i = 0; i < sinSel.data.length; i++) if (sinSel.data[i] !== conSel.data[i]) distintos++;
    assert(distintos > 0, "la máscara no tuvo ningún efecto sobre el resultado");
  });
});

// ============================================================
// 4. Imagen integral (contraste local)
// ============================================================

suite("Imagen integral", () => {
  test("satMean coincide con el promedio calculado a mano", () => {
    const w = 23, h = 17, rnd = lcg(9);
    const src = new Float64Array(w * h);
    for (let i = 0; i < src.length; i++) src[i] = rnd() * 255;
    const sat = buildSAT(src, w, h);
    const ventanas = [[0, 0, 0, 0], [0, 0, w - 1, h - 1], [3, 2, 9, 11], [w - 4, h - 5, w - 1, h - 1]];
    for (const [x0, y0, x1, y1] of ventanas) {
      let s = 0, c = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { s += src[y * w + x]; c++; }
      assertClose(satMean(sat, w, x0, y0, x1, y1), s / c, 1e-9,
        "ventana " + [x0, y0, x1, y1].join(","));
    }
  });
});

// ============================================================
// 5. Determinismo
// ============================================================

suite("Determinismo", () => {
  const filtros = { CRGB: crgbEnhance, "DS-LAB": dsLabEnhance, LDS: ldsEnhance };

  for (const [nombre, fn] of Object.entries(filtros)) {
    test(nombre + ": la misma entrada produce siempre la misma salida", () => {
      const img = syntheticImage(32, 32, 42);
      const a = fn(cloneImage(img), 1.8, null, null);
      const b = fn(cloneImage(img), 1.8, null, null);
      assertBytesEqual(a.data, b.data, nombre + " no es determinista");
    });
  }

  test("el canal alfa siempre queda opaco", () => {
    const out = crgbEnhance(syntheticImage(16, 16, 1), 1.5, null, null);
    for (let i = 3; i < out.data.length; i += 4) {
      assert(out.data[i] === 255, "alfa no opaco en el píxel " + ((i - 3) / 4));
    }
  });

  test("applyPostAdjust es neutro con contraste y saturación en cero", () => {
    const img = syntheticImage(16, 16, 2);
    const original = new Uint8ClampedArray(img.data);
    applyPostAdjust(img, 0, 0);
    assertBytesEqual(img.data, original, "el ajuste neutro modificó los píxeles");
  });

  test("applyPostAdjust: saturación −100 deja la imagen en escala de grises", () => {
    const img = syntheticImage(16, 16, 3);
    applyPostAdjust(img, 0, -100);
    for (let i = 0; i < img.data.length; i += 4) {
      assert(img.data[i] === img.data[i + 1] && img.data[i + 1] === img.data[i + 2],
        "el píxel " + (i / 4) + " no quedó gris: " + [img.data[i], img.data[i + 1], img.data[i + 2]]);
    }
  });
});

// ============================================================
// 6. Congelado de estadísticas del lote
// ============================================================

suite("Procesado por lote: estadísticas congeladas", () => {
  const filtros = { CRGB: crgbEnhance, "DS-LAB": dsLabEnhance, LDS: ldsEnhance };

  for (const [nombre, fn] of Object.entries(filtros)) {
    test(nombre + ": la referencia congela las estadísticas y el lote las reutiliza", () => {
      const referencia = syntheticImage(28, 28, 100);
      const otra = syntheticImage(28, 28, 777);

      const store = {};
      fn(cloneImage(referencia), 1.6, null, store);
      assert(store.frozen, nombre + " no congeló nada en la primera foto");

      const congeladoAntes = JSON.stringify(store.frozen);
      fn(cloneImage(otra), 1.6, null, store);
      assert(JSON.stringify(store.frozen) === congeladoAntes,
        nombre + " recalculó las estadísticas en la segunda foto del lote");
    });

    test(nombre + ": la foto del lote se procesa distinto que por separado", () => {
      // Si el congelado no se estuviera usando, ambos resultados serían iguales
      const referencia = syntheticImage(28, 28, 100);
      const otra = syntheticImage(28, 28, 777);

      const store = {};
      fn(cloneImage(referencia), 1.6, null, store);
      const enLote = fn(cloneImage(otra), 1.6, null, store);
      const suelta = fn(cloneImage(otra), 1.6, null, null);

      let distintos = 0;
      for (let i = 0; i < enLote.data.length; i++) if (enLote.data[i] !== suelta.data[i]) distintos++;
      assert(distintos > 0,
        nombre + ": procesar dentro del lote dio exactamente lo mismo que suelta, " +
        "las estadísticas congeladas no se están aplicando");
    });
  }

  test("la foto de referencia da el mismo resultado dentro y fuera del lote", () => {
    const referencia = syntheticImage(28, 28, 100);
    const store = {};
    const enLote = crgbEnhance(cloneImage(referencia), 1.6, null, store);
    const suelta = crgbEnhance(cloneImage(referencia), 1.6, null, null);
    assertBytesEqual(enLote.data, suelta.data,
      "la referencia no debería cambiar por el hecho de abrir un lote");
  });

  test("todo el lote comparte la misma matriz de decorrelación", () => {
    const store = {};
    crgbEnhance(syntheticImage(24, 24, 1), 1.5, null, store);
    const ev0 = JSON.stringify(store.frozen.ev);
    for (let k = 2; k <= 5; k++) {
      crgbEnhance(syntheticImage(24, 24, k * 313), 1.5, null, store);
      assert(JSON.stringify(store.frozen.ev) === ev0,
        "la matriz cambió en la foto " + k + " del lote");
    }
  });
});

// ============================================================
// 7. LDS: la intensidad como exponente de blanqueo  (v3.4.0)
//
// Hasta v3.3.0 el control de intensidad no tenía ningún efecto en LDS: se
// multiplicaba por un factor común a las tres componentes principales, y ese
// factor se cancelaba exactamente contra la normalización por mínimo y máximo
// del final. Desde v3.4.0 la intensidad es el exponente γ del blanqueo, que
// cambia la forma de la transformación y por lo tanto no puede cancelarse.
// ============================================================

// Correlación media |r| entre pares de canales de la salida. Es la medida
// directa de cuánta decorrelación aplicó el filtro: más baja, más separados
// quedaron los canales.
function correlacionMedia(data) {
  const n = data.length / 4;
  const C = [[], [], []];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) C[k].push(data[i * 4 + k]);
  const mu = C.map(a => a.reduce((x, y) => x + y, 0) / n);
  const sd = C.map((a, k) => Math.sqrt(a.reduce((x, y) => x + (y - mu[k]) ** 2, 0) / n));
  let suma = 0, pares = 0;
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
    let cov = 0;
    for (let i = 0; i < n; i++) cov += (C[a][i] - mu[a]) * (C[b][i] - mu[b]);
    suma += Math.abs(cov / n / (sd[a] * sd[b] || 1));
    pares++;
  }
  return suma / pares;
}

// FNV-1a de 32 bits, para fijar una salida exacta sin guardar la imagen
function fnv1a(bytes) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

suite("LDS: intensidad como exponente de blanqueo", () => {
  test("la intensidad tiene efecto (regresión del problema de v3.3.0)", () => {
    const img = syntheticImage(24, 24, 8);
    const suave = ldsEnhance(cloneImage(img), 0.5, null, null);
    const fuerte = ldsEnhance(cloneImage(img), 2.5, null, null);
    let distintos = 0;
    for (let i = 0; i < suave.data.length; i++) if (suave.data[i] !== fuerte.data[i]) distintos++;
    assert(distintos > 0,
      "la intensidad volvió a no tener efecto en LDS: la salida con 0.5 y con 2.5 " +
      "es idéntica. Es el problema que se corrigió en v3.4.0 — revisar que el " +
      "factor por componente siga siendo un exponente y no una escala común.");
  });

  test("la salida por defecto queda fijada (v3.5.0)", () => {
    // El checksum se refijó en v3.5.0, cuando cambió la normalización de LDS
    // (de mínimo/máximo por canal a vallas de Tukey con ganancia y
    // desplazamiento comunes). Si esta prueba falla, la salida de LDS cambió
    // otra vez: no actualizar el número sin bump de versión y aviso en el
    // CHANGELOG, porque invalida el material ya publicado con esta versión.
    const salida = ldsEnhance(syntheticImage(48, 48, 3300), 1.5, null, null);
    assert(fnv1a(salida.data) === 268033351,
      "la salida por defecto de LDS cambió (checksum " + fnv1a(salida.data) +
      ", esperado 268033351)");
  });

  test("γ < 1 decorrela parcialmente: menos intensidad, canales más correlacionados", () => {
    // Es lo que hace útil el control para verificar un motivo con menos realce.
    const img = syntheticImage(56, 56, 42);
    let anterior = -1;
    for (const it of [0.2, 0.5, 1.0, 1.5]) {
      const r = correlacionMedia(ldsEnhance(cloneImage(img), it, null, null).data);
      if (anterior >= 0) {
        assert(r < anterior,
          "la correlación entre canales no bajó al subir la intensidad a " + it +
          " (" + anterior.toFixed(4) + " → " + r.toFixed(4) + ")");
      }
      anterior = r;
    }
  });

  test("el exponente topea en γ = 2: de intensidad 3.0 en adelante no cambia nada", () => {
    const img = syntheticImage(32, 32, 17);
    const tope = ldsEnhance(cloneImage(img), 3.0, null, null);
    for (const it of [4.0, 5.0]) {
      assertBytesEqual(ldsEnhance(cloneImage(img), it, null, null).data, tope.data,
        "la intensidad " + it + " debería dar lo mismo que 3.0 (γ topeado en 2)");
    }
  });

  test("la intensidad se aplica igual en el lote, sin descongelar estadísticas", () => {
    // γ es un parámetro, no una estadística: el lote debe respetarlo sin
    // recalcular la matriz de decorrelación de la referencia.
    const referencia = syntheticImage(28, 28, 100);
    const otra = syntheticImage(28, 28, 777);
    const store = {};
    ldsEnhance(cloneImage(referencia), 0.6, null, store);
    const ev0 = JSON.stringify(store.frozen.ev);
    const a = ldsEnhance(cloneImage(otra), 0.6, null, store);
    assert(JSON.stringify(store.frozen.ev) === ev0, "el lote recalculó la matriz");

    const store2 = {};
    ldsEnhance(cloneImage(referencia), 2.4, null, store2);
    const b = ldsEnhance(cloneImage(otra), 2.4, null, store2);
    let distintos = 0;
    for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) distintos++;
    assert(distintos > 0, "la intensidad no tuvo efecto sobre las fotos del lote");
  });
});

// ============================================================
// 8. LDS: la normalización conserva el tono  (v3.5.0)
//
// Hasta v3.4.0 cada canal se estiraba entre su mínimo y su máximo absolutos.
// Como cada canal recibía una ganancia y un corrimiento distintos, la relación
// entre canales se rompía: una roca marrón (R > G > B) salía azul violácea
// (B > G > R). Era el "todo violeta" que se veía en fotos de campo. Desde
// v3.5.0 la ganancia y el desplazamiento son comunes a los tres canales, así
// que el orden de los canales no puede invertirse.
// ============================================================

// Media de cada canal de una ImageData, opcionalmente solo de las primeras
// filas (para medir la roca sin incluir la tarjeta de color).
function mediasCanal(img, filas) {
  const n = (filas || img.height) * img.width, d = img.data, m = [0, 0, 0];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) m[k] += d[i * 4 + k];
  return m.map(v => v / n);
}

// Escena tipo foto de campo: roca marrón con un motivo tenue y una franja
// saturada abajo que imita la tarjeta de color y la mano sosteniéndola.
function escenaConTarjeta(w, h, seed, filasTarjeta) {
  const img = syntheticImage(w, h, seed);
  const d = img.data;
  for (let y = h - filasTarjeta; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const c = x < w / 3 ? [210, 20, 30] : x < 2 * w / 3 ? [20, 150, 60] : [245, 245, 240];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  return img;
}

// Desvío estándar medio de los tres canales en las primeras filas: cuánto
// contraste conserva la roca después del filtro.
function contrasteMedio(img, filas) {
  const n = filas * img.width, d = img.data, m = mediasCanal(img, filas);
  let suma = 0;
  for (let k = 0; k < 3; k++) {
    let acc = 0;
    for (let i = 0; i < n; i++) acc += (d[i * 4 + k] - m[k]) ** 2;
    suma += Math.sqrt(acc / n);
  }
  return suma / 3;
}

suite("LDS: la normalización conserva el tono", () => {
  test("una roca marrón no sale violácea (regresión del problema de v3.4.0)", () => {
    // La entrada tiene R > G > B. Con la normalización por canal de v3.4.0
    // esta prueba fallaba: la salida quedaba con B > G > R.
    const img = syntheticImage(48, 48, 4242);
    const ent = mediasCanal(img);
    assert(ent[0] > ent[1] && ent[1] > ent[2], "la imagen de prueba ya no es marrón");
    const sal = mediasCanal(ldsEnhance(cloneImage(img), 1.5, null, null));
    assert(sal[0] > sal[1] && sal[1] > sal[2],
      "LDS invirtió el orden de los canales: entrada R,G,B = " +
      ent.map(v => v.toFixed(0)).join(",") + " → salida " +
      sal.map(v => v.toFixed(0)).join(",") + ". Es el viraje a violeta que se " +
      "corrigió en v3.5.0: revisar que la ganancia y el desplazamiento sigan " +
      "siendo comunes a los tres canales.");
  });

  test("la ganancia y el desplazamiento son comunes: las diferencias entre canales se escalan por igual", () => {
    // Propiedad estructural de una transformación afín común: si todos los
    // canales comparten s y o, el cociente entre dos diferencias de canal se
    // mantiene. Con normalización por canal, no.
    const img = syntheticImage(40, 40, 99);
    const store = {};
    ldsEnhance(cloneImage(img), 1.5, null, store);
    assert(typeof store.frozen.gain === "number" && typeof store.frozen.offset === "number",
      "la normalización dejó de exponer una ganancia y un desplazamiento únicos");
    assert(store.frozen.gain > 0, "la ganancia quedó en cero: la salida sería plana");
  });

  test("las vallas de Tukey no se mueven por un objeto extremo en el encuadre", () => {
    // Es lo que hacía que la tarjeta de color aplastara toda la escena: con
    // mínimo y máximo absolutos, un puñado de píxeles fijaba el rango.
    const n = 4000, base = new Float64Array(n);
    for (let i = 0; i < n; i++) base[i] = 100 + (i % 40) - 20;
    const conExtremos = new Float64Array(base);
    for (let i = 0; i < 40; i++) conExtremos[i] = 5000;   // 1% de píxeles disparados
    const a = tukeyFences(base, n, null, 3);
    const b = tukeyFences(conExtremos, n, null, 3);
    assert(Math.abs(a.hi - b.hi) < 5 && Math.abs(a.lo - b.lo) < 5,
      "las vallas se movieron con el 1% de píxeles extremos: " +
      a.lo.toFixed(1) + ".." + a.hi.toFixed(1) + " → " + b.lo.toFixed(1) + ".." + b.hi.toFixed(1));
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) { if (conExtremos[i] < mn) mn = conExtremos[i]; if (conExtremos[i] > mx) mx = conExtremos[i]; }
    assert(mx - mn > 10 * (b.hi - b.lo),
      "el caso de prueba no es representativo: el rango absoluto debería ser " +
      "mucho más ancho que el de las vallas");
  });

  test("con la tarjeta de color en el encuadre, la roca no se aplasta", () => {
    // El caso que motivó el cambio: una franja saturada —tarjeta de color y
    // mano— dentro del encuadre. Con mínimo y máximo absolutos, esa franja
    // fijaba el rango de salida y comprimía toda la roca.
    const w = 64, h = 64, filas = 4;          // la franja ocupa el 6% del cuadro
    const roca = h - filas - 1;
    const sinT = ldsEnhance(syntheticImage(w, h, 4242), 1.5, null, null);
    const conT = ldsEnhance(escenaConTarjeta(w, h, 4242, filas), 1.5, null, null);
    const b = mediasCanal(conT, roca);
    assert(b[0] > b[1] && b[1] > b[2],
      "con la tarjeta en el encuadre la roca perdió el orden de canales: " +
      b.map(v => v.toFixed(0)).join(","));
    const cSin = contrasteMedio(sinT, roca), cCon = contrasteMedio(conT, roca);
    assert(cCon > 0.5 * cSin,
      "la tarjeta redujo el contraste de la roca de " + cSin.toFixed(1) + " a " +
      cCon.toFixed(1) + " (más de la mitad): la normalización volvió a depender " +
      "de los píxeles extremos");
  });
});

// ============================================================
// 9. Gotero cromático  (v3.5.0)
//
// Realce o atenuación selectiva de una familia de color sobre el resultado del
// filtro. Las propiedades que tienen que sostenerse: no toca la luminancia, no
// toca los colores fuera de la tolerancia, y con ganancia −100 deja el color
// muestreado exactamente en gris.
// ============================================================

// Imagen de 4 franjas verticales de color plano, para verificar qué se toca
// y qué no.
function franjas(colores) {
  const w = colores.length * 4, h = 4;
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = colores[Math.floor(x / 4)], i = (y * w + x) * 4;
    d[i] = c[0]; d[i+1] = c[1]; d[i+2] = c[2]; d[i+3] = 255;
  }
  return new ImageData(d, w, h);
}

function luma(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

const ROJO = [190, 60, 45], VERDE = [60, 170, 70], GRIS = [128, 128, 128];

suite("Gotero cromático", () => {
  test("sin muestra o con ganancia cero no cambia nada", () => {
    const img = franjas([ROJO, VERDE, GRIS]);
    const copia = cloneImage(img);
    chromaTarget(img, null, 20, 50, 80);
    assertBytesEqual(img.data, copia.data, "cambió la imagen sin color muestreado");
    chromaTarget(img, { r:190, g:60, b:45 }, 20, 50, 0);
    assertBytesEqual(img.data, copia.data, "cambió la imagen con ganancia 0");
  });

  test("atenuar al máximo deja el color muestreado en gris neutro", () => {
    const img = franjas([ROJO, VERDE, GRIS]);
    chromaTarget(img, { r:ROJO[0], g:ROJO[1], b:ROJO[2] }, 20, 0, -100);
    const d = img.data;   // primer píxel = franja roja
    assert(Math.abs(d[0]-d[1]) <= 1 && Math.abs(d[1]-d[2]) <= 1,
      "el rojo no quedó neutro: rgb(" + d[0] + "," + d[1] + "," + d[2] + ")");
  });

  test("no toca los colores fuera de la tolerancia", () => {
    const img = franjas([ROJO, VERDE, GRIS]);
    const antes = cloneImage(img);
    chromaTarget(img, { r:ROJO[0], g:ROJO[1], b:ROJO[2] }, 15, 0, 100);
    const w = img.width;
    for (const col of [4, 8]) {   // franjas verde y gris
      const i = col * 4 + 4;      // segundo píxel de la franja
      for (let k = 0; k < 3; k++) {
        assert(img.data[i+k] === antes.data[i+k],
          "se modificó una franja fuera de la tolerancia (columna " + col + ", canal " + k + ")");
      }
    }
  });

  test("la luminancia no cambia: el relieve y la textura quedan intactos", () => {
    const img = franjas([ROJO, VERDE, GRIS]);
    const antes = cloneImage(img);
    chromaTarget(img, { r:ROJO[0], g:ROJO[1], b:ROJO[2] }, 40, 100, 100);
    const n = img.width * img.height;
    for (let i = 0; i < n; i++) {
      const a = luma(antes.data[i*4], antes.data[i*4+1], antes.data[i*4+2]);
      const b = luma(img.data[i*4], img.data[i*4+1], img.data[i*4+2]);
      assert(Math.abs(a - b) <= 1.5,
        "la luminancia del píxel " + i + " cambió de " + a.toFixed(1) + " a " + b.toFixed(1));
    }
  });

  test("realzar aumenta la crominancia del color muestreado", () => {
    const img = franjas([ROJO, VERDE, GRIS]);
    const antes = cloneImage(img);
    chromaTarget(img, { r:ROJO[0], g:ROJO[1], b:ROJO[2] }, 20, 0, 100);
    const croma = (d, i) => {
      const cb = -0.168736*d[i] - 0.331264*d[i+1] + 0.5*d[i+2];
      const cr = 0.5*d[i] - 0.418688*d[i+1] - 0.081312*d[i+2];
      return Math.sqrt(cb*cb + cr*cr);
    };
    assert(croma(img.data, 0) > croma(antes.data, 0) * 1.5,
      "la crominancia del color muestreado no subió lo esperado");
  });

  test("la cobertura informada está entre 0 y 1 y crece con la tolerancia", () => {
    const img1 = franjas([ROJO, VERDE, GRIS]), img2 = franjas([ROJO, VERDE, GRIS]);
    const pick = { r:ROJO[0], g:ROJO[1], b:ROJO[2] };
    const a = chromaTarget(img1, pick, 10, 0, 50).coverage;
    const b = chromaTarget(img2, pick, 200, 0, 50).coverage;
    assert(a >= 0 && a <= 1 && b >= 0 && b <= 1, "cobertura fuera de rango");
    assert(b > a, "la cobertura no creció al ampliar la tolerancia (" + a.toFixed(3) + " → " + b.toFixed(3) + ")");
  });
});

// La cadena del gotero: los ajustes fijados se guardan como reglas y la imagen
// se recalcula siempre desde el resultado del filtro. De ahí sale la propiedad
// que hace reversible la herramienta: quitar un ajuste del medio devuelve
// exactamente la imagen que habría dado no haberlo aplicado nunca.
suite("Gotero: cadena de ajustes acumulables", () => {
  const A = { r:190, g:60,  b:45,  tol:20, feather:0, gain:-100 };  // apaga el rojo
  const B = { r:60,  g:170, b:70,  tol:20, feather:0, gain:-80  };  // atenúa el verde
  const C = { r:70,  g:90,  b:200, tol:20, feather:0, gain:60 };   // realza el azul

  function base() { return franjas([ROJO, VERDE, [70,90,200], GRIS]); }

  test("una cadena vacía no cambia nada", () => {
    const img = base(), copia = cloneImage(img);
    applyPickChain(img, [], null);
    assertBytesEqual(img.data, copia.data, "la cadena vacía modificó la imagen");
  });

  test("quitar un ajuste equivale a no haberlo aplicado nunca", () => {
    const conB = base(); applyPickChain(conB, [A, B, C], null);
    const sinB = base(); applyPickChain(sinB, [A, C], null);
    // La app no guarda imágenes intermedias: al quitar B recalcula [A, C]
    // desde el resultado del filtro. Esta es esa segunda pasada.
    const recalculado = base(); applyPickChain(recalculado, [A, C], null);
    assertBytesEqual(recalculado.data, sinB.data,
      "recalcular la cadena sin B no dio el mismo resultado que la cadena [A, C]");
    let distintos = 0;
    for (let i = 0; i < conB.data.length; i++) if (conB.data[i] !== sinB.data[i]) distintos++;
    assert(distintos > 0, "el ajuste B no hacía nada: la prueba no verifica nada");
  });

  test("el orden importa cuando dos ajustes se superponen", () => {
    // Dos ajustes sobre familias cercanas: aplicar uno cambia el color que el
    // otro encuentra. Que el orden importe es esperable, y por eso la lista de
    // ajustes se muestra numerada.
    const D = { r:190, g:60, b:45, tol:45, feather:0, gain:-60 };
    const E = { r:170, g:90, b:60, tol:45, feather:0, gain:80 };
    const uno = base(); applyPickChain(uno, [D, E], null);
    const otro = base(); applyPickChain(otro, [E, D], null);
    let distintos = 0;
    for (let i = 0; i < uno.data.length; i++) if (uno.data[i] !== otro.data[i]) distintos++;
    assert(distintos > 0, "invertir el orden de dos ajustes superpuestos dio lo mismo");
  });

  test("el ajuste en curso se aplica último", () => {
    const conCurso = base(); applyPickChain(conCurso, [A], B);
    const comoFijado = base(); applyPickChain(comoFijado, [A, B], null);
    assertBytesEqual(conCurso.data, comoFijado.data,
      "fijar un ajuste cambió el resultado respecto de tenerlo en curso");
  });

  test("la cobertura informada es la del ajuste en curso", () => {
    const img = base();
    const { coverage } = applyPickChain(img, [A, B], C);
    assert(coverage > 0 && coverage < 0.5,
      "la cobertura debería ser la del ajuste en curso solo (fue " + coverage.toFixed(3) + ")");
    const img2 = base();
    assert(applyPickChain(img2, [A, B], null).coverage === 0,
      "sin ajuste en curso la cobertura informada debería ser 0");
  });
});

// ============================================================
// 10. Rojo adaptativo  (v3.7.0)
//
// Hasta v3.6.0 el Rojo era una transformación fija en CIE-LAB: multiplicaba a*
// sin mirar la foto, así que en una arenisca rojiza enrojecía roca y pigmento
// por igual. Desde v3.7.0 es una decorrelación en el plano a*-b* calculada con
// los colores de la propia foto. Lo que tiene que sostenerse: separa el
// pigmento del soporte, lleva el color de la roca a gris sea cual sea su
// dominante, no deja que la tarjeta de color decida, y no toca L*.
// ============================================================

// Arenisca con bandas de hierro —un naranja que va de claro a intenso— y trazos
// verticales de ocre apenas más rojos y menos amarillos que el soporte: el
// caso del panel WLO-3 de B. Gunn, que el Rojo de v3.6.0 no separaba.
function arenisca(w, h, seed, dominante) {
  const [dr, dg, db] = dominante || [0, 0, 0];
  const rnd = lcg(seed);
  const data = new Uint8ClampedArray(w * h * 4), pigmento = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, banda = Math.sin(x / 5 + y / 9) * 0.5 + 0.5, grano = rnd() * 10 - 5;
    const p = (x % 12 < 2 && y > h / 4 && y < 3 * h / 4) ? 1 : 0;
    pigmento[i] = p;
    data[i*4]   = 200 - 20 * banda + grano + p * 2 + dr;
    data[i*4+1] = 170 - 45 * banda + grano - p * 8 + dg;
    data[i*4+2] = 140 - 60 * banda + grano - p * 2 + db;
    data[i*4+3] = 255;
  }
  return { img: new ImageData(data, w, h), pigmento };
}

// Distancia en a* entre la media del pigmento y la de la roca, en desvíos
// estándar de la roca: cuánto se despega el trazo del soporte.
function separacionA(img, pigmento) {
  const n = img.width * img.height, A = new Float64Array(n);
  let sp = 0, np = 0, sr = 0, nr = 0;
  for (let i = 0; i < n; i++) {
    A[i] = rgb2lab(img.data[i*4], img.data[i*4+1], img.data[i*4+2])[1];
    if (pigmento[i]) { sp += A[i]; np++; } else { sr += A[i]; nr++; }
  }
  const mp = sp / np, mr = sr / nr;
  let v = 0;
  for (let i = 0; i < n; i++) if (!pigmento[i]) v += (A[i] - mr) ** 2;
  return Math.abs(mp - mr) / Math.sqrt(v / nr);
}

// Media de a* y b* fuera del pigmento: el color de la roca
function colorRoca(img, pigmento) {
  let a = 0, b = 0, c = 0;
  for (let i = 0; i < img.width * img.height; i++) {
    if (pigmento && pigmento[i]) continue;
    const lab = rgb2lab(img.data[i*4], img.data[i*4+1], img.data[i*4+2]);
    a += lab[1]; b += lab[2]; c++;
  }
  return [a / c, b / c];
}

suite("Rojo adaptativo (v3.7.0)", () => {
  test("separa el ocre de una arenisca ferruginosa", () => {
    // En la entrada el trazo está a ~1.4 desvíos de la roca en a*; la
    // decorrelación tiene que despegarlo varias veces más.
    const { img, pigmento } = arenisca(96, 96, 7);
    const antes = separacionA(img, pigmento);
    const despues = separacionA(enhanceRedPigment(cloneImage(img), 1.5, null, null), pigmento);
    assert(despues > 3 * antes,
      "el pigmento no se despegó del soporte: separación " + antes.toFixed(2) +
      " → " + despues.toFixed(2) + " desvíos. Es lo que hacía el Rojo de v3.6.0.");
  });

  test("lleva el color de la roca a gris, tenga la dominante que tenga", () => {
    // La propiedad que define al filtro adaptativo: el color de la roca sale
    // de la foto. Con una transformación fija, una dominante cálida o fría
    // seguía en la salida.
    for (const dom of [[0, 0, 0], [14, 2, -10], [-10, 0, 12]]) {
      const { img, pigmento } = arenisca(96, 96, 7, dom);
      const ent = colorRoca(img, pigmento);
      const sal = colorRoca(enhanceRedPigment(cloneImage(img), 1.5, null, null), pigmento);
      assert(Math.abs(ent[1]) > 15, "el caso de prueba ya no tiene dominante");
      assert(Math.abs(sal[0]) < 4 && Math.abs(sal[1]) < 4,
        "con dominante " + dom.join(",") + " la roca salió con a*,b* = " +
        sal.map(v => v.toFixed(1)).join(",") + " (entrada " + ent.map(v => v.toFixed(1)).join(",") + ")");
    }
  });

  test("la tarjeta de color en el encuadre no cambia la roca", () => {
    // Sin las vallas de Tukey la tarjeta entra en la covarianza y la roca
    // cambia ~14 niveles en promedio; con las vallas, menos de 1.
    const { img } = arenisca(96, 96, 7);
    const conTarjeta = cloneImage(img);
    for (let y = 88; y < 96; y++) for (let x = 0; x < 96; x++) {
      const i = (y * 96 + x) * 4, c = x < 32 ? [210, 20, 30] : x < 64 ? [20, 150, 60] : [30, 40, 200];
      conTarjeta.data[i] = c[0]; conTarjeta.data[i+1] = c[1]; conTarjeta.data[i+2] = c[2];
    }
    const a = enhanceRedPigment(cloneImage(img), 1.5, null, null);
    const b = enhanceRedPigment(conTarjeta, 1.5, null, null);
    let dif = 0, cnt = 0;
    for (let i = 0; i < 88 * 96 * 4; i++) if (i % 4 !== 3) { dif += Math.abs(a.data[i] - b.data[i]); cnt++; }
    assert(dif / cnt < 2,
      "la tarjeta cambió la roca en " + (dif / cnt).toFixed(2) + " niveles de media: " +
      "revisar que la covarianza siga excluyendo lo que cae fuera de las vallas");
  });

  test("no toca la luminosidad L*", () => {
    const { img } = arenisca(64, 64, 11);
    const sal = enhanceRedPigment(cloneImage(img), 1.5, null, null);
    let dif = 0;
    const n = 64 * 64;
    for (let i = 0; i < n; i++) {
      dif += Math.abs(rgb2lab(sal.data[i*4], sal.data[i*4+1], sal.data[i*4+2])[0] -
                      rgb2lab(img.data[i*4], img.data[i*4+1], img.data[i*4+2])[0]);
    }
    assert(dif / n < 0.5, "L* cambió " + (dif / n).toFixed(2) + " de media");
  });

  test("con una selección, las estadísticas salen de la zona", () => {
    const { img } = arenisca(64, 64, 21);
    const mask = new Uint8Array(64 * 64);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) mask[y * 64 + x] = 1;
    const toda = enhanceRedPigment(cloneImage(img), 1.5, null, null);
    const zona = enhanceRedPigment(cloneImage(img), 1.5, mask, null);
    let distintos = 0;
    for (let i = 0; i < toda.data.length; i++) if (toda.data[i] !== zona.data[i]) distintos++;
    assert(distintos > 0, "la selección no cambió el resultado");
    const vacia = enhanceRedPigment(cloneImage(img), 1.5, new Uint8Array(64 * 64), null);
    assertBytesEqual(vacia.data, toda.data, "una selección vacía tiene que equivaler a toda la imagen");
  });

  test("en el lote, la referencia congela las estadísticas y la intensidad se sigue aplicando", () => {
    const ref = arenisca(48, 48, 3).img, otra = arenisca(48, 48, 4, [8, 0, -6]).img;
    const store = {};
    enhanceRedPigment(cloneImage(ref), 1.5, null, store);
    const congelado = JSON.stringify(store.frozen);
    const enLote = enhanceRedPigment(cloneImage(otra), 1.5, null, store);
    assert(JSON.stringify(store.frozen) === congelado, "el lote recalculó las estadísticas");
    const suelta = enhanceRedPigment(cloneImage(otra), 1.5, null, null);
    let distintos = 0;
    for (let i = 0; i < enLote.data.length; i++) if (enLote.data[i] !== suelta.data[i]) distintos++;
    assert(distintos > 0, "la foto del lote salió igual que suelta: no usó lo congelado");
    const fuerte = enhanceRedPigment(cloneImage(otra), 3, null, { frozen: store.frozen });
    distintos = 0;
    for (let i = 0; i < enLote.data.length; i++) if (enLote.data[i] !== fuerte.data[i]) distintos++;
    assert(distintos > 0, "la intensidad no tuvo efecto con estadísticas congeladas");
  });

  test("la salida por defecto queda fijada (v3.7.0)", () => {
    // No actualizar el número sin bump de versión y aviso en el CHANGELOG:
    // invalida el material ya publicado con esta versión.
    const salida = enhanceRedPigment(syntheticImage(48, 48, 3300), 1.5, null, null);
    assert(fnv1a(salida.data) === 2702980345,
      "la salida por defecto del Rojo cambió (checksum " + fnv1a(salida.data) + ", esperado 2702980345)");
  });
});

// ============================================================
// 11. Relieve por escala  (v3.7.0)
//
// Con escala 0 el Relieve tiene que ser el mapa de bordes de v3.0–v3.6, byte a
// byte. Con escala, un pasabanda sobre la luminancia sin la tendencia general:
// tiene que borrar los gradientes de iluminación hasta los bordes, ganar
// señal frente al grano al subir la escala y depender de la escala relativa,
// no de los píxeles.
// ============================================================

// Textura gris de grano fino, con un disco central más oscuro (el motivo) y un
// gradiente horizontal de iluminación opcional.
function texturaConDisco(w, h, seed, gradiente, profundidad) {
  const rnd = lcg(seed), data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const disco = ((x - w / 2) ** 2 + (y - h / 2) ** 2) < 144 ? -profundidad : 0;
    const v = 110 + rnd() * 40 - 20 + disco + gradiente * x / w;
    data[i] = data[i+1] = data[i+2] = v; data[i+3] = 255;
  }
  return new ImageData(data, w, h);
}

suite("Relieve por escala (v3.7.0)", () => {
  test("con escala 0 reproduce exactamente el mapa de bordes de v3.6.0", () => {
    // Checksums tomados de v3.6.0 antes del cambio. Con escala 0 el nombre del
    // archivo exportado es el mismo que en v3.6, así que el resultado también.
    const esperado = { 0.5: 1861599918, 1.5: 2509131848, 3: 1330955877 };
    for (const it of [0.5, 1.5, 3]) {
      for (const opts of [undefined, null, { escala: 0 }]) {
        const h = fnv1a(reliefMap(syntheticImage(48, 48, 3300), it, null, null, opts).data);
        assert(h === esperado[it], "el mapa de bordes cambió con intensidad " + it + " (checksum " + h + ")");
      }
    }
  });

  test("boxBlur coincide con el promedio recortado calculado a mano", () => {
    const w = 13, h = 7, src = new Float32Array(w * h).map((_, i) => (i * 37) % 101);
    const dst = new Float32Array(w * h), tmp = new Float32Array(w * h);
    for (const r of [1, 3, 20]) {
      boxBlur(src, dst, tmp, w, h, r);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let s = 0, c = 0;
        for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++)
          for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) { s += src[yy * w + xx]; c++; }
        assertClose(dst[y * w + x], s / c, 1e-5, "boxBlur r=" + r + " en (" + x + "," + y + ")");
      }
    }
  });

  test("quitarTendencia anula una superficie cuadrática exacta", () => {
    const w = 37, h = 23, L = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      L[y * w + x] = 100 + 0.8 * x - 1.3 * y + 0.02 * x * x + 0.015 * x * y - 0.03 * y * y;
    quitarTendencia(L, w, h);
    for (let i = 0; i < L.length; i++) assert(Math.abs(L[i]) < 1e-3, "quedó un residuo de " + L[i] + " en " + i);
    const fila = new Float32Array(5).fill(7);
    quitarTendencia(fila, 5, 1);
    assert(fila.every(v => v === 7), "con una sola fila no hay superficie que ajustar y no debe tocarse");
  });

  test("un gradiente de iluminación no cambia el resultado, ni junto a los bordes", () => {
    // Es la queja de B. Gunn: un cambio general a lo ancho del panel tapaba la
    // señal. Antes de restar la tendencia cuadrática, con escala 1 una franja
    // de un sexto del ancho cambiaba hasta 100 niveles con este gradiente.
    const W = 400;
    for (const escala of [0.25, 1]) {
      const sin = reliefMap(texturaConDisco(W, W, 5, 0, 0), 1.5, null, null, { escala });
      const con = reliefMap(texturaConDisco(W, W, 5, 60, 0), 1.5, null, null, { escala });
      let peor = 0;
      for (let x = 0; x < W; x++) {
        let d = 0;
        for (let y = 0; y < W; y++) d += Math.abs(sin.data[(y * W + x) * 4] - con.data[(y * W + x) * 4]);
        peor = Math.max(peor, d / W);
      }
      assert(peor < 3, "con escala " + escala + " el gradiente cambió una columna " + peor.toFixed(1) + " niveles de media");
    }
  });

  test("subir la escala separa mejor el motivo del grano", () => {
    // Disco de 24 px, 4 niveles más oscuro, sobre grano de ±20: invisible
    // píxel a píxel. A más escala, más se despega del fondo.
    const W = 400;
    const razon = (escala) => {
      const o = reliefMap(texturaConDisco(W, W, 5, 0, 4), 1.5, null, null, { escala });
      let sd = 0, cd = 0;
      const F = [];
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const v = o.data[(y * W + x) * 4], q = (x - W / 2) ** 2 + (y - W / 2) ** 2;
        if (q < 64) { sd += v; cd++; } else if (q > 900 && q < 6400) F.push(v);
      }
      const mf = F.reduce((a, b) => a + b, 0) / F.length;
      const sf = Math.sqrt(F.reduce((a, b) => a + (b - mf) ** 2, 0) / F.length);
      return Math.abs(sd / cd - mf) / sf;
    };
    const fina = razon(0.5), gruesa = razon(1);
    assert(gruesa > 1.5 * fina && gruesa > 2.5,
      "el motivo no se despegó al subir la escala: " + fina.toFixed(2) + " → " + gruesa.toFixed(2) + " desvíos");
  });

  test("la escala es relativa: la misma foto al doble de resolución da el mismo relieve", () => {
    // Por eso se expresa en % del lado mayor: trabajar en 2000 px o en
    // resolución completa, o reducir en el lote, no cambia lo que se ve.
    // 200 px y 400 px con escala 1 %: radio 1 y radio 2, exactamente el doble.
    const base = texturaConDisco(200, 200, 9, 30, 6);
    const doble = new ImageData(new Uint8ClampedArray(400 * 400 * 4), 400, 400);
    for (let y = 0; y < 400; y++) for (let x = 0; x < 400; x++)
      for (let k = 0; k < 4; k++) doble.data[(y * 400 + x) * 4 + k] = base.data[((y >> 1) * 200 + (x >> 1)) * 4 + k];
    const a = reliefMap(base, 1.5, null, null, { escala: 1 });
    const b = reliefMap(doble, 1.5, null, null, { escala: 1 });
    const xs = [], ys = [];
    for (let y = 0; y < 200; y++) for (let x = 0; x < 200; x++) {
      xs.push(a.data[(y * 200 + x) * 4]);
      const g = (p, q) => b.data[(q * 400 + p) * 4];
      ys.push((g(2*x, 2*y) + g(2*x+1, 2*y) + g(2*x, 2*y+1) + g(2*x+1, 2*y+1)) / 4);
    }
    const mx = xs.reduce((s, v) => s + v, 0) / xs.length, my = ys.reduce((s, v) => s + v, 0) / ys.length;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    const r = sxy / Math.sqrt(sxx * syy);
    assert(r > 0.95, "la correlación entre las dos resoluciones fue " + r.toFixed(3));
  });

  test("en el lote, la referencia congela el centro y el desvío", () => {
    const store = {};
    reliefMap(texturaConDisco(64, 64, 1, 0, 8), 1.5, null, store, { escala: 1 });
    assert(store.frozen && typeof store.frozen.mid === "number" && store.frozen.sig > 0,
      "el Relieve con escala no congeló sus estadísticas");
    const otra = texturaConDisco(64, 64, 2, 40, 8);
    const enLote = reliefMap(cloneImage(otra), 1.5, null, { frozen: store.frozen }, { escala: 1 });
    const suelta = reliefMap(cloneImage(otra), 1.5, null, null, { escala: 1 });
    let distintos = 0;
    for (let i = 0; i < enLote.data.length; i++) if (enLote.data[i] !== suelta.data[i]) distintos++;
    assert(distintos > 0, "la foto del lote salió igual que suelta: no usó lo congelado");
  });

  test("la salida con escala queda fijada (v3.7.0)", () => {
    const salida = reliefMap(syntheticImage(48, 48, 3300), 1.5, null, null, { escala: 0.5 });
    assert(fnv1a(salida.data) === 3661302561,
      "la salida del Relieve con escala 0.5 cambió (checksum " + fnv1a(salida.data) + ", esperado 3661302561)");
  });
});

// ============================================================
// Relieve: opciones (v3.8.0)
//
// Doble (objeto y textura), compresión suave, CLAHE y mezcla con un filtro de
// color. Lo primero es que, apagadas, el Relieve dé byte a byte lo mismo que
// en v3.7: los checksums se tomaron del commit 6f99808, antes del cambio, en
// una imagen de 1200 px de ancho para que cada escala tenga su propio radio.
// ============================================================

suite("Relieve: opciones (v3.8.0)", () => {
  const W = 1200, H = 160, zona = new Uint8Array(W * H);
  for (let y = 30; y < 130; y++) for (let x = 200; x < 700; x++) zona[y * W + x] = 1;
  const v37 = { "0.1|1.5|toda": 2957437714, "0.1|1.5|zona": 2738901222, "0.25|1.5|toda": 1091619538, "0.25|1.5|zona": 1048805178,
    "0.25|3|toda": 920069132, "0.25|3|zona": 2409635513, "0.5|1.5|toda": 1559539038, "0.5|1.5|zona": 2668518489,
    "1|1.5|toda": 4126315670, "1|1.5|zona": 38049753 };
  const apagadas = { doble: null, suave: false, clahe: false, mezcla: null, alfa: 0.5 };

  test("apagadas, el Relieve con escala da lo mismo que en v3.7, byte a byte", () => {
    for (const k of Object.keys(v37)) {
      const [escala, it, donde] = k.split("|"), m = donde === "zona" ? zona : null;
      const a = fnv1a(reliefMap(syntheticImage(W, H, 4242), +it, m, {}, { escala: +escala }).data);
      assert(a === v37[k], `${k}: checksum ${a}, en v3.7 era ${v37[k]}`);
      if (escala === "0.25") {
        const b = fnv1a(reliefMap(syntheticImage(W, H, 4242), +it, m, {}, opcionesRelieve(+escala, apagadas)).data);
        assert(b === v37[k], `${k}: con las opciones apagadas el checksum es ${b}`);
      }
    }
  });

  test("las opciones solo viajan si están prendidas, y el nombre del archivo no cambia sin ellas", () => {
    assert(JSON.stringify(opcionesRelieve(0.25, apagadas)) === '{"escala":0.25}', "apagadas: " + JSON.stringify(opcionesRelieve(0.25, apagadas)));
    const todas = opcionesRelieve(0.25, { doble: 0.5, suave: true, clahe: true, mezcla: "lds", alfa: 0.75 });
    assert(JSON.stringify(todas) === '{"escala":0.25,"doble":0.5,"suave":true,"clahe":true,"mezcla":"lds","alfa":0.75}', "prendidas: " + JSON.stringify(todas));
    assert(JSON.stringify(opcionesRelieve(0, { doble: 0.5, suave: true })) === '{"escala":0}', "sin escala no valen");
    assert(sufijoRelieve({ escala: 0.25 }) === "_e0.25" && sufijoRelieve({ escala: 0 }) === "" && sufijoRelieve(null) === "", "nombres de siempre");
    assert(sufijoRelieve(todas) === "_e0.25_doble50_suave_clahe_lds75", "con todo: " + sufijoRelieve(todas));
  });

  test("Relieve doble: con peso 0 es la textura sola y con peso 1, el objeto solo", () => {
    // Cada nivel se normaliza por su cuenta y la suma se vuelve a normalizar:
    // en los extremos tiene que dar lo mismo que una escala sola, salvo el
    // redondeo de un nivel de gris.
    const img = texturaConDisco(400, 300, 3, 25, 6);
    const dif = (a, b) => { let m = 0; for (let i = 0; i < a.data.length; i++) m = Math.max(m, Math.abs(a.data[i] - b.data[i])); return m; };
    const tex = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5, doble: 0 });
    const obj = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5, doble: 1 });
    assert(dif(tex, reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5 })) <= 1, "con peso 0 no es la textura");
    assert(dif(obj, reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5 * 4 })) <= 1, "con peso 1 no es el objeto (escala ×4)");
    const mitad = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5, doble: 0.5 });
    assert(dif(mitad, tex) > 10 && dif(mitad, obj) > 10, "con peso 0.5 debería ser distinto de los dos");
  });

  test("compresión suave: casi no cambia el centro y no quema los extremos", () => {
    const img = texturaConDisco(300, 300, 7, 0, 30);
    const duro = reliefMap(cloneImage(img), 5, null, null, { escala: 1 }), suave = reliefMap(cloneImage(img), 5, null, null, { escala: 1, suave: true });
    let quemadosDuro = 0, quemadosSuave = 0, peorCentro = 0;
    for (let i = 0; i < duro.data.length; i += 4) {
      if (duro.data[i] === 0 || duro.data[i] === 255) quemadosDuro++;
      if (suave.data[i] === 0 || suave.data[i] === 255) quemadosSuave++;
      if (Math.abs(duro.data[i] - 128) < 20) peorCentro = Math.max(peorCentro, Math.abs(duro.data[i] - suave.data[i]));
    }
    assert(quemadosDuro > 2000, "la prueba necesita extremos recortados: hubo " + quemadosDuro);
    assert(quemadosSuave < quemadosDuro / 20, "la compresión suave sigue quemando " + quemadosSuave + " de " + quemadosDuro);
    assert(peorCentro <= 2, "en el centro cambió hasta " + peorCentro + " niveles");
  });

  test("CLAHE sobre el Relieve: sigue gris y cambia el resultado", () => {
    const img = texturaConDisco(200, 200, 5, 10, 8);
    const sin = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5 }), con = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5, clahe: true });
    let gris = true, distintos = 0;
    for (let i = 0; i < con.data.length; i += 4) {
      if (con.data[i] !== con.data[i + 1] || con.data[i] !== con.data[i + 2]) gris = false;
      if (con.data[i] !== sin.data[i]) distintos++;
    }
    assert(gris && distintos > con.data.length / 8, "CLAHE: gris " + gris + ", distintos " + distintos);
  });

  test("mezcla con color: con alfa 0 es el filtro de color; con alfa 1, la luz es la del relieve", () => {
    const img = syntheticImage(160, 120, 77);
    for (const [mezcla, fn] of [["lds", ldsEnhance], ["dslab", dsLabEnhance]]) {
      const color = fn(cloneImage(img), 1.5, null, null);
      const cero = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5, mezcla, alfa: 0 });
      let peor = 0;
      for (let i = 0; i < color.data.length; i++) peor = Math.max(peor, Math.abs(color.data[i] - cero.data[i]));
      assert(peor <= 2, mezcla + ": con alfa 0 difiere del filtro de color en " + peor + " niveles");
      const rel = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5 });
      const uno = reliefMap(cloneImage(img), 1.5, null, null, { escala: 0.5, mezcla, alfa: 1 });
      let peorL = 0;
      for (let i = 0; i < uno.data.length; i += 4) {
        const L = rgb2lab(uno.data[i], uno.data[i + 1], uno.data[i + 2])[0], Lr = rgb2lab(rel.data[i], rel.data[i], rel.data[i])[0];
        // Fuera de gama el color se recorta y la luz se corre algo: se mira la media
        peorL += Math.abs(L - Lr);
      }
      peorL /= uno.data.length / 4;
      assert(peorL < 2.5, mezcla + ": con alfa 1 la luminosidad se aparta del relieve en " + peorL.toFixed(2) + " de media");
    }
  });

  test("en el lote, las opciones congelan sus estadísticas y pasan por JSON sin cambiar nada", () => {
    const opts = { escala: 0.5, doble: 0.5, suave: true, clahe: true, mezcla: "lds", alfa: 0.5 };
    const store = {};
    reliefMap(syntheticImage(160, 120, 5), 1.5, null, store, opts);
    const f = store.frozen;
    assert(f && f.textura && f.objeto && typeof f.mid === "number" && f.sig > 0 && f.color && f.color.ev, "congeló: " + Object.keys(f || {}).join(","));
    const otra = syntheticImage(160, 120, 6);
    const conCongeladas = reliefMap(cloneImage(otra), 1.5, null, { frozen: f }, opts);
    const porJSON = reliefMap(cloneImage(otra), 1.5, null, { frozen: JSON.parse(JSON.stringify(f)) }, opts);
    const suelta = reliefMap(cloneImage(otra), 1.5, null, null, opts);
    assert(fnv1a(conCongeladas.data) === fnv1a(porJSON.data), "las estadísticas no sobrevivieron al JSON");
    assert(fnv1a(conCongeladas.data) !== fnv1a(suelta.data), "la foto del lote salió igual que suelta: no usó lo congelado");
  });
});

// ============================================================
// 12. Correspondencia entre el código fuente y el compilado
//
// Es la prueba que faltaba: en julio de 2026 se publicó un app.js que no
// correspondía a src/app.jsx (primero el compilado sin la fuente, después la
// fuente sin compilar), y el sitio quedó en blanco varios días.
// ============================================================

suite("Correspondencia src/app.jsx ↔ app.js", () => {
  test("app.js es exactamente el resultado de compilar src/app.jsx", () => {
    const Babel = require(path.join(ROOT, "lib", "babel.min.js"));
    const esperado = Babel.transform(source, { presets: ["react"], compact: false }).code;
    const actual = fs.readFileSync(path.join(ROOT, "app.js"), "utf8")
      .replace(/^﻿/, "")     // BOM que agregan algunos editores
      .replace(/\r\n/g, "\n");    // CRLF si git está con autocrlf

    if (esperado.trimEnd() !== actual.trimEnd()) {
      // Localizar la primera divergencia para que el mensaje sirva de algo
      const a = esperado.split("\n"), b = actual.split("\n");
      let linea = 0;
      while (linea < a.length && linea < b.length && a[linea] === b[linea]) linea++;
      throw new Error(
        "app.js no corresponde a src/app.jsx.\n" +
        "Primera diferencia en la línea " + (linea + 1) + ":\n" +
        "  esperado: " + JSON.stringify((a[linea] || "«fin de archivo»").slice(0, 120)) + "\n" +
        "  en disco: " + JSON.stringify((b[linea] || "«fin de archivo»").slice(0, 120)) + "\n" +
        "Correr `node build.js` y volver a commitear app.js."
      );
    }
  });

  test("app.js no contiene JSX sin compilar", () => {
    // El navegador carga app.js como script plano, sin Babel: cualquier JSX
    // que quede es un SyntaxError y la página se muestra en blanco.
    const compilado = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const jsx = compilado.match(/<\/[a-zA-Z][\w.]*>|<[a-zA-Z][\w.]*\s+[a-zA-Z-]+=\{/g);
    assert(!jsx, "quedaron " + (jsx ? jsx.length : 0) + " marcas de JSX en app.js " +
      "(primera: " + (jsx ? jsx[0] : "") + "). Correr `node build.js`.");
  });

  test("la versión coincide en todos los archivos que la declaran", () => {
    const leer = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
    const pkg = JSON.parse(leer("package.json"));
    const html = leer("index.html"), readme = leer("README.md"), cff = leer("CITATION.cff");
    const zenodo = JSON.parse(leer(".zenodo.json"));

    // Un bump de versión toca once lugares (la dirección de app.js en
    // index.html desde v3.7.3, la constante OPC_VERSION desde v3.8.0). En v3.6.0 se olvidaron dos del
    // README y nadie se enteró hasta revisarlo a mano: de ahí esta prueba.
    const donde = {
      "src/app.jsx (cabecera)":      (source.match(/OPC – OpuntiaColor v([\d.]+)/) || [])[1],
      "src/app.jsx (span del header)": (source.match(/fontFamily:mono }}>v([\d.]+)<\/span>/) || [])[1],
      "src/app.jsx (h3 de novedades)": (source.match(/OPC v([\d.]+) &mdash;/) || [])[1],
      "src/app.jsx (pie)":           (source.match(/&ndash; OpuntiaColor v([\d.]+) &middot;/) || [])[1],
      // Desde v3.8.0, la que se anota en el registro de cada exportación
      "src/app.jsx (OPC_VERSION)":   (source.match(/^const OPC_VERSION = "([\d.]+)";$/m) || [])[1],
      "index.html":                  (html.match(/OpuntiaColor v([\d.]+)/) || [])[1],
      // Desde v3.7.3: la versión en la dirección de app.js obliga al navegador
      // a bajar el programa nuevo; si queda vieja, se carga el app.js anterior
      "index.html (app.js?v=)":      (html.match(/src="app\.js\?v=([\d.]+)"/) || [])[1],
      "README.md (título)":          (readme.match(/^# OPC – OpuntiaColor v([\d.]+)/m) || [])[1],
      "README.md (cómo citar)":      (readme.match(/arte rupestre\* \(v([\d.]+)\)/) || [])[1],
      "CITATION.cff":                (cff.match(/^version: "([\d.]+)"/m) || [])[1],
      ".zenodo.json":                zenodo.version,
    };

    for (const [archivo, v] of Object.entries(donde)) {
      assert(v === pkg.version,
        archivo + " dice v" + v + " y package.json dice v" + pkg.version);
    }
  });
});

// ============================================================
// 13. Procesador de fondo (v3.7.2)
//
// Desde v3.7.2 los filtros corren en un Web Worker que carga el mismo app.js.
// Acá se carga app.js en contextos aislados que imitan los dos casos: como
// worker (sin React ni documento) y como página (con un Worker simulado), para
// comprobar que el camino por el worker devuelve los mismos bytes que llamar
// al filtro directamente, y que la cancelación y el plan B funcionan.
// ============================================================

const APP_JS = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");

function cargarApp(extra) {
  const ctx = {
    Math, Float64Array, Float32Array, Int32Array, Uint8ClampedArray, Uint8Array, Array, Number, Object, JSON,
    console, setTimeout, clearTimeout, ImageData, ...extra,
  };
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(APP_JS, ctx);
  return ctx;
}

// app.js como worker: lo que devuelve con postMessage queda en .salida
function cargarWorker() {
  const salida = [];
  const ctx = cargarApp({ postMessage: (m) => salida.push(m) });
  ctx.salida = salida;
  return ctx;
}

// app.js como página, con un Worker simulado que delega en cargarWorker().
// modo.falla: el constructor tira, como con index.html abierto como archivo.
// modo.cae: el worker arranca pero se cae al recibir el pedido.
function cargarPagina(modo) {
  const lanzados = [];
  class WorkerSimulado {
    constructor() {
      if (modo.falla) throw new Error("no se permite el worker (simulado)");
      this.vivo = true; this.w = cargarWorker(); lanzados.push(this);
    }
    postMessage(msg) {
      setTimeout(() => {
        if (!this.vivo) return;
        if (modo.cae) { if (this.onerror) this.onerror({ preventDefault() {} }); return; }
        Promise.resolve(this.w.self.onmessage({ data: msg })).then(() => {
          const r = this.w.salida.shift();
          if (this.vivo && this.onmessage) this.onmessage({ data: r });
        });
      }, 0);
    }
    terminate() { this.vivo = false; }
  }
  const ctx = cargarApp({
    document: { currentScript: { src: "app.js" }, getElementById: () => ({}) },
    React: { createElement: () => null },
    ReactDOM: { createRoot: () => ({ render() {} }) },
    Worker: WorkerSimulado,
  });
  ctx.lanzados = lanzados;
  return ctx;
}

// El filtro llamado directamente, sin worker de por medio. Con selección, el
// resultado se combina con la foto como lo hacía applyWithMask hasta v3.7.1:
// el filtro dentro de la zona, la foto afuera, alfa opaco en toda la imagen.
function directo(ctx, presetId, img, intensity, mask, frozen, opts) {
  const fn = vm.runInContext("(id) => PRESETS.find(p => p.id === id).fn", ctx)(presetId);
  const store = frozen ? { frozen } : {};
  const r = fn(cloneImage(img), intensity, mask, store, opts);
  let data = r.data;
  if (mask) {
    data = new Uint8ClampedArray(img.data);
    for (let i = 0; i < img.width * img.height; i++) {
      if (mask[i]) { data[i*4] = r.data[i*4]; data[i*4+1] = r.data[i*4+1]; data[i*4+2] = r.data[i*4+2]; }
      data[i*4+3] = 255;
    }
  }
  return { data, frozen: store.frozen || null };
}

function mismaSalida(a, b, msg) {
  assertBytesEqual(a.data, b.data, msg);
  assert(JSON.stringify(a.frozen) === JSON.stringify(b.frozen), msg + " — las estadísticas congeladas difieren");
}

function mascaraCentro(w, h) {
  const m = new Uint8Array(w * h);
  for (let y = h >> 2; y < (3 * h) >> 2; y++) for (let x = w >> 2; x < (3 * w) >> 2; x++) m[y * w + x] = 1;
  return m;
}

async function testAsync(name, fn) {
  current = name;
  try {
    await fn();
    passed++;
    console.log("  \x1b[32m✓\x1b[0m " + name);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log("  \x1b[31m✗\x1b[0m " + name);
    console.log("    \x1b[31m" + e.message.split("\n").join("\n    ") + "\x1b[0m");
  }
}

(async () => {
  console.log("\n\x1b[1mProcesador de fondo (v3.7.2)\x1b[0m");

  await testAsync("app.js cargado como worker no toca React ni el documento y queda escuchando", () => {
    const w = cargarWorker();
    assert(typeof w.self.onmessage === "function", "app.js como worker no instaló el receptor de pedidos");
  });

  await testAsync("el worker devuelve los mismos bytes que el filtro llamado directamente, en los doce filtros", async () => {
    const w = cargarWorker();
    const ids = vm.runInContext("PRESETS.map(p => p.id)", w);
    assert(ids.length === 12, "se esperaban 12 filtros y hay " + ids.length);
    const img = syntheticImage(40, 30, 4242);
    for (const id of ids) {
      for (const mask of [null, mascaraCentro(40, 30)]) {
        const opts = id === "relief" ? { escala: 0.25, doble: 0.5, suave: true, clahe: true, mezcla: "dslab", alfa: 0.5 } : null;
        const esperado = directo(w, id, img, 2.2, mask, null, opts);
        await w.self.onmessage({ data: { id: 7, presetId: id, data: new Uint8ClampedArray(img.data), w: 40, h: 30,
          intensity: 2.2, mask, frozen: null, opts } });
        const r = w.salida.pop();
        assert(r && r.id === 7 && !r.error, id + ": el worker no respondió bien (" + (r && r.error) + ")");
        mismaSalida(r, esperado, id + (mask ? " con máscara" : ""));
      }
    }
  });

  await testAsync("con estadísticas congeladas, el worker usa las de la referencia", async () => {
    const w = cargarWorker();
    const ref = syntheticImage(32, 24, 11), otra = syntheticImage(32, 24, 12);
    for (const id of ["red", "lds", "crgb", "dslab", "bichrome"]) {
      const { frozen } = directo(w, id, ref, 1.5, null, null, null);
      assert(frozen, id + ": la referencia no dejó estadísticas congeladas");
      const esperado = directo(w, id, otra, 1.5, null, frozen, null);
      await w.self.onmessage({ data: { id: 1, presetId: id, data: new Uint8ClampedArray(otra.data), w: 32, h: 24,
        intensity: 1.5, mask: null, frozen, opts: null } });
      mismaSalida(w.salida.pop(), esperado, id + " con lo congelado");
    }
  });

  await testAsync("un error dentro del filtro vuelve como mensaje y no tira abajo el worker", async () => {
    const w = cargarWorker();
    await w.self.onmessage({ data: { id: 3, presetId: "no-existe", data: new Uint8ClampedArray(16), w: 2, h: 2, intensity: 1 } });
    const r = w.salida.pop();
    assert(r && r.id === 3 && r.error, "el error no volvió como mensaje");
  });

  const pedido = (img, presetId, intensity, mask = null) => ({ presetId, origen: img.data, w: img.width, h: img.height,
    intensity, mask, frozen: null, opts: null });

  await testAsync("la página obtiene el mismo resultado por el worker que sin él", async () => {
    const img = syntheticImage(36, 28, 77);
    for (const modo of [{}, { falla: true }, { cae: true }]) {
      const pag = cargarPagina(modo);
      const proc = vm.runInContext("crearProcesador", pag)();
      const camino = modo.falla ? "sin worker" : modo.cae ? "con el worker caído" : "por el worker";
      for (const mask of [null, mascaraCentro(36, 28)]) {
        const r = await proc.correr(pedido(img, "red", 2.0, mask));
        mismaSalida(r, directo(pag, "red", img, 2.0, mask, null, null), camino + (mask ? " con selección" : ""));
      }
      if (!modo.falla && !modo.cae) assert(pag.lanzados.length >= 1, "no se usó el worker");
      // la imagen original no se toca: lo que viaja al worker es una copia
      assertBytesEqual(img.data, syntheticImage(36, 28, 77).data, "la imagen de origen cambió");
    }
  });

  await testAsync("un pedido nuevo cancela el anterior y termina su worker", async () => {
    const pag = cargarPagina({});
    const proc = vm.runInContext("crearProcesador", pag)();
    const CANCELADO = vm.runInContext("PROC_CANCELADO", pag);
    const img = syntheticImage(36, 28, 5);
    const primero = proc.correr(pedido(img, "red", 1.0));
    const segundo = proc.correr(pedido(img, "lds", 3.0));
    let motivo = null;
    try { await primero; } catch (e) { motivo = e; }
    assert(motivo === CANCELADO, "el primer pedido no se canceló (motivo: " + motivo + ")");
    assert(pag.lanzados[0].vivo === false, "el worker del pedido cancelado sigue vivo");
    mismaSalida(await segundo, directo(pag, "lds", img, 3.0, null, null, null), "el segundo pedido");
  });

  await testAsync("sin worker, un pedido cancelado tampoco llega a calcularse", async () => {
    const pag = cargarPagina({ falla: true });
    const proc = vm.runInContext("crearProcesador", pag)();
    const img = syntheticImage(20, 20, 9);
    const primero = proc.correr(pedido(img, "red", 1.0));
    proc.cancelar();
    let motivo = null;
    try { await primero; } catch (e) { motivo = e; }
    assert(motivo === vm.runInContext("PROC_CANCELADO", pag), "el pedido no se canceló");
  });

  console.log("\n\x1b[1mResolución de trabajo (v3.7.3)\x1b[0m");
  const app = cargarWorker();
  const tamano = vm.runInContext("tamanoTrabajo", app), opciones = vm.runInContext("opcionesResolucion", app);
  const esGrande = vm.runInContext("esFotoGrande", app);

  await testAsync("«Completa» y «2000 px» dan exactamente el mismo tamaño que hasta v3.7.2", () => {
    // computeSize de v3.7.2, copiado tal cual
    const viejo = (w, h, full) => { const mx = full ? 8192 : 2000; if (w > mx || h > mx) { const s = mx / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); } return { w, h }; };
    const rnd = lcg(31);
    for (let k = 0; k < 5000; k++) {
      const w = 50 + Math.floor(rnd() * 20000), h = 50 + Math.floor(rnd() * 20000);
      for (const [id, full] of [["full", true], ["2000", false]]) {
        const a = tamano(w, h, id), b = viejo(w, h, full);
        assert(a.w === b.w && a.h === b.h, id + " con " + w + "×" + h + ": " + a.w + "×" + a.h + " en vez de " + b.w + "×" + b.h);
      }
    }
  });

  await testAsync("las intermedias respetan sus megapíxeles, conservan la proporción y nunca agrandan", () => {
    const rnd = lcg(32);
    for (let k = 0; k < 5000; k++) {
      const w0 = 50 + Math.floor(rnd() * 20000), h0 = 50 + Math.floor(rnd() * 20000);
      for (const [id, mp] of [["16mp", 16], ["12mp", 12], ["8mp", 8]]) {
        const t = tamano(w0, h0, id), c = tamano(w0, h0, "full");
        assert(t.w <= c.w && t.h <= c.h, id + " agrandó " + w0 + "×" + h0);
        assert(t.w * t.h <= mp * 1e6 * 1.002, id + " con " + w0 + "×" + h0 + " da " + (t.w * t.h / 1e6).toFixed(2) + " MP");
        assert(Math.abs(t.w / t.h - c.w / c.h) <= (c.w / c.h) * 0.01 + 1 / t.h, id + " deformó " + w0 + "×" + h0);
      }
    }
  });

  await testAsync("con el panorama de 29 MP: 16 MP da 4619 × 3464 y 12 MP da 4000 × 3000", () => {
    const a = tamano(6222, 4666, "16mp"), b = tamano(6222, 4666, "12mp");
    assert(a.w === 4619 && a.h === 3464, "16 MP dio " + a.w + "×" + a.h);
    assert(b.w === 4000 && b.h === 3000, "12 MP dio " + b.w + "×" + b.h);
  });

  await testAsync("el cartel aparece desde los 16 MP, contando el tope de 8192 px", () => {
    assert(esGrande(6222, 4666), "29 MP no abrió el cartel");
    assert(esGrande(11090, 5872), "un panorama de 11090 × 5872 no abrió el cartel");
    assert(!esGrande(4608, 3456), "una foto de 15,9 MP abrió el cartel");
    assert(!esGrande(4032, 3024), "una foto de 12 MP abrió el cartel");
  });

  await testAsync("el menú solo ofrece escalones que achican: a una foto de 12 MP, ni «16 MP» ni «12 MP»", () => {
    const ids = opciones(4032, 3024).map(o => o.id);
    assert(ids.join(",") === "full,8mp,2000", "opciones para 12 MP: " + ids.join(", "));
    const chica = opciones(1800, 1200).map(o => o.id);
    assert(chica.length === 1 && chica[0] === "full", "a una foto de 1800 px se le ofrece " + chica.join(", "));
    const grande = opciones(6222, 4666).map(o => o.id);
    assert(grande.join(",") === "full,16mp,12mp,8mp,2000", "opciones para 29 MP: " + grande.join(", "));
  });

  // ============================================================
  // Registro de sesión (v3.8.0)
  //
  // Cada exportación lleva su registro adentro (PNG, JPG, TIFF) y al lado
  // (.json). Acá se prueba lo que no necesita navegador: las huellas, los
  // tres formatos de ida y vuelta, que las estadísticas congeladas pasen por
  // JSON sin perder un bit y los avisos de versión. La reproducción completa
  // —exportar y rehacer en el navegador— se verifica a mano en el panel.
  // ============================================================

  console.log("\n\x1b[1mRegistro de sesión (v3.8.0)\x1b[0m");
  const reg = cargarApp({ postMessage() {}, TextEncoder, TextDecoder });
  const R = (nombre) => vm.runInContext(nombre, reg);
  const nodeCrypto = require("crypto"), zlib = require("zlib");
  const sha = (b) => nodeCrypto.createHash("sha256").update(b).digest("hex");
  const txt = (s) => new Uint8Array(Buffer.from(s, "utf8"));
  // Igualdad profunda vía JSON con las claves ordenadas
  const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);

  await testAsync("SHA-256 da los vectores de FIPS 180-4 y lo mismo que el de Node, en todos los largos", () => {
    const sha256Hex = R("sha256Hex");
    assert(sha256Hex(txt("")) === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "cadena vacía");
    assert(sha256Hex(txt("abc")) === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "«abc»");
    assert(sha256Hex(txt("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")) === "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1", "mensaje de 448 bits");
    // Todos los largos de 0 a 300 bytes cubren los dos casos de relleno (uno o
    // dos bloques de cola), y uno de 1 MB recorre muchos bloques completos
    const rnd = lcg(808);
    for (let n = 0; n <= 300; n++) {
      const b = new Uint8Array(n); for (let i = 0; i < n; i++) b[i] = Math.floor(rnd() * 256);
      assert(sha256Hex(b) === sha(b), "largo " + n);
    }
    const grande = new Uint8Array(1 << 20); for (let i = 0; i < grande.length; i++) grande[i] = (i * 2654435761) >>> 24;
    assert(sha256Hex(grande) === sha(grande), "1 MB");
  });

  await testAsync("la huella de los píxeles es RGB fila por fila, sin el alfa", () => {
    const rgba = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 0, 7, 8, 9, 128]);
    assertBytesEqual(R("pixelesRGB")(rgba), new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), "pixelesRGB");
  });

  await testAsync("CRC-32 da el valor de control de ISO 3309", () => {
    assert(R("crc32")(txt("123456789")) === 0xCBF43926, "crc32(«123456789»)");
    if (zlib.crc32) { const b = txt("OpuntiaColor ñandú"); assert(R("crc32")(b) === zlib.crc32(b), "contra zlib"); }
  });

  // Un PNG mínimo pero real: 3 × 2 RGB, armado con zlib
  const chunkPNG = (tipo, datos) => {
    const td = Buffer.concat([Buffer.from(tipo, "latin1"), datos]);
    const out = Buffer.alloc(12 + datos.length);
    out.writeUInt32BE(datos.length, 0); td.copy(out, 4); out.writeUInt32BE(R("crc32")(td), 8 + datos.length);
    return out;
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(3, 0); ihdr.writeUInt32BE(2, 4); ihdr[8] = 8; ihdr[9] = 2;
  const filas = Buffer.from([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const PNG = new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunkPNG("IHDR", ihdr), chunkPNG("IDAT", zlib.deflateSync(filas)), chunkPNG("IEND", Buffer.alloc(0))]));
  const bloquesPNG = (u8) => {
    const b = Buffer.from(u8), out = [];
    for (let o = 8; o < b.length;) {
      const n = b.readUInt32BE(o), tipo = b.toString("latin1", o + 4, o + 8);
      const crcOk = b.readUInt32BE(o + 8 + n) === R("crc32")(b.subarray(o + 4, o + 8 + n));
      out.push({ tipo, datos: b.subarray(o + 8, o + 8 + n), crcOk });
      o += 12 + n;
    }
    return out;
  };

  // Un registro como el que arma la descarga, con caracteres no ASCII y una
  // selección a mano alzada larga para que el JPG necesite varios segmentos
  const registroDePrueba = (puntos) => R("armarRegistro")({
    version: "3.8.0", fecha: "2026-11-07T12:00:00.000Z",
    entrada: { archivo: "Peña_Sixtina ñandú.jpg", bytes: 123456, sha256: "ab".repeat(32), ancho: 6222, alto: 4666 },
    trabajo: { resolucion: "16mp", ancho: 4619, alto: 3464, sha256_pixeles: "cd".repeat(32) },
    pasos: [
      { presetId: "crgb", intensity: 1.8, opts: null, frozen: { mean: [1.5, 2.25, 3.125], ev: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], stds: [0.1, 0.2, 0.30000000000000004], clips: [{ lo: -1e-7, hi: 1 / 3 }] },
        sel: { type: "rect", x1: 0.25, y1: 0.75, x2: 0.125, y2: 0.5 } },
      { presetId: "relief", intensity: 2.2, opts: { escala: 0.25 }, frozen: { mid: 0.1, sig: 2 / 3 },
        sel: { type: "free", points: Array.from({ length: puntos }, (_, k) => ({ x: 0.5 + 0.4 * Math.cos(k / 50), y: 0.5 + 0.4 * Math.sin(k / 50) })) } },
    ],
    gotero: [{ r: 200, g: 120, b: 80, tol: 20, feather: 50, gain: 60 }, { r: 90, g: 140, b: 70, tol: 15, feather: 30, gain: -100 }],
    contraste: 10, saturacion: -5, metodoAjustes: "filtro_css",
    salida: { archivo: "Peña_Sixtina ñandú_OPC_relief_i2.2_e0.25.png", formato: "png", sha256_pixeles: "ef".repeat(32) },
  });

  await testAsync("el PNG con registro sigue siendo válido, con los mismos píxeles, y devuelve el registro", () => {
    const r = registroDePrueba(40), texto = JSON.stringify(r, null, 2);
    const out = R("pngConRegistro")(PNG, texto), bl = bloquesPNG(out);
    assert(bl.every(b => b.crcOk), "hay bloques con CRC inválido");
    assert(bl.map(b => b.tipo).join(",") === "IHDR,IDAT,iTXt,IEND", "orden de bloques: " + bl.map(b => b.tipo).join(","));
    assertBytesEqual(zlib.inflateSync(bl[1].datos), filas, "los píxeles del IDAT");
    const it = Buffer.from(bl[2].datos);
    assert(it.toString("latin1", 0, 13) === "OPC-registro\0", "clave del iTXt");
    assert(canon(R("leerRegistro")(out)) === canon(r), "el registro leído no es el escrito");
    assert(R("leerRegistro")(PNG) === null, "un PNG sin registro debería dar null");
  });

  // Un JPG falso pero con la estructura de segmentos real: SOI, APP1 (EXIF),
  // APP0 (JFIF), DQT, SOS con datos, EOI. Lo que se prueba es dónde van los
  // comentarios y que el resto quede intacto.
  const seg = (m, n) => { const b = new Uint8Array(4 + n); b[0] = 0xFF; b[1] = m; b[2] = (n + 2) >> 8; b[3] = (n + 2) & 0xFF; for (let i = 0; i < n; i++) b[4 + i] = (i * 7 + m) & 0x7F; return b; };
  const JPG = new Uint8Array(Buffer.concat([Buffer.from([0xFF, 0xD8]), seg(0xE1, 40), seg(0xE0, 14), seg(0xDB, 67),
    Buffer.from(seg(0xDA, 10)), Buffer.from([1, 2, 3, 0xFF, 0x00, 4, 5]), Buffer.from([0xFF, 0xD9])]));
  const segmentosJPG = (u8) => {
    const out = []; let o = 2;
    while (o < u8.length && u8[o] === 0xFF && u8[o + 1] !== 0xDA) { const n = (u8[o + 2] << 8) | u8[o + 3]; out.push({ m: u8[o + 1], n, o }); o += 2 + n; }
    out.push({ m: 0xDA, o }); return out;
  };

  await testAsync("el JPG con registro conserva sus segmentos y reparte un registro grande en varios comentarios", () => {
    for (const puntos of [40, 6000]) {
      const r = registroDePrueba(puntos), texto = JSON.stringify(r, null, 2);
      const out = R("jpegConRegistro")(JPG, texto), segs = segmentosJPG(out);
      const com = segs.filter(s => s.m === 0xFE), esperados = Math.ceil(Buffer.byteLength(texto) / 65000);
      assert(com.length === esperados, puntos + " puntos: " + com.length + " comentarios en vez de " + esperados);
      assert(com.every(s => s.n <= 65535), "un comentario pasa el máximo de 65 535 bytes");
      assert(segs.map(s => s.m.toString(16)).join(",") === ["e1", "e0", ...com.map(() => "fe"), "db", "da"].join(","), "orden de segmentos: " + segs.map(s => s.m.toString(16)).join(","));
      // Sacando los comentarios queda el JPG original, byte a byte
      const partes = []; let o = 0;
      for (const s of com) { partes.push(out.subarray(o, s.o)); o = s.o + 2 + s.n; }
      partes.push(out.subarray(o));
      assertBytesEqual(new Uint8Array(Buffer.concat(partes.map(p => Buffer.from(p)))), JPG, "el JPG sin los comentarios");
      assert(canon(R("leerRegistro")(out)) === canon(r), puntos + " puntos: el registro leído no es el escrito");
    }
    assert(R("leerRegistro")(JPG) === null, "un JPG sin registro debería dar null");
  });

  // El codificador TIFF de v3.1–v3.7.3, copiado tal cual (leía del canvas;
  // acá recibe los datos directamente)
  const tiffViejo = (imgData, w, h) => {
    const pixelBytes = w * h * 3, ifdOffset = 8, ifdEntries = 12, ifdSize = 2 + ifdEntries * 12 + 4;
    const bitsOffset = ifdOffset + ifdSize, xresOffset = bitsOffset + 8, yresOffset = xresOffset + 8, stripOffset = yresOffset + 8;
    const buf = new ArrayBuffer(stripOffset + pixelBytes), view = new DataView(buf), u8 = new Uint8Array(buf);
    view.setUint16(0, 0x4949, false); view.setUint16(2, 42, true); view.setUint32(4, ifdOffset, true);
    let off = ifdOffset; view.setUint16(off, ifdEntries, true); off += 2;
    const writeIFD = (tag, type, count, value) => { view.setUint16(off, tag, true); off += 2; view.setUint16(off, type, true); off += 2; view.setUint32(off, count, true); off += 4; view.setUint32(off, value, true); off += 4; };
    writeIFD(256, 3, 1, w); writeIFD(257, 3, 1, h); writeIFD(258, 3, 3, bitsOffset); writeIFD(259, 3, 1, 1); writeIFD(262, 3, 1, 2);
    writeIFD(273, 4, 1, stripOffset); writeIFD(277, 3, 1, 3); writeIFD(278, 4, 1, h); writeIFD(279, 4, 1, pixelBytes);
    writeIFD(282, 5, 1, xresOffset); writeIFD(283, 5, 1, yresOffset); writeIFD(296, 3, 1, 2);
    view.setUint32(off, 0, true);
    view.setUint16(bitsOffset, 8, true); view.setUint16(bitsOffset + 2, 8, true); view.setUint16(bitsOffset + 4, 8, true);
    view.setUint32(xresOffset, 72, true); view.setUint32(xresOffset + 4, 1, true); view.setUint32(yresOffset, 72, true); view.setUint32(yresOffset + 4, 1, true);
    let pOff = stripOffset;
    for (let i = 0; i < w * h; i++) { u8[pOff++] = imgData[i * 4]; u8[pOff++] = imgData[i * 4 + 1]; u8[pOff++] = imgData[i * 4 + 2]; }
    return u8;
  };

  await testAsync("TIFF: sin registro es el archivo de v3.7.3 byte a byte; con él agrega la etiqueta 270 y los mismos píxeles", () => {
    const img = syntheticImage(23, 17, 77), tiffRGB = R("tiffRGB");
    assertBytesEqual(tiffRGB(img.data, 23, 17, null), tiffViejo(img.data, 23, 17), "TIFF sin descripción");
    const r = registroDePrueba(40), out = tiffRGB(img.data, 23, 17, JSON.stringify(r, null, 2));
    const dv = new DataView(out.buffer, out.byteOffset, out.byteLength), cuenta = dv.getUint16(8, true), tags = [];
    let strip = 0;
    for (let i = 0; i < cuenta; i++) { const e = 10 + i * 12, t = dv.getUint16(e, true); tags.push(t); if (t === 273) strip = dv.getUint32(e + 8, true); }
    assert(tags.join(",") === "256,257,258,259,262,270,273,277,278,279,282,283,296", "etiquetas: " + tags.join(","));
    assertBytesEqual(out.subarray(strip), tiffViejo(img.data, 23, 17).subarray(8 + 2 + 12 * 12 + 4 + 24), "los píxeles");
    for (let i = 0; i < cuenta; i++) {
      const e = 10 + i * 12;
      if (dv.getUint16(e, true) !== 270) continue;
      const n = dv.getUint32(e + 4, true), o = dv.getUint32(e + 8, true);
      assert(out.subarray(o, o + n - 1).every(b => b >= 0x0A && b <= 0x7E) && out[o + n - 1] === 0, "la descripción no es ASCII terminado en cero");
    }
    const leido = R("leerRegistro")(out);
    assert(canon(leido) === canon(r), "el registro leído del TIFF no es el escrito");
    assert(leido.entrada.archivo === "Peña_Sixtina ñandú.jpg", "los acentos y la ñ no volvieron iguales: " + leido.entrada.archivo);
  });

  await testAsync("un .json suelto se lee con o sin BOM; lo que no es un registro de OPC da null", () => {
    const r = registroDePrueba(10), t = JSON.stringify(r, null, 2), leer = R("leerRegistro");
    assert(canon(leer(txt(t))) === canon(r), "JSON sin BOM");
    assert(canon(leer(new Uint8Array([0xEF, 0xBB, 0xBF, ...txt("\n  " + t)]))) === canon(r), "JSON con BOM y espacios");
    assert(leer(txt('{"hola": 1}')) === null, "un JSON cualquiera");
    assert(leer(txt("no es json")) === null, "texto");
  });

  await testAsync("el registro y su inversa reconstruyen el pipeline, la selección y el gotero", () => {
    const r = JSON.parse(JSON.stringify(registroDePrueba(40)));
    const pasos = R("pasosDesdeRegistro")(r), gotero = R("goteroDesdeRegistro")(r);
    assert(pasos.length === 2 && pasos[0].presetId === "crgb" && pasos[1].opts.escala === 0.25, "pasos");
    assert(pasos[0].intensity === 1.8 && pasos[1].intensity === 2.2, "intensidades");
    assert(canon(pasos[0].sel) === canon({ type: "rect", x1: 0.25, y1: 0.75, x2: 0.125, y2: 0.5 }), "selección rectangular");
    assert(pasos[1].sel.type === "free" && pasos[1].sel.points.length === 40 && pasos[1].sel.points[7].x === 0.5 + 0.4 * Math.cos(7 / 50), "selección a mano alzada");
    assert(pasos[0].frozen.stds[2] === 0.30000000000000004 && pasos[0].frozen.clips[0].hi === 1 / 3, "estadísticas, al último bit");
    assert(canon(gotero) === canon([{ r: 200, g: 120, b: 80, tol: 20, feather: 50, gain: 60 }, { r: 90, g: 140, b: 70, tol: 15, feather: 30, gain: -100 }]), "gotero");
    // La caja en píxeles se calcula a la resolución de trabajo, 4619 × 3464
    assert(r.pasos[0].seleccion.caja_px.join(",") === [577, 1732, 1155, 2598].join(","), "caja_px: " + r.pasos[0].seleccion.caja_px);
    assert(r.ajustes.metodo === "filtro_css" && r.ajustes.contraste === 10, "ajustes");
  });

  await testAsync("las estadísticas congeladas de los doce filtros pasan por JSON sin perder nada", () => {
    const w = cargarWorker(), ids = vm.runInContext("PRESETS.map(p => p.id)", w);
    const ref = syntheticImage(40, 30, 515), otra = syntheticImage(40, 30, 516);
    let conEstadisticas = 0;
    for (const id of ids) {
      const opts = id === "relief" ? { escala: 0.25 } : null;
      for (const mask of [null, mascaraCentro(40, 30)]) {
        const { frozen } = directo(w, id, ref, 2.2, mask, null, opts);
        if (!frozen) continue;
        conEstadisticas++;
        const viaJSON = JSON.parse(JSON.stringify(frozen));
        assert(JSON.stringify(viaJSON) === JSON.stringify(frozen), id + ": las estadísticas cambian al pasar por JSON");
        const a = directo(w, id, otra, 2.2, null, frozen, opts), b = directo(w, id, otra, 2.2, null, viaJSON, opts);
        assertBytesEqual(a.data, b.data, id + (mask ? " con máscara" : "") + ": con las estadísticas leídas del JSON");
      }
    }
    assert(conEstadisticas >= 18, "solo " + conEstadisticas + " casos dejaron estadísticas");
  });

  await testAsync("avisa los cambios de resultados entre versiones solo si tocan los filtros usados", () => {
    const entre = R("cambiosEntre"), cmp = R("compararVersiones"), v = (l) => l.map(c => c.version).join(",");
    assert(cmp("3.10.0", "3.9.9") === 1 && cmp("3.8", "3.8.0") === 0 && cmp("3.7.3", "3.8.0") === -1, "compararVersiones");
    assert(v(entre("3.8.0", "3.8.0", ["red"])) === "", "misma versión");
    assert(v(entre("3.2.1", "3.8.0", ["crgb"])) === "3.3.0", "CRGB desde 3.2.1");
    assert(v(entre("3.2.1", "3.8.0", ["lds", "petro"])) === "3.3.0,3.4.0,3.5.0", "LDS desde 3.2.1");
    assert(v(entre("3.6.0", "3.8.0", ["red"])) === "3.7.0", "Rojo desde 3.6.0");
    assert(v(entre("3.7.0", "3.8.0", ["red"])) === "", "3.7.0 ya tiene el Rojo nuevo");
    assert(v(entre("3.8.0", "3.6.0", ["red"])) === "3.7.0", "registro más nuevo que la aplicación");
    assert(v(entre("3.5.0", "3.8.0", ["petro", "relief", "clahe"])) === "", "la resolución por defecto (3.6.0) no avisa");
  });

  await testAsync("cada versión que el CHANGELOG marca como cambio de resultados está en la lista de avisos", () => {
    const cl = fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8").split(/\n(?=## v)/);
    const lista = R("cambiosDeResultados")().map(c => c.version);
    for (const sec of cl) {
      const m = sec.match(/^## v([\d.]+)/);
      if (!m || !/[Cc]ambia (los |el )?resultado/.test(sec)) continue;
      const ver = m[1].split(".").length === 2 ? m[1] + ".0" : m[1];
      if (R("compararVersiones")(ver, "3.3.0") < 0) continue;   // antes de v3.3 no hubo control de versiones de resultados
      assert(lista.includes(ver), "el CHANGELOG dice que v" + ver + " cambia resultados y no está en cambiosDeResultados()");
    }
  });

  await testAsync("el CSV del lote escapa comas, comillas y saltos de línea", () => {
    const csv = R("csvLote")([
      { archivo_entrada: "a,b.jpg", sha256_entrada: "x", estado: "ok" },
      { archivo_entrada: 'dijo "hola".jpg', estado: "error" },
      { archivo_entrada: "dos\nlíneas.jpg", ancho_original: 0 },
    ]);
    const lineas = csv.split("\r\n");
    assert(lineas[0] === "archivo_entrada,sha256_entrada,ancho_original,alto_original,ancho_trabajo,alto_trabajo,archivo_salida,sha256_pixeles_salida,sha256_salida,estado", "encabezado");
    assert(lineas[1] === '"a,b.jpg",x,,,,,,,,ok', "coma: " + lineas[1]);
    assert(lineas[2] === '"dijo ""hola"".jpg",,,,,,,,,error', "comillas: " + lineas[2]);
    assert(csv.includes('"dos\nlíneas.jpg",,0,'), "salto de línea y el cero");
    assert(csv.endsWith("\r\n"), "termina en salto de línea");
  });

  // Escala métrica (v3.8.0): dos puntos en fracción de la imagen y los mm
  // entre ellos. No toca el procesamiento; solo se registra.
  const calPrueba = { p1: { x: 0.1, y: 0.5 }, p2: { x: 0.6, y: 0.5 }, mm: 100 };

  await testAsync("la escala métrica da los píxeles por milímetro a cualquier resolución de trabajo", () => {
    const ppm = R("pxPorMM");
    // 0.5 del ancho: 2000 px a 4000 de ancho, 1000 px a 2000
    assert(ppm(calPrueba, 4000, 3000) === 20, "a 4000 px: " + ppm(calPrueba, 4000, 3000));
    assert(ppm(calPrueba, 2000, 1500) === 10, "a 2000 px");
    // En diagonal, con el ancho y el alto por separado
    const diag = { p1: { x: 0, y: 0 }, p2: { x: 0.3, y: 0.4 }, mm: 50 };
    assert(ppm(diag, 1000, 1000) === 10, "diagonal 3-4-5");
    assertClose(ppm(diag, 1000, 500), Math.hypot(300, 200) / 50, 1e-12, "diagonal con alto distinto");
    // Lo que no es una calibración da 0
    for (const mm of [0, -5, NaN, undefined]) assert(ppm({ ...calPrueba, mm }, 4000, 3000) === 0, "mm = " + mm);
    assert(ppm({ p1: { x: 0.2, y: 0.2 }, p2: { x: 0.2, y: 0.2 }, mm: 10 }, 4000, 3000) === 0, "mismo punto");
    assert(ppm(null, 4000, 3000) === 0 && ppm(calPrueba, 0, 0) === 0, "sin calibración o sin imagen");
  });

  await testAsync("la escala pasa por el registro y vuelve igual", () => {
    const e = R("escalaARegistro")(calPrueba, { ancho: 6222, alto: 4666 }, { ancho: 4619, alto: 3464 });
    // 0.5 × 6222 = 3111 px en 100 mm; a 4619 de ancho, 2309.5 px
    assert(e.distancia_mm === 100 && e.px_por_mm_original === 31.11 && e.px_por_mm_trabajo === 23.095, "px/mm: " + e.px_por_mm_original + " " + e.px_por_mm_trabajo);
    assert(e.mm_por_px_trabajo === Math.round(1e6 / 23.095) / 1e6, "mm/px: " + e.mm_por_px_trabajo);
    assert(canon(e.puntos_px_original) === canon([[622.2, 2333], [3733.2, 2333]]), "puntos en píxeles: " + JSON.stringify(e.puntos_px_original));
    // El registro completo la lleva; de vuelta, la calibración es la misma al último bit
    const r = JSON.parse(JSON.stringify(R("armarRegistro")({ version: "3.8.0", pasos: [], escala: e })));
    assert(canon(r.escala) === canon(e), "escala en el registro");
    assert(canon(R("escalaDesdeRegistro")(r.escala)) === canon(calPrueba), "ida y vuelta");
    // Sin calibrar, el campo queda en null; un registro sin escala no inventa una
    assert(R("armarRegistro")({ version: "3.8.0", pasos: [] }).escala === null, "sin escala, null");
    for (const malo of [null, {}, { puntos: [[0, 0]], distancia_mm: 10 }, { puntos: [[0, 0], [0.5, 0]], distancia_mm: 0 }, { puntos: [[0.3, 0.3], [0.3, 0.3]], distancia_mm: 10 }])
      assert(R("escalaDesdeRegistro")(malo) === null, "inválida: " + JSON.stringify(malo));
    assert(R("escalaARegistro")({ ...calPrueba, mm: 0 }, { ancho: 6222, alto: 4666 }, { ancho: 4619, alto: 3464 }) === null, "sin mm, no se registra");
  });

  await testAsync("los milímetros se escriben con coma o con punto", () => {
    const mm = R("leerMM");
    assert(mm("12,5") === 12.5 && mm("10") === 10 && mm(" 7.25 ") === 7.25 && mm(100) === 100, "válidos");
    for (const malo of ["", "abc", "-3", "0", null, undefined]) assert(mm(malo) === 0, "inválido: " + malo);
    const n = R("numCorto");
    assert(n(20) === "20.0" && n(123.4) === "123" && n(5.678) === "5.68" && n(0.0812) === "0.081", "cifras del panel");
  });

  await testAsync("la barra de escala elige el largo redondo más grande que entra, y lo rotula en mm, cm o m", () => {
    const lb = R("largoBarra"), et = R("etiquetaLargo");
    // 10 px de pantalla por mm y 160 px de lugar: entra 1 cm (100 px), no 2 cm (200 px)
    assert(canon(lb(10, 160)) === canon({ mm: 10, px: 100 }), "1 cm: " + JSON.stringify(lb(10, 160)));
    assert(lb(0.5, 160).mm === 200 && lb(0.5, 160).px === 100, "20 cm");
    assert(lb(40, 160).mm === 2, "2 mm");
    assert(lb(0, 160) === null && lb(5, 0) === null, "sin escala o sin lugar");
    const rotulos = [[5, "5 mm"], [0.5, "0.5 mm"], [10, "1 cm"], [20, "2 cm"], [500, "50 cm"], [1000, "1 m"], [2000, "2 m"]];
    for (const [mm, txt] of rotulos) assert(et(mm) === txt, mm + " → " + et(mm));
  });

  // Informe en PDF (v3.8.0): un escritor de PDF propio, sin bibliotecas.
  // Acá se prueba que el archivo esté bien armado; cómo se ve se revisó
  // aparte, abriéndolo con PyMuPDF y con pypdf en modo estricto.
  const logoBytes = new Uint8Array(Buffer.from(R("OPC_LOGO").split(",")[1], "base64"));
  const logo = { bytes: logoBytes, ...R("tamanoJPEG")(logoBytes) };
  // Revisa la estructura: cabecera, tabla xref exacta, flujos con su largo
  const revisarPDF = (pdf) => {
    const s = Buffer.from(pdf).toString("latin1");
    assert(s.startsWith("%PDF-1.4\n") && s.endsWith("%%EOF\n"), "cabecera o final");
    const sx = +s.match(/startxref\n(\d+)\n%%EOF\n$/)[1];
    assert(s.slice(sx).startsWith("xref\n0 "), "startxref no apunta a la tabla");
    const [, desde, cuantos] = s.slice(sx).match(/^xref\n(\d+) (\d+)\n/);
    const filas = s.slice(sx).split("\n").slice(2, 2 + +cuantos);
    filas.slice(1).forEach((f, k) => {
      assert(f.length === 19 && f.endsWith(" 00000 n "), "fila de xref mal formada: " + JSON.stringify(f));
      assert(s.slice(+f.slice(0, 10)).startsWith(`${k + 1} 0 obj\n`), `el objeto ${k + 1} no está donde dice la tabla`);
    });
    for (const m of s.matchAll(/\/Length (\d+) >>\nstream\n/g)) {
      const fin = m.index + m[0].length + +m[1];
      assert(s.slice(fin, fin + 11) === "\nendstream\n", "un flujo no mide lo que dice su /Length");
    }
    return s;
  };

  await testAsync("el PDF se escribe en WinAnsi: acentos en octal, paréntesis escapados y equivalentes para lo que falta", () => {
    const wa = R("aWinAnsi"), cad = R("cadenaPDF");
    assert(wa("ñá–—€¿").join(",") === [0xF1, 0xE1, 0x96, 0x97, 0x80, 0xBF].join(","), "Latin-1 y cp1252: " + wa("ñá–—€¿"));
    assert(String.fromCharCode(...wa("≈ → ✓")) === "~ -> ", "equivalentes: " + JSON.stringify(String.fromCharCode(...wa("≈ → ✓"))));
    assert(wa("漢").join() === "63", "lo que no existe va como ?");
    assert(cad("Peña (a\\b)") === "(Pe\\361a \\(a\\\\b\\))", "cadena: " + cad("Peña (a\\b)"));
    assert(R("textoInfoPDF")("Peña") === "<FEFF0050006500F10061>", "título en UTF-16: " + R("textoInfoPDF")("Peña"));
  });

  await testAsync("los anchos de Helvetica son los de Adobe y los renglones no se pasan del ancho", () => {
    assert(R("ANCHO_HELV").length === 95 && R("ANCHO_HELV_N").length === 95, "tablas de 95 signos");
    const at = R("anchoTexto");
    assertClose(at("Hola", "F1", 10), (722 + 556 + 222 + 556) / 100, 1e-9, "Helvetica");
    assertClose(at("Hola", "F2", 10), (722 + 611 + 278 + 556) / 100, 1e-9, "Helvetica-Bold");
    assert(at("abc", "F3", 10) === 18, "Courier: 600 por signo");
    assert(at("áÑ", "F1", 10) === at("aN", "F1", 10), "las acentuadas miden como su base");
    const texto = "La escala vale en el plano de la regla. Fuera de él, la perspectiva, el relieve de la roca y la distorsión del objetivo la vuelven aproximada.";
    const lineas = R("partirTexto")(texto, "F1", 9, 150);
    assert(lineas.length > 3 && lineas.every(l => at(l, "F1", 9) <= 150), "renglones de hasta 150 pt");
    assert(lineas.join(" ") === texto, "partir no pierde ni agrega nada");
    const huella = "ab".repeat(32), partes = R("partirTexto")(huella, "F3", 8, 100);
    assert(partes.length > 1 && partes.join("") === huella && partes.every(p => at(p, "F3", 8) <= 100), "una huella larga se corta");
  });

  await testAsync("el tamaño de un JPEG sale de su marcador SOF", () => {
    const b = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0, 4, 1, 2, 0xFF, 0xC4, 0, 3, 9, 0xFF, 0xC0, 0, 11, 8, 0x01, 0x23, 0x04, 0x56, 3, 1, 2, 3, 0xFF, 0xD9]);
    assert(canon(R("tamanoJPEG")(b)) === canon({ alto: 0x123, ancho: 0x456, canales: 3 }), "SOF0: " + JSON.stringify(R("tamanoJPEG")(b)));
    assert(R("tamanoJPEG")(new Uint8Array([0x89, 0x50, 0x4E, 0x47])) === null, "un PNG no es JPEG");
    assert(logo.ancho > 0 && logo.alto > 0 && logo.canales === 3, "el logo de OPC: " + JSON.stringify({ ancho: logo.ancho, alto: logo.alto, canales: logo.canales }));
  });

  await testAsync("el informe es un PDF bien armado, con las imágenes, la escala y las huellas", () => {
    const r = JSON.parse(JSON.stringify(registroDePrueba(40)));
    r.escala = R("escalaARegistro")(calPrueba, { ancho: 6222, alto: 4666 }, { ancho: 4619, alto: 3464 });
    r.salida.sha256 = "12".repeat(32);
    const pdf = R("informePDF")(r, { lang: "es", nombreFiltro: (id) => ({ crgb: "CRGB", relief: "Relieve" })[id], original: logo, resultado: logo, logo, fechaToma: "2024:05:14 10:22:31", hayGPS: true, fecha: new Date(2026, 10, 7, 12, 0) });
    const s = revisarPDF(pdf), cad = R("cadenaPDF");
    assert(/\/Type \/Pages \/Kids \[[^\]]+\] \/Count 1 >>/.test(s), "una sola página");
    assert((s.match(/\/Subtype \/Image /g) || []).length === 3, "logo, original y resultado");
    assert((s.match(/\/BaseFont \/(Helvetica|Helvetica-Bold|Courier|Times-Bold) \/Encoding \/WinAnsiEncoding/g) || []).length === 4, "las cuatro fuentes estándar");
    for (const t of ["Peña_Sixtina ñandú.jpg", "CRGB › Relieve", "ab".repeat(32), "cd".repeat(32), "ef".repeat(32), "12".repeat(32), "RGB 200, 120, 80", "1 mm = 23,1 px", "2024-05-14 10:22:31 (EXIF)", "Página 1 de 1", "https://doi.org/10.5281/zenodo.21796290"])
      assert(s.includes(cad(t).slice(1, -1)), "falta en el PDF: " + t);
    assert(!s.includes(cad("-65.").slice(1, -1)) && !/GPS.{0,40}\d+\.\d{4}/.test(s), "las coordenadas no se copian");
  });

  await testAsync("un informe largo sigue en otra página, con el pie en todas; en inglés cambian los textos", () => {
    const r = JSON.parse(JSON.stringify(registroDePrueba(40)));
    r.gotero = Array.from({ length: 45 }, () => r.gotero[0]);
    const cad = R("cadenaPDF");
    const s = revisarPDF(R("informePDF")(r, { lang: "es", original: null, resultado: null, logo: null }));
    assert(/\/Count 2 >>/.test(s), "dos páginas");
    assert(s.includes(cad("Página 1 de 2").slice(1, -1)) && s.includes(cad("Página 2 de 2").slice(1, -1)), "pie en las dos");
    assert(s.includes(cad("Gotero 45").slice(1, -1)), "llega hasta el último ajuste");
    const en = revisarPDF(R("informePDF")(r, { lang: "en" }));
    assert(en.includes(cad("Processing report").slice(1, -1)) && en.includes(cad("Eyedropper 45").slice(1, -1)) && !en.includes(cad("Gotero").slice(1, -1)), "en inglés");
  });

  // ============================================================
  // Modo elevación (v3.9.0)
  //
  // Un DEM inventado: 600 × 400 celdas de 0,5 mm, alturas en metros cerca de
  // 1200 m, con inclinación, curvatura y grano de ±0,1 mm; un surco de 2 mm de
  // hondo y 6,5 mm de ancho; un hueco (NaN) y una franja marcada con −32767.
  // Se escribe con el GeoTIFF de OPC y se lee con la geotiff.js de lib/, la
  // misma que usa la página.
  // ============================================================

  console.log("\n\x1b[1mModo elevación (v3.9.0)\x1b[0m");
  const demCtx = cargarApp({ postMessage() {}, TextEncoder, TextDecoder, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(path.join(ROOT, "lib", "geotiff.js"), "utf8"), demCtx);
  const D = (nombre) => vm.runInContext(nombre, demCtx);
  const GT = D("GeoTIFF");
  const DW = 600, DH = 400, CELDA = 0.0005;
  const alturasPrueba = () => {
    let s = 7; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    const z = new Float32Array(DW * DH);
    for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
      const u = x * CELDA, v = y * CELDA;
      let alt = 1200 + 0.08 * u - 0.05 * v + 0.6 * u * u + (rnd() - 0.5) * 0.0002;
      if (Math.abs(x - 300) <= 6) alt -= 0.002;
      if ((x - 100) ** 2 + (y - 100) ** 2 < 900) alt = NaN;
      if (y >= 380) alt = -32767;
      z[y * DW + x] = alt;
    }
    return z;
  };
  const GEO_PRUEBA = { ModelPixelScale: [CELDA, CELDA, 0], ModelTiepoint: [0, 0, 0, 350000, 6900000, 0],
    GeoKeyDirectory: [1, 1, 0, 4, 1024, 0, 1, 1, 1025, 0, 1, 1, 3072, 0, 1, 32719, 3076, 0, 1, 9001] };
  const buf = (u8) => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.length);
  const demPrueba = async (maxMP) => {
    const tif = D("geotiffFloat32")(alturasPrueba(), DW, DH, GEO_PRUEBA, -32767);
    return D("leerDEM")(GT, buf(tif), maxMP || 16, 8192);
  };

  await testAsync("las celdas sin dato son NaN, los centinelas de ±3.4e38 y el valor declarado", () => {
    const v = D("celdasValidas")(new Float32Array([1, NaN, -32767, 3.4e38, -3.4e38, 0, 1e5]), -32767);
    assert(Array.from(v).join("") === "1000011", "válidas: " + Array.from(v).join(""));
    assert(Array.from(D("celdasValidas")(new Float32Array([1, -32767]), null)).join("") === "11", "sin valor declarado, −32767 es un dato");
  });

  await testAsync("la tendencia se quita con huecos: una cuadrática exacta queda en cero y los huecos no se tocan", () => {
    const w = 41, h = 27, z = new Float32Array(w * h), valido = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, hueco = (x - 12) ** 2 + (y - 9) ** 2 < 30;
      z[i] = hueco ? NaN : 50 + 0.3 * x - 0.2 * y + 0.01 * x * x - 0.02 * x * y + 0.015 * y * y;
      valido[i] = hueco ? 0 : 1;
    }
    assert(D("quitarTendenciaValidas")(z, valido, w, h), "no ajustó");
    for (let i = 0; i < z.length; i++) {
      if (valido[i]) assert(Math.abs(z[i]) < 1e-4, "quedó " + z[i] + " en " + i);
      else assert(z[i] !== z[i], "tocó un hueco");
    }
  });

  await testAsync("el suavizado con huecos no mezcla el valor de «sin dato»", () => {
    const w = 60, h = 40, z = new Float32Array(w * h).fill(5), valido = new Uint8Array(w * h).fill(1);
    for (let i = 0; i < z.length; i++) if (i % 7 === 0 || (i % w) > 50) { z[i] = -32767; valido[i] = 0; }
    for (const r of [1, 4, 20]) {
      const s = D("suavizarConHuecos")(z, valido, w, h, r);
      // Donde no hay ningún dato al alcance da NaN; donde hay, exactamente 5
      for (let i = 0; i < s.length; i++) {
        if (valido[i]) assert(s[i] === s[i], `r=${r}: NaN en una celda con dato (${i})`);
        if (s[i] === s[i]) assert(Math.abs(s[i] - 5) < 1e-4, `r=${r}: ${s[i]} en ${i}`);
      }
    }
  });

  await testAsync("leerDEM lee el GeoTIFF: celda, unidades, sistema de coordenadas y «sin dato»", async () => {
    const dem = await demPrueba();
    assert(dem && dem.w === DW && dem.h === DH && !dem.reducido, "tamaño");
    assert(Math.abs(dem.pxmm - 0.5) < 1e-9 && dem.mmPorUnidad === 1000 && dem.unidad === "m" && !dem.supuesto && !dem.aproximado, "celda y unidades: " + JSON.stringify({ pxmm: dem.pxmm, k: dem.mmPorUnidad, u: dem.unidad }));
    assert(dem.nodata === -32767 && dem.epsg === 32719, "sin dato " + dem.nodata + ", EPSG " + dem.epsg);
    const esperado = 1 - (20 * DW + 2821) / (DW * DH);   // franja de 20 filas y hueco de radio 30 (2821 celdas)
    assert(Math.abs(dem.conDato - esperado) < 0.002, "celdas con dato: " + dem.conDato + ", esperado ~" + esperado.toFixed(4));
  });

  await testAsync("un DEM grande se lee reducido, sin mezclar «sin dato», y la celda crece en proporción", async () => {
    const dem = await demPrueba(0.06);   // 60 000 celdas de tope para 240 000
    assert(dem.reducido && dem.w === 300 && dem.h === 200, "tamaño reducido: " + dem.w + " × " + dem.h);
    assert(Math.abs(dem.pxmm - 1) < 1e-9 && Math.abs(dem.geo.ModelPixelScale[0] - 2 * CELDA) < 1e-12, "celda: " + dem.pxmm);
    let raros = 0;
    for (let i = 0; i < dem.z.length; i++) if (dem.valido[i] && (dem.z[i] < 1199 || dem.z[i] > 1201)) raros++;
    assert(raros === 0, raros + " celdas con alturas mezcladas con el «sin dato»");
  });

  await testAsync("leerDEM no toma por DEM un TIFF de color ni uno gris de 8 bits", async () => {
    const color = D("tiffRGB")(new Uint8ClampedArray(20 * 10 * 4).fill(100), 20, 10);
    assert(await D("leerDEM")(GT, buf(color), 16, 8192) === null, "TIFF de color");
    const gris = D("tiffConEtiquetas")(20, 10, 1, 8, 1, new Uint8Array(200).fill(50), []);
    assert(await D("leerDEM")(GT, buf(gris), 16, 8192) === null, "TIFF gris de 8 bits");
  });

  await testAsync("sin unidades declaradas se suponen metros; en grados, la celda en mm es aproximada", async () => {
    const z = new Float32Array(100).fill(10);
    const sinUnidad = { ModelPixelScale: [0.001, 0.001, 0], ModelTiepoint: [0, 0, 0, 0, 0, 0], GeoKeyDirectory: [1, 1, 0, 1, 1024, 0, 1, 1] };
    const a = await D("leerDEM")(GT, buf(D("geotiffFloat32")(z, 10, 10, sinUnidad, null)), 16, 8192);
    assert(a.supuesto && Math.abs(a.pxmm - 1) < 1e-9, "supuesto: " + JSON.stringify({ s: a.supuesto, p: a.pxmm }));
    // 1e-6 grados en latitud −27°: ~99,2 mm este-oeste y ~110,6 mm norte-sur
    const grados = { ModelPixelScale: [1e-6, 1e-6, 0], ModelTiepoint: [0, 0, 0, -67, -27, 0], GeoKeyDirectory: [1, 1, 0, 2, 1024, 0, 1, 2, 2048, 0, 1, 4326] };
    const b = await D("leerDEM")(GT, buf(D("geotiffFloat32")(z, 10, 10, grados, null)), 16, 8192);
    assert(b.aproximado && b.geografico && Math.abs(b.mmX - 99.19) < 0.05 && Math.abs(b.mmY - 110.57) < 0.05 && b.epsg === 4326, "grados: " + JSON.stringify({ x: b.mmX, y: b.mmY }));
  });

  await testAsync("el residuo mide el surco en mm, deja en cero lo lejano y marca los huecos", async () => {
    const dem = await demPrueba();
    D("quitarTendenciaValidas")(dem.z, dem.valido, dem.w, dem.h);
    const res = D("residuoDEM")(dem, dem.w, dem.h, { escala_mm: 2 });
    const en = (x, y) => res[y * DW + x];
    // El fondo abarca también parte del surco, así que el residuo es algo
    // menor que la profundidad real (2 mm): es un relieve local, no una cota
    assert(en(300, 200) < -1.4 && en(300, 200) > -2.05, "en el surco: " + en(300, 200).toFixed(3) + " mm");
    assert(Math.abs(en(500, 200)) < 0.05 && Math.abs(en(500, 50)) < 0.05, "lejos: " + en(500, 200).toFixed(3) + ", " + en(500, 50).toFixed(3));
    assert(en(100, 100) === -9999 && en(10, 390) === -9999, "huecos: " + en(100, 100) + ", " + en(10, 390));
    const doble = D("residuoDEM")(dem, dem.w, dem.h, { escala_mm: 2, doble: 0.5 });
    assert(doble[200 * DW + 300] < -1 && doble[100 * DW + 100] === -9999, "doble: " + doble[200 * DW + 300]);
  });

  await testAsync("la vista del DEM: gris, el surco oscuro, los huecos en negro y el centro congelado para el lote", async () => {
    const dem = await demPrueba();
    D("quitarTendenciaValidas")(dem.z, dem.valido, dem.w, dem.h);
    const store = {};
    const img = D("relieveDEM")(dem, DW, DH, 1.5, null, store, { escala_mm: 2 });
    const px = (x, y) => img.data[(y * DW + x) * 4];
    assert(px(300, 200) < 40 && Math.abs(px(500, 200) - 128) < 30, "surco " + px(300, 200) + ", lejos " + px(500, 200));
    assert(px(100, 100) === 0 && px(10, 390) === 0, "huecos en negro");
    assert(store.frozen && store.frozen.sig > 0, "congeló el centro y el desvío");
    const suave = D("relieveDEM")(dem, DW, DH, 1.5, null, null, { escala_mm: 2, suave: true, clahe: true, doble: 0.5 });
    assert(suave.data[(100 * DW + 100) * 4] === 0 || suave.data[(100 * DW + 100) * 4] < 20, "con opciones, el hueco sigue oscuro");
  });

  await testAsync("el residuo y la imagen georreferenciada vuelven a leerse con su lugar, su celda y su «sin dato»", async () => {
    const dem = await demPrueba();
    D("quitarTendenciaValidas")(dem.z, dem.valido, dem.w, dem.h);
    const res = D("residuoDEM")(dem, DW, DH, { escala_mm: 2 });
    const t = await GT.fromArrayBuffer(buf(D("geotiffFloat32")(res, DW, DH, dem.geo, -9999))), im = await t.getImage();
    const r = await im.readRasters({ interleave: true });
    let iguales = r.length === res.length;
    for (let i = 0; i < res.length && iguales; i++) if (r[i] !== res[i]) iguales = false;
    assert(iguales && r instanceof Float32Array, "los valores no volvieron iguales");
    assert(im.getGDALNoData() === -9999 && im.getOrigin().join() === "350000,6900000,0" && im.getResolution()[0] === CELDA, "georreferencia");
    assert(im.getGeoKeys().ProjectedCSTypeGeoKey === 32719 && im.getGeoKeys().ProjLinearUnitsGeoKey === 9001, "claves: " + JSON.stringify(im.getGeoKeys()));
    // La imagen georreferenciada lleva también el registro, que OPC sabe leer
    const rgba = new Uint8ClampedArray(DW * DH * 4).fill(90), texto = JSON.stringify({ formato: "OPC-registro", version_formato: 1, prueba: "ñandú" });
    const g = D("geotiffRGB")(rgba, DW, DH, dem.geo, texto);
    const tg = await GT.fromArrayBuffer(buf(g)), ig = await tg.getImage();
    assert(ig.getSamplesPerPixel() === 3 && ig.getGeoKeys().ProjectedCSTypeGeoKey === 32719, "RGB georreferenciado");
    assert(D("leerRegistro")(g).prueba === "ñandú", "el registro adentro del GeoTIFF");
  });

  await testAsync("la escala en mm se vuelve radio en celdas según la celda; las opciones y el nombre del archivo", () => {
    const rd = D("radioDEM");
    assert(rd(2, 0.5) === 2 && rd(2, 1) === 1 && rd(20, 0.5) === 20 && rd(1, 2) === 1, "radios");
    assert(JSON.stringify(D("opcionesRelieveDEM")(2, { doble: null, suave: false, clahe: false })) === '{"escala_mm":2}', "apagadas");
    assert(JSON.stringify(D("opcionesRelieveDEM")(5, { doble: 0.5, suave: true, clahe: true })) === '{"escala_mm":5,"doble":0.5,"suave":true,"clahe":true}', "prendidas");
    assert(D("sufijoRelieve")({ escala_mm: 2 }) === "_e2mm" && D("sufijoRelieve")({ escala_mm: 5, doble: 0.25, suave: true }) === "_e5mm_doble25_suave", "nombre");
    assert(D("sufijoRelieve")({ escala: 0.25 }) === "_e0.25", "con fotos, como siempre");
    const cg = D("clavesGeo")([1, 1, 0, 3, 1024, 0, 1, 1, 3072, 0, 1, 32719, 3076, 0, 1, 9001]);
    assert(cg[1024] === 1 && cg[3072] === 32719 && cg[3076] === 9001, "claves: " + JSON.stringify(cg));
  });

  await testAsync("las escalas se adaptan a la celda: mm para un panel, cm y m para un vuelo de dron", () => {
    const e = (pxmm) => D("escalasDEM")(pxmm).join(",");
    assert(e(0.5) === "1,2,5,10,20", "panel de 0,5 mm: " + e(0.5));
    assert(e(80.2) === "200,500,1000,2000,5000", "dron de 8 cm: " + e(80.2));
    assert(e(518) === "2000,5000,10000,20000,50000", "celda de 52 cm: " + e(518));
    assert(e(1e7) === "5000,10000,20000,50000,100000", "celdas enormes: las últimas cinco");
    assert(e(0.01) === "1,2,5,10,20", "celdas diminutas: desde 1 mm");
    // La menor siempre abarca al menos dos celdas: radio de una celda o más
    for (const px of [0.3, 0.5, 2.7, 80.2, 518]) assert(D("radioDEM")(D("escalasDEM")(px)[0], px) >= 1, "radio con celda " + px);
  });

  await testAsync("el worker hace el Relieve sobre el DEM igual que la página", async () => {
    const dem = await demPrueba(0.06);
    D("quitarTendenciaValidas")(dem.z, dem.valido, dem.w, dem.h);
    const w = cargarWorker(), opts = { escala_mm: 2, doble: 0.5, suave: true };
    const esperado = D("relieveDEM")({ z: dem.z, valido: dem.valido, pxmm: dem.pxmm }, dem.w, dem.h, 1.8, null, {}, opts);
    const origen = new Uint8ClampedArray(dem.w * dem.h * 4).fill(77);
    await w.self.onmessage({ data: { id: 9, presetId: "relief", data: origen, w: dem.w, h: dem.h, intensity: 1.8, mask: null, frozen: null, opts,
      dem: { z: dem.z, valido: dem.valido, pxmm: dem.pxmm } } });
    const r = w.salida.pop();
    assert(r && r.id === 9 && !r.error, "el worker no respondió bien (" + (r && r.error) + ")");
    assert(fnv1a(r.data) === fnv1a(esperado.data), "el worker dio otro resultado");
  });

  // Con +JSON o +PDF, la imagen y lo demás bajan juntos en una carpeta. Si el
  // navegador no deja elegir dónde, en un .zip que la trae adentro.
  await testAsync("el .zip guarda los archivos tal cual, adentro de su carpeta, con nombres en UTF-8", () => {
    const te = new TextEncoder(), td = new TextDecoder();
    const a = te.encode('{"hola": 1}'), b = new Uint8Array(70000).map((_, i) => (i * 31) & 255);
    const dir = "Peña_OPC_crgb_i1.5";
    const zip = R("zipSinComprimir")([{ nombre: `${dir}/${dir}.png`, bytes: b }, { nombre: `${dir}/${dir}.json`, bytes: a }], new Date(2026, 10, 7, 21, 30, 10));
    const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength), fin = zip.length - 22;
    assert(dv.getUint32(fin, true) === 0x06054B50, "fin del directorio central");
    const n = dv.getUint16(fin + 10, true), tam = dv.getUint32(fin + 12, true), ini = dv.getUint32(fin + 16, true);
    assert(n === 3 && ini + tam === fin, "tres entradas (la carpeta y los dos archivos) y el directorio en su lugar");
    const leidas = [];
    for (let p = ini, k = 0; k < n; k++) {
      assert(dv.getUint32(p, true) === 0x02014B50, "firma del directorio central");
      const flags = dv.getUint16(p + 8, true), metodo = dv.getUint16(p + 10, true), crc = dv.getUint32(p + 16, true);
      const largo = dv.getUint32(p + 24, true), ln = dv.getUint16(p + 28, true), atrib = dv.getUint32(p + 38, true), off = dv.getUint32(p + 42, true);
      const nombre = td.decode(zip.subarray(p + 46, p + 46 + ln));
      assert((flags & 0x0800) && metodo === 0, "UTF-8 y sin comprimir: " + nombre);
      assert(dv.getUint32(off, true) === 0x04034B50 && td.decode(zip.subarray(off + 30, off + 30 + ln)) === nombre, "encabezado local de " + nombre);
      const datos = zip.subarray(off + 30 + ln, off + 30 + ln + largo);
      if (nombre.endsWith("/")) assert(largo === 0 && atrib === 0x10, "la carpeta");
      else assert(crc === zlib.crc32(datos), "CRC-32 de " + nombre);
      leidas.push([nombre, datos]);
      p += 46 + ln;
    }
    assert(leidas[0][0] === dir + "/", "la carpeta va primero: " + leidas[0][0]);
    assertBytesEqual(leidas[1][1], b, "la imagen, byte a byte");
    assertBytesEqual(leidas[2][1], a, "el .json, byte a byte");
    assert(dv.getUint16(10, true) === ((21 << 11) | (30 << 5) | 5) && dv.getUint16(12, true) === (((2026 - 1980) << 9) | (11 << 5) | 7), "fecha y hora en formato DOS");
  });

  console.log(
    "\n" + (failed === 0 ? "\x1b[32m" : "\x1b[31m") +
    passed + " prueba(s) OK, " + failed + " fallida(s)\x1b[0m\n"
  );
  if (failed > 0) {
    console.log("Fallaron:");
    for (const f of failures) console.log("  · " + f.name);
    console.log("");
  }
  process.exit(failed === 0 ? 0 : 1);
})();
