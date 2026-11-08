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
| **Conversiones de color** | Valores de referencia sRGB/D65 para blanco, negro, gris 128 y rojo primario; ida y vuelta RGB↔LAB y RGB↔YCbCr sobre 4000 colores, con tolerancia de 1 nivel de 255; que la tabla sRGB→lineal de `rgb2lab` (v3.7.1) dé al último bit lo mismo que la fórmula directa en los 16,7 millones de colores |
| **Eigendescomposición** | Eigenvalores contra soluciones de forma cerrada y contra la solución analítica del polinomio característico en 500 covarianzas al azar; conservación de la traza; `A·v = λ·v`; ortonormalidad de los eigenvectores; orden descendente por varianza |
| **Máscara de selección** | Que las estadísticas sobre la máscara coincidan con calcularlas solo sobre esos píxeles; que una máscara vacía caiga de vuelta a la imagen completa; que la selección efectivamente cambie el resultado del filtro |
| **Imagen integral** | Que `satMean` coincida con el promedio calculado a mano en varias ventanas |
| **Determinismo** | Que CRGB, DS-LAB y LDS den bytes idénticos con la misma entrada; alfa opaco; que el ajuste posterior neutro no toque los píxeles y que saturación −100 deje escala de grises exacta |
| **Lote** | Que la referencia congele las estadísticas y el resto del lote las reutilice sin recalcular; que la matriz de decorrelación no cambie a lo largo del lote; que una foto en el lote salga distinta que suelta; que la referencia salga igual dentro y fuera del lote |
| **Intensidad de LDS** | Que el control tenga efecto (regresión del problema de v3.3.0); que el valor por defecto reproduzca el checksum exacto de la salida de v3.3.0; que bajar la intensidad decorrele menos; que el exponente topee en γ = 2; que el lote respete la intensidad sin descongelar estadísticas |
| **Rojo adaptativo** | Que separe el ocre de una arenisca ferruginosa sintética; que lleve el color de la roca a gris con tres dominantes distintas; que la tarjeta de color no cambie la roca; que no toque L*; que use la selección y el congelado del lote; checksum de la salida por defecto de v3.7.0 |
| **Resolución de trabajo** (v3.7.3) | Que completa y 2000 px den exactamente el mismo tamaño que hasta v3.7.2 (5000 tamaños al azar); que 16, 12 y 8 MP respeten sus megapíxeles, conserven la proporción y nunca agranden; los tamaños concretos del panorama de 29 MP; desde cuándo aparece el cartel; que el menú solo ofrezca escalones que achiquen al menos un 10 % |
| **Procesador de fondo** (v3.7.2) | Que `app.js` cargado como worker no toque React ni el documento; que el worker devuelva los mismos bytes que el filtro llamado directamente, en los doce filtros, con y sin selección y con estadísticas congeladas; que un error vuelva como mensaje; que la página dé lo mismo por el worker, sin él y con el worker caído; que un pedido nuevo cancele el anterior y termine su worker |
| **Relieve por escala** | Que en Bordes reproduzca byte a byte el mapa de v3.6.0; `boxBlur` contra fuerza bruta; que `quitarTendencia` anule una cuadrática exacta; que un gradiente de iluminación no cambie el resultado ni junto a los bordes; que más escala despegue mejor un motivo del grano; que la escala sea relativa a la resolución; el congelado del lote; checksum con escala |
| **Relieve: opciones** (v3.8.0) | Que con las opciones apagadas dé los checksums de v3.7 en diez combinaciones de escala, intensidad y zona; qué opciones viajan y el nombre del archivo; que el Relieve doble con peso 0 sea la textura y con 1 el objeto; que la compresión suave no queme los extremos ni cambie el centro; que CLAHE deje el resultado gris; los extremos de la mezcla con color; las estadísticas congeladas del lote a través de JSON |
| **Modo elevación** (v3.9.0) | Con un DEM inventado (600 × 400 celdas de 0,5 mm, surco de 2 mm, hueco y franja sin dato) escrito por OPC y leído con la geotiff.js de `lib/`: celdas sin dato; tendencia con huecos; suavizado con huecos sin mezclar el «sin dato»; lectura de celda, unidades, EPSG y «sin dato»; lectura reducida; que un TIFF de color o gris de 8 bits no se tome por DEM; unidades supuestas y grados; residuo del surco en mm; la vista; ida y vuelta de los dos GeoTIFF con su georreferencia y el registro adentro; las escalas adaptadas a la celda; el worker |
| **Modo multi-luz** (v4.0.0) | Con una serie inventada de 160 × 112 px (un surco en anillo, un bulto, pintura sin relieve, ocho luces, una esfera espejada y una foto sin luz): la luz desde el brillo en la esfera (casos exactos y la serie); el estéreo fotométrico (normales, albedo sin la sombra del surco); igualar las potencias; descartar un brillo de una sola foto; la integración de las pendientes; la serie completa (alturas sin la esfera, Relieve con el surco oscuro y sin la pintura, promedio con menos de tres luces); el promedio que no depende de la potencia de cada luz; el registro; el nombre de la serie; el worker |
| **Registro de sesión** (v3.8.0) | SHA-256 contra los vectores de FIPS 180-4 y contra el de Node en todos los largos de 0 a 300 bytes y en 1 MB; CRC-32 de ISO 3309; que el PNG con registro tenga bloques válidos, los mismos píxeles y devuelva el registro; que el JPG conserve sus segmentos y reparta un registro grande en varios comentarios; que el TIFF sin registro sea el de v3.7.3 byte a byte y con él agregue la etiqueta 270; ida y vuelta del pipeline, la selección y el gotero; que las estadísticas de los doce filtros pasen por JSON sin perder un bit; los avisos de cambio de versión, y que cada versión que el CHANGELOG marca como cambio de resultados esté en la lista; el CSV del lote; la escala métrica: píxeles por milímetro a distintas resoluciones y en diagonal, su ida y vuelta por el registro, los milímetros escritos con coma o con punto, y el largo y el rótulo de la barra de escala; el informe en PDF: la codificación de los textos, los anchos de letra y el corte de renglones, el tamaño de un JPEG, y la estructura del archivo (tabla de objetos exacta, flujos con su largo) en uno de una página y en uno de dos, en castellano y en inglés; el `.zip` de la descarga: cada archivo adentro de su carpeta, byte a byte, con su CRC-32 y el nombre en UTF-8 |
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
