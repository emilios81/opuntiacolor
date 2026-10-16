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
11. [El gotero selecciona color, no pigmento](#11-el-gotero-selecciona-color-no-pigmento)
12. [El Relieve mide brillo, no altura](#12-el-relieve-mide-brillo-no-altura)

**Técnicas**
3. [El rango de intensidad de LDS no llega a la foto original](#3-el-rango-de-intensidad-de-lds-no-llega-a-la-foto-original)
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

Desde v3.7.0 la descripción del filtro lo dice («hipótesis, no
identificación»), y con el mapa activo el panel propone un control: mirar cómo
sale una zona de roca sin pintura. Si también sale roja, el rojo del mapa no
está distinguiendo pigmento de soporte en esa foto.

**Es una herramienta exploratoria: sirve para separar visualmente zonas y
orientar dónde mirar. No sustituye ningún análisis.** Determinar composición
requiere métodos analíticos —FRX portátil, Raman, espectroscopía— y las
categorías de este filtro no deberían aparecer en una publicación como
identificación de materiales.

---

# Técnicas

## 3. El rango de intensidad de LDS no llega a la foto original

Hasta v3.3.0 el control de intensidad **no tenía ningún efecto en LDS**: se
multiplicaba por un factor común a las tres componentes principales y ese factor
se cancelaba exactamente contra la normalización posterior por mínimo y máximo.
No era un error de redondeo sino una identidad algebraica.

Desde **v3.4.0** la intensidad es el exponente γ del blanqueo, que cambia la
forma de la transformación y por lo tanto no puede cancelarse. Quedan tres
salvedades.

**El extremo bajo no es la foto original.** Con γ → 0 la transformación tiende a
la identidad, pero después se sigue aplicando la normalización —desde v3.5.0, un
recorte por vallas de Tukey con ganancia y desplazamiento comunes—. El piso del
control es entonces "la original con auto-niveles", no la original. Para comparar contra la fotografía sin procesar
hay que usar el deslizador comparativo, no bajar la intensidad a 0.2.

**El exponente topea en γ = 2.** Se alcanza en intensidad 3.0: de ahí en adelante
el control no cambia nada. Es deliberado —por encima de γ = 2 el sobre-blanqueo
amplifica el ruido sin agregar información— y es el mismo tipo de saturación que
ya tienen CRGB y DS-LAB a partir de 4.375.

**El mismo número significa cosas distintas en cada filtro.** "Intensidad 2.0" es
un exponente de blanqueo en LDS, un recorte por percentil en CRGB y DS-LAB, y un
factor multiplicativo en los filtros de pigmento. **No son comparables entre
sí.** Al reportar parámetros en una publicación hay que consignar el filtro junto
con el valor; el número solo no significa nada.

Un detalle que conviene conocer: la decorrelación efectiva no crece de forma
monótona con γ en todo el rango. Crece hasta γ ≈ 1.3 y después vuelve a bajar,
porque el sobre-blanqueo reintroduce correlación entre canales con la estructura
invertida. El rango con comportamiento limpio es γ ≤ 1.3, es decir intensidad
hasta 2.0.

> **Compatibilidad.** Con el valor por defecto (intensidad 1.5) γ vale
> exactamente 1, que es la equalización completa de varianzas que hacía v3.3.0.
> La salida es **idéntica byte a byte** a la de la versión anterior, verificado
> también en modo lote y con zona seleccionada. Como hasta v3.3.0 el control no
> hacía nada, toda salida LDS existente *es* la salida por defecto: **v3.4.0 no
> invalida ninguna imagen ya publicada con LDS.** Hay una prueba automática que
> fija ese checksum.

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

Por defecto se trabaja a la resolución completa de la foto, hasta 8192 px en el
lado mayor. Una foto de más de 16 MP abre con un cartel que propone bajarla a
16 MP; desde el panel se puede elegir también 12 u 8 MP, o 2000 px.

Los resultados **no son idénticos** entre una y otra:

- **Micro-relieve, Relieve en Bordes y CLAHE** dependen de vecindarios. Sus
  ventanas están definidas en píxeles o en fracción de la imagen, así que a
  distinta escala captan estructuras distintas. Las diferencias pueden ser
  grandes. El **Relieve con escala** es la excepción: la escala es un porcentaje
  del lado mayor y el resultado cambia poco con la resolución.
- **Decorrelación y pigmentos** son por píxel; sus estadísticas apenas se mueven,
  pero el remuestreo previo altera algo los valores.

**En la práctica:** trabajar en resolución completa, o en la más alta que la
máquina aguante. Si hizo falta bajar para explorar, **rehacer el resultado final** en completa con los parámetros ya
elegidos y revisarlo, en vez de asumir que es el mismo más grande. Consignar la
resolución de trabajo en cualquier publicación.

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
- la **resolución de trabajo** (completa, 16, 12 u 8 MP, o 2000 px);
- la **zona de selección**, que puede cambiar el resultado por completo;
- la **cadena de filtros** si se usó el modo Acumular (desde v3.7.0 la escala
  del Relieve sí queda en el nombre, como `_e0.25`);
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

Desde entonces hubo más: v3.4.0 y v3.5.0 cambiaron LDS, v3.6.0 la resolución de
trabajo por defecto y **v3.7.0 el filtro Rojo**, que pasó de una transformación
fija a una adaptativa.

El [CHANGELOG](../CHANGELOG.md) señala de forma explícita cada versión que cambia
resultados. Conviene revisarlo antes de actualizar en medio de un trabajo en
curso. Si un proyecto está avanzado, es preferible terminarlo con la versión con
la que se empezó —el repositorio conserva todas las versiones— y reprocesar
después, entero, con la nueva.

---

## 11. El gotero selecciona color, no pigmento

El gotero cromático toma un color del resultado y realza o atenúa esa familia de
color. Es una herramienta de **presentación y de lectura**, y conviene tener
presente qué no es.

**La selección se hace sobre una imagen ya transformada.** El color que se
muestrea no es el color del pigmento: es el color que produjo el filtro después
de rotar, escalar y reproyectar los datos. Dos pigmentos químicamente distintos
pueden terminar en la misma familia de color tras una decorrelación, y un mismo
pigmento bajo dos iluminaciones distintas puede terminar en familias separadas.
**Que dos zonas queden dentro de la misma selección del gotero no es evidencia
de que compartan composición.**

**Realzar un color aumenta su presencia visual, no su evidencia.** Subir la
crominancia de la familia en la que se lee un motivo lo hace más legible, y
también más convincente de lo que los datos justifican. La verificación sigue
siendo la misma que para cualquier realce (§1): el motivo tiene que seguir
estando con menos procesamiento, no solo con más.

**Lo que sí se puede afirmar.** Que, en el resultado del filtro X con
intensidad Y, existe una región cuya crominancia está a menos de Z unidades de
la de un punto dado. Es una afirmación sobre la imagen procesada, y como tal
debe reportarse.

**Registrar el color muestreado.** El nombre del archivo guarda la ganancia y la
tolerancia, pero no el color: si el procedimiento se va a publicar, hay que
anotar los valores RGB de la muestra junto con los demás parámetros. Es un caso
particular de §9.

## 12. El Relieve mide brillo, no altura

Con una escala, el Relieve muestra lo que la foto registra como **más claro o
más oscuro que su entorno** a ese tamaño. No hay datos de altura en una foto: si
el resultado se parece a un relieve es porque, con luz rasante, las caras que
miran a la luz salen claras y las que no, oscuras.

- **Con luz rasante** lo que se ve es, en buena medida, relieve, pero depende de
  la dirección de la luz: un surco perpendicular a ella se marca mucho y uno
  paralelo casi nada. Dos fotos con luz de lados opuestos muestran surcos
  distintos.
- **Con luz difusa** lo que se ve es diferencia de tono: pátina, picado fresco,
  manchas, líquenes. Un grabado se distingue si el picado cambió el color de la
  superficie, no por su profundidad.
- **Mojar la roca, la hora del día o el balance de blancos** cambian el
  resultado tanto como el motivo.

Para documentar relieve de verdad hacen falta datos de forma: fotogrametría
(y un modelo de elevación, al que sí se le puede aplicar un Local Relief Model),
RTI o escaneo. El Relieve de OPC sirve para encontrar y orientar, no para medir.

---

## Qué falta

Además de lo anterior, hay cosas que directamente no están:

- Deshacer / rehacer más allá del filtro actual.
- Exportar la máscara de selección, o volver a cargarla en otra sesión.
- Un registro automático de la sesión que cubra lo que enumera §9.
- Soporte de 16 bits (requiere `WebGL` o `WebGPU`, no `<canvas>` 2D).
- Perfiles ICC.

Reportes de error y sugerencias: https://github.com/emilios81/opuntiacolor/issues
