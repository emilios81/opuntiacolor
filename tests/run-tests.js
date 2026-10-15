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
  "enhanceRedPigment", "reliefMap", "reliefEscala", "quitarTendencia", "boxBlur",
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
const CONSTANTES = ["SRGB_LINEAL", "LDS_TUKEY_K", "RED_SIGMA", "RED_PISO", "RED_ENFASIS", "RELIEF_ESCALAS", "RELIEF_FONDO"].map(nombre => {
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

    // Un bump de versión toca ocho lugares. En v3.6.0 se olvidaron dos del
    // README y nadie se enteró hasta revisarlo a mano: de ahí esta prueba.
    const donde = {
      "src/app.jsx (cabecera)":      (source.match(/OPC – OpuntiaColor v([\d.]+)/) || [])[1],
      "src/app.jsx (span del header)": (source.match(/fontFamily:mono }}>v([\d.]+)<\/span>/) || [])[1],
      "src/app.jsx (h3 de novedades)": (source.match(/OPC v([\d.]+) &mdash;/) || [])[1],
      "src/app.jsx (pie)":           (source.match(/&ndash; OpuntiaColor v([\d.]+) &middot;/) || [])[1],
      "index.html":                  (html.match(/OpuntiaColor v([\d.]+)/) || [])[1],
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
        const opts = id === "relief" ? { escala: 0.25 } : null;
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
