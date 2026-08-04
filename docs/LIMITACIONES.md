# Limitaciones conocidas

Qué puede y qué no puede afirmarse a partir de una imagen procesada con OPC, y
qué problemas tiene la herramienta que todavía no están resueltos.

Este documento existe porque una imagen realzada es muy persuasiva y muy fácil de
sobreinterpretar. Las limitaciones están acá sin adornos, incluidas las que
todavía no se corrigieron.

---

## Índice

**Metodológicas**
1. [El realce no descubre: redistribuye](#1-el-realce-no-descubre-redistribuye)
2. [El mapa de pigmentos no identifica pigmentos](#2-el-mapa-de-pigmentos-no-identifica-pigmentos)

**Técnicas sin resolver**
3. [La intensidad no tiene efecto en LDS](#3-la-intensidad-no-tiene-efecto-en-lds)
4. [Profundidad de 8 bits](#4-profundidad-de-8-bits)
5. [Sin gestión de color](#5-sin-gestión-de-color)
6. [RAW no está soportado](#6-raw-no-está-soportado)
7. [La resolución de trabajo cambia el resultado](#7-la-resolución-de-trabajo-cambia-el-resultado)
8. [Sin calibración fotométrica](#8-sin-calibración-fotométrica)

**De reproducibilidad**
9. [Lo que no queda registrado](#9-lo-que-no-queda-registrado)
10. [Cambios de versión que cambian resultados](#10-cambios-de-versión-que-cambian-resultados)

---

# Metodológicas

## 1. El realce no descubre: redistribuye

Es la limitación de fondo, y de la que se derivan casi todas las demás.

Ninguno de estos filtros agrega información. Todos toman la que ya está en el
archivo y la redistribuyen sobre el rango visible: lo que estaba comprimido en
tres niveles pasa a ocupar doscientos. Si una diferencia no quedó registrada en
la fotografía —porque el pigmento se perdió, porque la exposición la recortó,
porque la compresión JPEG la borró— **ningún filtro la va a recuperar.**

De ahí se sigue algo incómodo: el realce amplifica con la misma eficiencia el
pigmento y el ruido. Los bloques de 8 × 8 de la compresión JPEG, el grano del
sensor a ISO alto, el patrón de la textura de la roca y las manchas de liquen
reciben exactamente el mismo tratamiento que la pintura. Un decorrelation stretch
agresivo sobre un JPEG muy comprimido produce estructuras regulares muy vistosas
que son, literalmente, el algoritmo de compresión.

**En la práctica:**

- Un motivo que aparece con un filtro y no con otro es una **hipótesis**, no una
  observación. Contrastarlo con varios filtros y, si es posible, con otra
  fotografía tomada en distintas condiciones de luz.
- Publicar **siempre la imagen original junto a la realzada.** El lector tiene que
  poder ver de dónde salió lo que se afirma.
- Desconfiar de los rasgos que aparecen solo con intensidad alta, solo en modo
  Acumular, o solo en una toma.
- No calcar sobre la imagen realzada sin verificar en la original o en el panel.

## 2. El mapa de pigmentos no identifica pigmentos

El filtro **Mapa de pigmentos** clasifica los píxeles por umbrales fijos en CIE-LAB
(a* > 8 y croma > 12 → "rojo", y así). No hay ningún análisis de composición
detrás: es una segmentación por color con umbrales elegidos a ojo.

Concretamente, el filtro **no distingue**:

- hematita de óxido de hierro natural de la roca,
- carbón de manganeso de una mancha de humedad,
- pigmento blanco de una eflorescencia salina o de guano,
- pintura de liquen de color similar.

Los umbrales son absolutos y no se adaptan a la iluminación, al balance de
blancos de la cámara ni al tipo de roca. La misma pintura fotografiada al sol y
a la sombra puede caer en dos categorías distintas.

**Es una herramienta exploratoria: sirve para separar visualmente zonas y
orientar dónde mirar. No sustituye ningún análisis.** Determinar composición
requiere métodos analíticos —FRX portátil, Raman, espectroscopía— y las
categorías de este filtro no deberían aparecer en una publicación como
identificación de materiales.

---

# Técnicas sin resolver

## 3. La intensidad no tiene efecto en LDS

**Estado: sin resolver.** Afecta únicamente al filtro LDS.

El control de intensidad no cambia absolutamente nada en LDS: la salida es
idéntica byte a byte con intensidad 0.2 y con 5.0.

**Por qué.** LDS amplifica las componentes principales por
`boost = 2 × intensidad` y después reproyecta y normaliza cada canal por su
mínimo y máximo. Escribiendo la salida antes de normalizar como
`s = media + boost · f`, el mínimo y el máximo son `media + boost · min(f)` y
`media + boost · max(f)`, de modo que

```
      s − mín        boost · (f − mín f)        f − mín f
    ───────────  =  ──────────────────────  =  ───────────
      máx − mín     boost · (máx f − mín f)    máx f − mín f
```

El factor se cancela exactamente. No es un error de redondeo: es una
identidad algebraica.

**Por qué no está corregido.** Arreglarlo exige decidir primero *qué debería
controlar* ese parámetro en un filtro cuyo propósito es reproyectar al espacio
original y conservar un aspecto natural. Las opciones razonables —interpolar
entre la imagen original y la decorrelada, amplificar cada componente por un
exponente distinto, o recortar por percentil como CRGB— dan resultados muy
distintos entre sí y ninguna es obviamente la correcta. Es una decisión de diseño
del filtro, no un bug de una línea, y cambiarla altera resultados ya publicados.

Mientras tanto: **para variar la fuerza del realce, usar CRGB o DS-LAB**, donde
la intensidad sí opera. En LDS, ajustar contraste y saturación después del
filtro.

Hay una prueba automática (`tests/run-tests.js`, sección "Problemas conocidos")
que fija este comportamiento. Si algún día se corrige, esa prueba falla y avisa
que hay que actualizar este documento y el CHANGELOG.

## 4. Profundidad de 8 bits

Todo el procesamiento ocurre en 8 bits por canal, porque es lo que expone la API
de `<canvas>` del navegador.

Consecuencias:

- Un TIFF o un RAW revelado a 16 bits **se reduce a 8 al cargarlo**. La
  información adicional se pierde antes de que empiece el realce, que es
  precisamente donde más falta haría.
- Los filtros de decorrelación amplifican componentes de baja varianza que pueden
  estar comprimidas en muy pocos niveles. Estirar cinco niveles a doscientos
  produce **bandeado** (*posterización*) visible en degradados suaves.
- El recorte a 0–255 después de cada filtro descarta valores fuera de rango de
  forma irreversible.

**En la práctica:** partir del archivo de mejor calidad disponible. Un JPEG de
cámara con calidad máxima da mejores resultados que un JPEG re-guardado dos
veces, y un PNG o TIFF exportado del revelado RAW es mejor que cualquier JPEG.

## 5. Sin gestión de color

OPC asume **sRGB** en la entrada y en la salida, y **no lee ni aplica el perfil
ICC embebido** en la imagen.

Una fotografía en Adobe RGB o ProPhoto RGB se interpreta como si fuera sRGB: los
valores numéricos son los del archivo original pero significan otra cosa. Los
resultados siguen siendo internamente consistentes y reproducibles, pero **no son
comparables** con los de la misma foto convertida a sRGB.

Afecta especialmente a los filtros que operan en CIE-LAB —Rojo, Blanco, Negro,
Bicromo, DS-LAB, Micro-relieve—, porque la conversión RGB→LAB parte de una matriz
sRGB/D65 que en ese caso no corresponde.

**En la práctica:** convertir a sRGB al exportar desde el revelador, antes de
cargar en OPC. Y mantener el mismo espacio de color en todo un proyecto.

## 6. RAW no está soportado

CR2, NEF, ARW, DNG y demás no se pueden cargar. No es una decisión de diseño:
el navegador no tiene decodificador RAW y los formatos son propietarios y
distintos entre fabricantes.

Hay que revelarlos antes con Lightroom, darktable, RawTherapee o el software de
la cámara.

Esto agrega un paso con consecuencias reales: **el revelado ya es una
interpretación.** El balance de blancos, la curva de tono y la reducción de ruido
que se apliquen ahí condicionan todo lo que OPC pueda hacer después. Para
comparar fotografías entre sí, revelarlas con los mismos parámetros —y anotar
cuáles fueron.

## 7. La resolución de trabajo cambia el resultado

Por defecto se trabaja a 2000 px en el lado mayor; la resolución completa llega
hasta 8192 px.

Los resultados **no son idénticos** entre una y otra:

- **Micro-relieve, Relieve y CLAHE** dependen de vecindarios. Sus ventanas están
  definidas en píxeles o en fracción de la imagen, así que a distinta escala
  captan estructuras distintas. Las diferencias pueden ser grandes.
- **Decorrelación y pigmentos** son por píxel; sus estadísticas apenas se mueven,
  pero el remuestreo previo altera algo los valores.

**En la práctica:** explorar en 2000 px, exportar en resolución completa con los
parámetros ya elegidos, y **revisar el resultado final** en vez de asumir que es
el mismo más grande. Consignar la resolución de trabajo en cualquier publicación.

## 8. Sin calibración fotométrica

Ninguna de las salidas tiene significado colorimétrico absoluto. Los colores de
CRGB y DS-LAB, en particular, **no son colores**: son posiciones en el espacio de
componentes principales de *esa* imagen, mapeadas a canales RGB para poder verlas.

De ahí se sigue algo que se malinterpreta seguido: **dos imágenes procesadas por
separado no son comparables entre sí.** Cada una calculó su propia matriz de
decorrelación a partir de su propia covarianza. Que dos motivos aparezcan del
mismo tono de naranja en dos fotos distintas no indica absolutamente nada sobre
si el pigmento es el mismo.

Comparar exige una de dos cosas:

- procesar todas las fotos **como un lote con estadísticas congeladas** desde una
  única referencia (para lo que existe el modo lote), o
- incluir una **carta de color** en cada toma y hacer la calibración fuera de OPC.

Sin eso, cualquier afirmación sobre "el mismo pigmento en dos paneles" basada en
imágenes realzadas por separado no está sostenida por los datos.

---

# De reproducibilidad

## 9. Lo que no queda registrado

El nombre del archivo exportado registra el filtro, la intensidad y los ajustes
de contraste y saturación (`IMG_0421_OPC_crgb_i1.8_c10.png`). Eso cubre lo
básico, pero **no** queda registrado:

- la **versión de OPC** usada (y las versiones cambian resultados: ver §10);
- la **resolución de trabajo** (2000 px o completa);
- la **zona de selección**, que puede cambiar el resultado por completo;
- la **cadena de filtros** si se usó el modo Acumular;
- en el lote, **cuál fue la foto de referencia**.

Todo eso hay que anotarlo aparte. Como mínimo, en una publicación deberían
constar **versión, filtro, intensidad y resolución**: son los cuatro datos sin
los cuales otra persona no puede reproducir la imagen.

## 10. Cambios de versión que cambian resultados

OPC no garantiza que una versión nueva reproduzca los resultados de una anterior.
Cuando se corrige un error en el núcleo de procesamiento, las imágenes cambian.

Ya pasó una vez, y no fue menor: **v3.3.0 corrigió la eigendescomposición**, que
daba eigenvalores incorrectos desde v3.0. Los resultados de CRGB, DS-LAB y LDS de
las versiones 3.0 a 3.2.1 **difieren** de los actuales. Si hay material publicado
o en preparación con esas versiones, hay que reprocesarlo para poder compararlo.

El [CHANGELOG](../CHANGELOG.md) señala de forma explícita cada versión que cambia
resultados. Conviene revisarlo antes de actualizar en medio de un trabajo en
curso. Si un proyecto está avanzado, es preferible terminarlo con la versión con
la que se empezó —el repositorio conserva todas las versiones— y reprocesar
después, entero, con la nueva.

---

## Qué falta

Además de lo anterior, hay cosas que directamente no están:

- Deshacer / rehacer más allá del filtro actual.
- Exportar la máscara de selección, o volver a cargarla en otra sesión.
- Un registro automático de la sesión que cubra lo que enumera §9.
- Soporte de 16 bits (requiere `WebGL` o `WebGPU`, no `<canvas>` 2D).
- Perfiles ICC.

Reportes de error y sugerencias: https://github.com/emilios81/opuntiacolor/issues
