# Pruebas

```bash
node tests/run-tests.js
```

Sin dependencias, sin `npm install` y sin imágenes de entrada: los casos son
sintéticos y deterministas. Requiere Node.js ≥ 16. Devuelve código de salida 0 si
todo pasa, 1 si algo falla.

## Cómo están armadas

Las funciones **no se copian**: `run-tests.js` lee `src/app.jsx`, extrae por
nombre las funciones puras del núcleo de procesamiento y las evalúa en un
contexto aislado (`vm`) con un `ImageData` mínimo, porque en Node no existe.

Esto tiene una consecuencia importante: las pruebas corren siempre contra **el
código que se publica**, no contra una copia que puede quedar desactualizada.

## Qué se verifica

| Sección | Qué comprueba |
|---|---|
| **Conversiones de color** | Valores de referencia sRGB/D65 para blanco, negro, gris 128 y rojo primario; ida y vuelta RGB↔LAB y RGB↔YCbCr sobre 4000 colores, con tolerancia de 1 nivel de 255 |
| **Eigendescomposición** | Eigenvalores contra soluciones de forma cerrada y contra la solución analítica del polinomio característico en 500 covarianzas al azar; conservación de la traza; `A·v = λ·v`; ortonormalidad de los eigenvectores; orden descendente por varianza |
| **Máscara de selección** | Que las estadísticas sobre la máscara coincidan con calcularlas solo sobre esos píxeles; que una máscara vacía caiga de vuelta a la imagen completa; que la selección efectivamente cambie el resultado del filtro |
| **Imagen integral** | Que `satMean` coincida con el promedio calculado a mano en varias ventanas |
| **Determinismo** | Que CRGB, DS-LAB y LDS den bytes idénticos con la misma entrada; alfa opaco; que el ajuste posterior neutro no toque los píxeles y que saturación −100 deje escala de grises exacta |
| **Lote** | Que la referencia congele las estadísticas y el resto del lote las reutilice sin recalcular; que la matriz de decorrelación no cambie a lo largo del lote; que una foto en el lote salga distinta que suelta; que la referencia salga igual dentro y fuera del lote |
| **Problemas conocidos** | Fija el comportamiento de [LIMITACIONES §3](../docs/LIMITACIONES.md#3-la-intensidad-no-tiene-efecto-en-lds) (la intensidad no afecta a LDS) para que no pase inadvertido |
| **Correspondencia fuente ↔ compilado** | Que `app.js` sea exactamente el resultado de compilar `src/app.jsx`; que no quede JSX sin compilar en `app.js`; que la versión coincida en `src/app.jsx`, `index.html` y `package.json` |

## La prueba de la eigendescomposición

Es la que motivó todo esto. Hasta v3.2.1 la rotación de Jacobi perdía la simetría
de la matriz durante la iteración y convergía a eigenvalores incorrectos. Con una
covarianza típica de fotografía de panel:

```
                    λ₁          λ₂          λ₃
  correcto     1891.7004     27.5642      4.8354
  hasta v3.2.1 1794.5754    133.8812      0.0000     ← λ₂ 5× sobrevaluada,
                                                        λ₃ colapsada
```

Ni siquiera se conservaba la traza. El error caía justo sobre las componentes de
baja varianza que el decorrelation stretch busca amplificar, así que afectaba a
CRGB, DS-LAB y LDS.

La referencia contra la que se compara es la solución analítica del polinomio
característico (método trigonométrico de Viète), que **no comparte ni una línea**
con la rotación de Jacobi: si las dos coinciden hasta 1 × 10⁻⁹ en 500 matrices al
azar, es porque ambas están bien. Coincide además con `numpy.linalg.eigh` hasta
la precisión de máquina.

## La prueba de correspondencia

Es la otra que faltaba. En julio de 2026 se publicó un `app.js` que no
correspondía a `src/app.jsx`: primero el compilado sin la fuente, después la
fuente sin compilar. Como `index.html` carga `app.js` como script plano y sin
Babel, el JSX sin compilar es un `SyntaxError` y la página quedó **en blanco
durante una semana**, sin ningún mensaje visible.

La prueba recompila `src/app.jsx` con el Babel de `lib/` y lo compara con el
`app.js` del disco, informando la primera línea que difiere. Normaliza saltos de
línea y BOM, así que no se rompe según cómo esté configurado `core.autocrlf` en
git.

**Conviene correrla antes de cada commit que toque `src/app.jsx`.**

## Agregar una prueba

```js
suite("Nombre de la sección", () => {
  test("qué debería pasar", () => {
    assert(condición, "mensaje si falla");
    assertClose(obtenido, esperado, tolerancia, "qué se estaba midiendo");
    assertBytesEqual(bufferA, bufferB, "qué debería ser idéntico");
  });
});
```

Para probar una función del núcleo que todavía no esté disponible, agregarla al
array `CORE` en la cabecera del archivo. Tiene que estar declarada como
`function nombre(...)` en el nivel superior de `src/app.jsx`, con la llave de
cierre en la columna 0.

Las imágenes de prueba se generan con `syntheticImage(w, h, semilla)`, que usa un
generador congruencial lineal —nunca `Math.random()`— para que los casos sean
reproducibles.
