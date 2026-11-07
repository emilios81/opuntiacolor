# Parámetros

Rangos, valores por defecto y efecto real de cada control.

---

## Resumen

| Control | Rango | Paso | Por defecto |
|---|---|---|---|
| Intensidad | 0.2 – 5.0 | 0.1 | **1.5** |
| Contraste | −80 – +80 | 5 | **0** |
| Saturación | −100 – +100 | 5 | **0** |
| Resolución de trabajo | completa (hasta 8192 px) / 16 MP / 12 MP / 8 MP / 2000 px | — | **completa** (con más de 16 MP se pregunta al abrir; recomendada 16 MP) |
| Resolución del lote | 2000 / 4000 / 8192 px | — | **8192 px** |
| Escala métrica | dos puntos sobre la escala de la foto y los mm entre ellos | — | **sin escala** |

---

## Intensidad

**0.2 – 5.0, por defecto 1.5.** Es el único parámetro que entra en el algoritmo
del filtro; contraste y saturación se aplican después, sobre el resultado.

No significa lo mismo en todos los filtros. Vale la pena saber qué controla en
cada caso, porque en algunos la respuesta es lineal y en otros no.

| Filtro | Qué controla | Respuesta |
|---|---|---|
| **CRGB** | Recorte por percentil: `k = max(0.8 , 3.5/intensidad)` desvíos | Inversa y **saturada a partir de 4.4** |
| **DS-LAB** | Igual que CRGB | Igual que CRGB |
| **LDS** | Exponente de blanqueo `γ = intensidad/1.5` | Creciente, **topa en intensidad 3.0** |
| **YBK** | Amplificación de croma (`3 ×`) y contraste de luma (`0.6 ×`) | Lineal |
| **Rojo** | Dispersión objetivo en el plano a*-b*: `σ = 10 · intensidad` unidades LAB | Lineal |
| **Blanco** | Amplificación del puntaje z de L* (5 × arriba, 2 × abajo) | Lineal |
| **Negro** | Oscurecimiento de los oscuros (18 ×) y reducción de croma | Lineal |
| **Bicromo** | Factores de a* y de separación claro/oscuro | Lineal |
| **Micro-relieve** | Contraste local (2.5 × / 1.2 ×), bordes (0.25 ×) y croma (3 ×) | Lineal, **satura rápido** |
| **Relieve** | Bordes: ganancia antes de la gamma 0.7. Con escala: `40 · intensidad/1.5` niveles por desvío robusto | Bordes: satura por encima de ~2.5. Con escala: lineal |
| **CLAHE** | Límite de recorte: `clip = (1 + 2·intensidad) · n/256` | Lineal, **inversa en el efecto** |

### Rangos útiles en la práctica

- **1.2 – 2.0** — el rango de trabajo normal. Suficiente para casi todo.
- **0.2 – 1.0** — realce muy suave. Útil cuando la foto ya tiene buen contraste
  y solo se busca confirmar algo que se sospecha.
- **2.0 – 3.0** — pigmento muy degradado o muy diluido. Empieza a aparecer ruido
  amplificado.
- **3.0 – 5.0** — casi siempre demasiado. En CRGB y DS-LAB no cambia nada por
  encima de 4.4 (ver abajo); en el resto suele producir imágenes saturadas que
  no aportan información y sí invitan a sobreinterpretar.

### CRGB y DS-LAB: la intensidad satura en 4.4

El recorte es `k = max(0.8 , 3.5/intensidad)`. Ese `max` significa que para
intensidad ≥ 4.375 el valor de `k` queda fijo en 0.8 y **la salida deja de
cambiar**. Mover el control entre 4.4 y 5.0 no hace absolutamente nada.

Es una decisión deliberada: por debajo de 0.8 desvíos el recorte deja fuera tanta
información que la salida es casi binaria.

Notar además que la relación es **inversa**: más intensidad significa un recorte
*más* agresivo, es decir un rango de entrada más angosto estirado sobre los mismos
256 niveles.

### CLAHE: más intensidad, menos ecualización

`clip = (1 + 2 · intensidad) · n/256`. El *clip limit* crece con la intensidad, y
un límite más alto significa **menos recorte del histograma**, es decir un
comportamiento más parecido a la ecualización clásica sin límite de contraste.

Contra lo que sugiere el nombre del control, **bajar la intensidad en CLAHE
recorta más y amplifica menos el ruido**. Para una foto ruidosa o de ISO alto,
probar con 0.5 – 1.0 antes que con 2.0.

### LDS: la intensidad es el exponente de blanqueo

Desde v3.4.0. En vez de multiplicar las tres componentes principales por un
factor común —que se cancelaba con la normalización posterior y hacía que el
control no sirviera para nada—, la intensidad es el **exponente γ** al que se
eleva la equalización de varianzas:

```
componente_k  ←  componente_k · (σ̄ / σ_k)^γ        con  γ = intensidad / 1.5
```

| γ | Qué hace |
|---|---|
| **0** | Identidad: no hay decorrelación |
| **1** | Equalización completa de varianzas (blanqueo ZCA) — el comportamiento de v3.0 a v3.3.0 |
| **> 1** | Sobre-blanqueo: las componentes menores se amplifican más allá de la igualación |

Como γ cambia la *forma* de la transformación y no su escala, no puede
cancelarse. Y como `γ = intensidad/1.5`, el valor por defecto da γ = 1: **la
salida por defecto es idéntica byte a byte a la de v3.3.0.**

**Para qué sirve bajarla.** Con γ entre 0.3 y 0.7 (intensidad 0.5 – 1.0) la
decorrelación es parcial y la roca conserva más su color real. Es la forma de
**verificar un motivo con menos realce**: si sigue estando ahí con la mitad del
estiramiento, es pigmento y no un artefacto amplificado. Hasta v3.3.0 esa
comprobación no se podía hacer.

| γ | Intensidad | Para qué |
|---|---|---|
| 0.3 – 0.7 | 0.5 – 1.0 | Verificar que un rasgo no es un artefacto |
| 1.0 | 1.5 | Trabajo normal (el valor por defecto) |
| 1.3 – 1.7 | 2.0 – 2.5 | Pigmento muy diluido; empieza a subir el ruido |
| 2.0 | 3.0 en adelante | Casi siempre demasiado; el control ya no cambia nada |

Salvedades en [LIMITACIONES.md §3](LIMITACIONES.md#3-el-rango-de-intensidad-de-lds-no-llega-a-la-foto-original):
el extremo bajo no devuelve la foto original, el exponente topea en γ = 2, y la
decorrelación efectiva deja de crecer por encima de γ ≈ 1.3.

---

## Contraste y saturación

**Contraste: −80 a +80. Saturación: −100 a +100. Ambos por defecto en 0.**

Se aplican **después** del filtro, sobre el resultado, y siguen las fórmulas de
los filtros CSS `contrast()` y `saturate()`. No modifican el algoritmo: son
ajustes de presentación.

```
k = 1 + contraste/100        canal' = canal · k + 127.5 · (1 − k)
s = 1 + saturación/100       salida = luma·(1 − s) + s · canal'
```

con luma en coeficientes Rec.709 (0.213 / 0.715 / 0.072).

Casos particulares que conviene conocer:

- **Saturación −100** deja la imagen en escala de grises exacta. Útil para
  exportar el resultado de Micro-relieve o Relieve como calco.
- **Contraste alto (+60 o más)** recorta en negro y en blanco de forma
  irreversible: la información recortada no está en el archivo exportado.
- **Se aplican también en el lote**, con los mismos valores para todas las
  fotos.
- **La descarga suelta y el lote no dan exactamente lo mismo.** La descarga
  suelta usa el filtro del navegador; el lote, `applyPostAdjust`, que aplica las
  mismas fórmulas por píxel. Con un solo ajuste difieren en 1 nivel, por
  redondeo. Con contraste positivo y saturación juntos, hasta 26–31 niveles: el
  navegador recorta a 0–255 entre los dos ajustes y `applyPostAdjust` no.
  Medido en v3.8.0; los dos caminos siguen como estaban y el registro de sesión
  anota cuál se usó.

Un detalle importante para la reproducibilidad: **el nombre del archivo
exportado registra los tres valores**
(`IMG_0421_OPC_crgb_i1.8_c10.png`), de modo que el procedimiento queda anotado
en el propio archivo.

---

## Gotero cromático

**Tolerancia: 5 a 60, por defecto 20. Suavizado: 0 a 150%, por defecto 50.
Ganancia: −100 a +100, por defecto +60.** Solo disponible con un filtro ya
aplicado.

Se toca un color del resultado y se lo realza o se lo atenúa sin tocar el resto
de la escena. La pertenencia a la familia de color se mide en el plano de
crominancia Cb-Cr; la luminancia no se toca nunca.

| Control | Qué hace |
|---|---|
| **Ganancia** | Positiva realza, negativa atenúa. −100 deja el color exactamente en gris; +100 llega a triplicarlo, con tope en el límite del gamut |
| **Tolerancia** | Radio en el plano Cb-Cr dentro del cual el efecto es pleno. 20 toma una familia de color; 40 o más empieza a arrastrar colores vecinos |
| **Suavizado** | Franja adicional, en porcentaje de la tolerancia, donde el efecto decae hasta cero. Con 0 el borde es duro y se nota como recorte; 50% es un buen punto de partida |

**Rangos útiles en la práctica.**

- *Bajar un color que tapa la escena* (el verde o el violeta que ocupan medio
  panel): ganancia −60 a −100, tolerancia 20 – 30, suavizado 50 – 100%.
- *Subir el color en el que se lee el motivo*: ganancia +40 a +80, tolerancia
  12 – 20 —más ajustada, para no arrastrar el soporte—, suavizado 50%.
- *Aislar visualmente una familia*: atenuar todo lo demás no se puede en un solo
  paso; conviene atenuar de a un color por vez, con el modo Acumular apagado.

**Ajustes acumulados.** Con **Fijar ajuste** el ajuste en curso pasa a la lista y
el gotero queda libre para el color siguiente, que se muestrea ya sobre el
resultado acumulado. Cada ajuste de la lista se puede quitar por separado con la
✕: como se guardan como reglas y la imagen se recalcula entera desde el resultado
del filtro, quitar uno del medio revierte solo ese y deja los demás intactos.

El orden importa cuando dos ajustes se superponen —el primero cambia el color que
el segundo encuentra—, y por eso la lista va numerada. Si dos ajustes se pisan y
el resultado no es el esperado, conviene quitarlos y rehacerlos en el otro orden.

**Qué informa el panel.** El porcentaje de la imagen que alcanza el ajuste en
curso. Si está por encima del 40 o 50%, la tolerancia es demasiado ancha y el
"realce selectivo" está actuando sobre casi toda la escena.

**Reproducibilidad.** El nombre del archivo exportado registra la cadena completa
de ganancias y tolerancias (`_gotero_g-80t25_g+60t15`). Los colores muestreados,
en cambio, **no quedan registrados en el nombre**: hay que anotarlos aparte si el
procedimiento se va a publicar. El gotero se aplica también en el lote, con la
misma cadena para todas las fotos.

**Advertencia.** La selección se hace sobre una imagen ya transformada: describe
el color que produjo el filtro, no la composición del pigmento. Ver
[LIMITACIONES.md §11](LIMITACIONES.md#11-el-gotero-selecciona-color-no-pigmento).

---

## Resolución de trabajo

**Resolución completa por defecto, hasta 8192 px. Con fotos de más de 16 MP se
pregunta al abrirlas.**

Desde v3.7.3, una foto que pasa de 16 MP (medida ya con el tope de 8192 px) abre
con un cartel que propone **16 MP (recomendada)**, **12 MP** o la **completa**. Con
un panorama de 29 MP, el filtro más lento tarda 8,5 s a resolución completa,
4,7 s a 16 MP y 3,6 s a 12 MP; 16 MP conserva tres cuartos de cada lado.

El control está **arriba de todo en el panel izquierdo, antes de la lista de
filtros**, y aparece solo si la foto supera los 2000 px en su lado mayor. Es un
menú con los escalones que achican la foto: completa, 16, 12 y 8 MP, y 2000 px.
Los escalones en megapíxeles limitan la cantidad de píxeles y no el lado, así que
un panorama alargado no queda angosto. Debajo se ve el tamaño en píxeles que se
va a procesar; mientras se trabaja reducido, el recuadro y esa cifra quedan en
rojo. Completa y 2000 px dan exactamente el mismo tamaño que en versiones
anteriores. Está ahí porque la resolución se decide **antes** de elegir filtro, y porque
no debería pasar inadvertida: es la diferencia entre una imagen de exploración y
una publicable.

Cambiar la resolución **descarta el resultado procesado y la selección activa**:
sus coordenadas corresponden a la resolución anterior. Los filtros y la intensidad
elegidos no se pierden, así que rehacer el resultado es un clic.

**Los resultados no son idénticos entre resoluciones.** Los filtros que dependen
de vecindarios —Micro-relieve, Relieve, CLAHE— usan ventanas definidas en
píxeles o en fracción de la imagen, así que cambian con la escala. Los filtros de
decorrelación y de pigmento son por píxel y sus estadísticas apenas se mueven,
pero el remuestreo previo altera algo los valores.

Criterio práctico: **trabajar en resolución completa** y, con fotos grandes,
bajar lo justo: 16 MP antes que 12 MP, y 2000 px solo para explorar. Si se exploró
reducido, rehacer el resultado final en la resolución más alta que la máquina
aguante, con los parámetros ya elegidos, y revisarlo antes de darlo por bueno.

Para una publicación conviene consignar la resolución de trabajo junto con la
versión, el filtro y la intensidad: son los cuatro datos necesarios para que otra
persona reproduzca la imagen.

---

## Escala del Relieve

**Bordes, 0.1, 0.25, 0.5 o 1 % del lado mayor; por defecto Bordes.** Aparece
solo con el filtro Relieve activo.

- **Bordes** es el mapa de bordes de v3.0–v3.6, idéntico byte a byte: todo
  detalle por igual. Sirve para calcar pinturas.
- **Una escala** borra todo lo que es más chico que ella y resta el fondo
  —iluminación despareja, pendiente general de la roca—. Sirve para grabados:
  lo picoteado se lee como más claro o más oscuro que su entorno.

La escala es un **porcentaje del lado mayor**, no un número de píxeles, así que
la misma foto a 2000 px o a resolución completa da el mismo relieve. Debajo de
los botones el panel muestra a cuántos píxeles corresponde en la foto abierta
y, si la foto está calibrada ([Escala métrica](#escala-métrica)), a cuántos
milímetros.

Para elegirla, pensar en lo que se quiere **borrar**, no en el motivo: la
escala tiene que ser más grande que el grano de la roca y bastante más chica que
el ancho del surco. En una foto de panel de ~1 m, 0.25 % son 2.5 mm y 0.5 %,
5 mm; con surcos de 1 a 2 cm, esas dos suelen ser las que mejor se leen. Si
vuelve el grano, subir; si el motivo se empasta con su entorno, bajar. El tope
es 1 %: con 2 %, en esa misma foto se borraba todo lo menor de 2 cm —los propios
surcos— y quedaba una mancha borrosa.

El nombre del archivo exportado la registra al lado de la intensidad
(`IMG_0421_OPC_relief_i1.5_e0.25.png`). En Bordes se omite, como en v3.6.

### Más opciones (v3.8.0)

**Todas apagadas por defecto; apagadas, el Relieve da byte a byte lo mismo que
en v3.7.** Aparecen en un desplegable debajo de los botones de escala, solo con
una escala elegida (no en Bordes).

| Opción | Valores | Qué hace |
|---|---|---|
| Doble: objeto y textura | peso del objeto 25, **50**, 75 % | Suma la escala elegida (textura) y otra 4 veces mayor (objeto), cada una normalizada en su entorno |
| Compresión suave | sí / **no** | Los extremos se comprimen (asinh) en vez de recortarse |
| Realzar con CLAHE | sí / **no** | CLAHE sobre el resultado. **Deja de ser una medida** |
| Mezclar con color | **no**, DS-LAB, LDS; relieve 25, **50**, 75 % | El relieve entra como luminosidad del filtro de color |

- **Doble.** Sirve cuando un motivo tiene a la vez forma y detalle: el objeto
  muestra el surco entero y la textura, el picado. Con la foto calibrada, el
  panel dice cuántos milímetros mide la escala del objeto. Con más peso en el
  objeto se ve la forma de conjunto; con menos, el detalle.
- **Compresión suave.** En el centro la pendiente es 1,08: casi no cambia.
  Lo que el recorte llevaba a negro o blanco liso se comprime y entra con
  detalle hasta el triple de lejos del gris medio.
- **CLAHE.** Hace más legible un motivo débil, pero estira el contraste de
  manera distinta en cada zona: dos zonas de la misma imagen ya no se pueden
  comparar. Va con intensidad 1.5.
- **Mezcla.** El filtro de color se calcula con su intensidad por defecto
  (1.5) y con la misma zona que el Relieve. Con 50 %, la luminosidad es mitad
  del filtro y mitad del relieve; el color es siempre el del filtro.

Las opciones prendidas van al nombre del archivo, en este orden:
`_e0.25_doble50_suave_clahe_lds50`.

---

## Escala métrica

**Desde v3.8.0. Sin escala por defecto.** No cambia ningún resultado: ningún
filtro la usa.

Si la foto tiene una escala métrica a la vista, se puede calibrar:

1. **Calibrar con la regla**, en el recuadro *Escala métrica* del panel.
2. Tocar el comienzo de un tramo conocido de la escala (A) y después el final
   (B). Una **lupa** sigue al puntero y aumenta cuatro veces lo que se ve; la
   rueda del mouse acerca la imagen. Mientras se marca, una línea muestra el
   largo del tramo en píxeles. Un tercer toque vuelve a empezar; **Esc**
   cancela.
3. Elegir el largo del tramo (1 cm, 5 cm, 10 cm, 50 cm o 1 m) o escribirlo en
   mm (acepta coma decimal), y **Listo**. Antes de confirmar, el panel muestra
   cuántos píxeles por milímetro va a dar.

El panel muestra entonces cuántos píxeles mide un milímetro a la resolución de
trabajo, y cuántos milímetros mide un píxel. Los puntos se guardan en fracción
del ancho y del alto, como la selección: si se cambia la resolución de trabajo,
la calibración sigue valiendo y los números se recalculan. Se borra al abrir
otra foto. **Recalibrar** la rehace y **Quitar** la borra.

Sobre la imagen aparece una **barra de escala**, como la de un mapa: el largo
redondo más grande que entra (1 cm, 2 cm, 5 cm…), que cambia con el zoom. Se
apaga con el interruptor del recuadro. Solo se ve en pantalla: no entra en la
imagen exportada.

Con una foto calibrada, la [escala del Relieve](#escala-del-relieve) se
muestra también en milímetros.

**Qué tramo elegir:** el más largo de la escala que se vea entero. Un error de
1 px en cada extremo es un 0,2 % sobre un tramo de 1000 px y un 2 % sobre uno
de 100 px.

La escala queda en el registro de sesión, en el campo `escala`. En el lote no
se registra, porque cada foto tiene su propio encuadre. Vale en el plano de la
escala métrica; fuera de él es una aproximación
([LIMITACIONES.md §13](LIMITACIONES.md#13-la-escala-métrica-vale-en-un-plano)).

---

## Zona de selección

Rectángulo, círculo o mano alzada.

La selección **no recorta la imagen**. Determina qué píxeles se usan para
calcular las estadísticas del filtro —media, covarianza, desvíos, rangos—, y esas
estadísticas se aplican después a **toda** la imagen. Es el mismo criterio que
DStretch.

Sirve para calibrar el realce sobre la parte que interesa: seleccionar el sector
con pintura hace que la decorrelación se optimice para separar *ese* pigmento de
*ese* soporte, en lugar de repartir el rango dinámico entre el cielo, el pasto y
la sombra del alero.

Si la selección queda vacía, se usa la imagen completa.

**No la usan** CLAHE ni el Relieve en *Bordes*: operan con factores fijos o
locales y no calculan estadísticas globales. Desde v3.7.0 el **Rojo** sí la usa
(el color de la roca sale de la zona) y el **Relieve con escala** toma de ella el
centro y el desvío con que normaliza.

---

## Modo Acumular

Encadena filtros: el siguiente se aplica sobre el resultado del anterior en lugar
de sobre la imagen original.

Combinación que suele funcionar: **CLAHE → DS-LAB**, para una foto con
iluminación desigual y pigmento sutil. Primero se empareja la iluminación,
después se separan los pigmentos.

Advertencia metodológica: cada pasada amplifica también el ruido y los artefactos
de la anterior. Después de dos o tres filtros encadenados, lo que se ve puede ser
tanto pigmento como el rastro amplificado de la compresión JPEG. Si un rasgo solo
aparece con tres filtros encadenados, conviene tratarlo como hipótesis y no como
observación. El nombre del archivo exportado **no** registra la cadena completa;
desde v3.8.0 la registra el registro de sesión, paso por paso y con la zona
seleccionada en cada uno.

---

## Procesado por lote

**Resolución: 2000 / 4000 / 8192 px, por defecto 8192.**

Se ajusta el filtro sobre una fotografía de referencia y se aplica a todo el lote
con las estadísticas congeladas de esa referencia. La intensidad, el contraste y
la saturación son los mismos para toda la serie.

La elección de la foto de referencia importa más que cualquier parámetro: es la
que define la transformación de todo el lote. Conviene elegir una que contenga
tanto pigmento como soporte, en iluminación representativa del conjunto. Una
referencia tomada a contraluz o con el panel medio en sombra arrastra ese sesgo a
las 200 fotos siguientes.

Ver [ALGORITMOS.md](ALGORITMOS.md#procesado-por-lote-estadísticas-congeladas)
para el detalle de qué se congela en cada filtro.

Desde v3.8.0, cada foto del lote lleva su propio registro de sesión, y al
terminar se guardan un `.csv` con una fila por foto y un `.json` con la
configuración común (ver abajo).

---

## Registro de sesión

**Desde v3.8.0. No tiene parámetros: se escribe siempre.**

Cada imagen exportada lleva adentro un registro con todo lo que hace falta para
rehacerla:

- **PNG:** un bloque `iTXt` con la clave `OPC-registro`.
- **JPG:** uno o más segmentos de comentario que empiezan con
  `OPC-registro k/N`. Un segmento admite 65 533 bytes, y una selección a mano
  alzada larga puede pasarse.
- **TIFF:** la etiqueta 270, `ImageDescription`. Es ASCII, así que los acentos
  van como `ó`, que sigue siendo JSON válido.

Con `+JSON` (prendido por defecto), el mismo contenido baja además aparte como
`.json`, con el mismo nombre que la imagen. Ver [Qué baja y dónde](#qué-baja-y-dónde).

### Campos

| Campo | Qué guarda |
|---|---|
| `formato`, `version_formato` | `"OPC-registro"` y `1`. Identifican el archivo como registro de OPC |
| `opc.version` | Versión de OPC que hizo la imagen |
| `fecha` | Fecha y hora de la exportación, en UTC (ISO 8601) |
| `entrada` | Foto original: `archivo`, `bytes`, `sha256` del archivo, `ancho` y `alto` en píxeles |
| `trabajo` | `resolucion` (`full`, `16mp`, `12mp`, `8mp`, `2000`) o, en el lote, `lado_max`; `ancho` y `alto` de trabajo; `sha256_pixeles` de la foto a ese tamaño |
| `escala` | `null` si no se calibró. Si no: `distancia_mm`, `puntos` (los dos extremos en fracción, 0–1), `puntos_px_original`, `px_por_mm_original`, `px_por_mm_trabajo` (el de la imagen exportada) y `mm_por_px_trabajo`. Al reproducir se usan `puntos` y `distancia_mm`; lo demás es para leer a ojo |
| `pasos[]` | Un elemento por filtro, en orden: `filtro` (el id interno: `crgb`, `relief`…), `intensidad`, `opciones` (`{"escala": 0.25}` en el Relieve), `seleccion` y `estadisticas` |
| `pasos[].seleccion` | `null`, o `tipo` (`rect`, `circle`, `free`) con `x1, y1, x2, y2` o `puntos` en **fracción** del ancho y del alto (0–1). `caja_px` es la caja en píxeles de trabajo, solo para leerla a ojo |
| `pasos[].estadisticas` | Lo que el filtro calculó de la foto o de la zona: medias, matriz de decorrelación, recortes. Son las que el lote congela |
| `gotero[]` | Cada ajuste, en orden: `r, g, b` muestreados, `tolerancia`, `suavizado`, `ganancia` |
| `ajustes` | `contraste`, `saturacion` y `metodo`: `filtro_css` en la descarga suelta, `por_pixel` en el lote (ver [Contraste y saturación](#contraste-y-saturación)) |
| `salida` | `archivo`, `formato` y `sha256_pixeles` de la imagen exportada. En el `.json` aparte, además, `sha256` del archivo |
| `lote` | `null` fuera del lote. En el lote: `referencia` (archivo, huella y tamaño de trabajo de la foto de referencia), `lado_max`, `formato` y `estadisticas_congeladas: true` |

### Las dos huellas

Las huellas son SHA-256 en hexadecimal.

- **La del archivo** (`entrada.sha256`, `salida.sha256`) identifica un archivo
  exacto, byte a byte.
- **La de los píxeles** (`sha256_pixeles`) es la que sirve para comparar
  resultados. Dos navegadores pueden guardar los mismos píxeles en dos PNG
  distintos, porque comprimen distinto. Se calcula sobre los valores RGB de
  8 bits, fila por fila, sin el alfa. En Python da lo mismo que:

  ```python
  import hashlib, numpy as np
  from PIL import Image
  hashlib.sha256(np.asarray(Image.open("salida.png").convert("RGB")).tobytes()).hexdigest()
  ```

  En el JPG, la huella es la de los píxeles **antes** de comprimir, así que no
  coincide con lo que se lee del archivo.

### Reproducir un registro

Primero se carga la foto original. Después, **↺ Reproducir un registro…** abre
el `.json` o la imagen exportada. OPC rehace la imagen así:

1. Toma la foto al tamaño de trabajo del registro.
2. Aplica cada paso. Fuera del lote, cada filtro se recalcula desde cero con la
   zona de ese paso, como se hizo la primera vez. En el lote, cada paso va con
   las estadísticas congeladas del registro y sobre la foto entera.
3. Aplica el gotero y los ajustes, por el mismo camino que se usó al exportar.

Después informa:

- si la versión es otra, y si entre medio cambió el resultado de algún filtro
  usado;
- si el archivo de la foto es el mismo;
- si los píxeles de entrada coinciden;
- si la imagen rehecha es idéntica, píxel a píxel, a la exportada.

La interfaz queda con el filtro, la intensidad, la escala del Relieve, la zona,
el gotero, los ajustes y la escala métrica del registro, lista para seguir
trabajando.

### CSV del lote

`OPC_lote_<fecha>_<hora>.csv`, separado por comas (RFC 4180), con una fila por
foto. Tiene estas columnas:

- `archivo_entrada`, `sha256_entrada`;
- `ancho_original`, `alto_original`, `ancho_trabajo`, `alto_trabajo`;
- `archivo_salida`, `sha256_pixeles_salida`, `sha256_salida`;
- `estado`: `ok` o `error`.

Al lado queda `OPC_lote_<fecha>_<hora>.json`, con la configuración común y la
foto de referencia.

### Qué baja y dónde

| `+JSON` | `+PDF` | Qué baja |
|---|---|---|
| apagado | apagado | Solo la imagen, como una descarga común |
| prendido | apagado | Un `.zip` con una carpeta adentro: la imagen y el `.json` |
| apagado | prendido | Un `.zip` con una carpeta adentro: la imagen y el informe |
| prendido | prendido | Un `.zip` con una carpeta adentro: los tres (por defecto) |

El `.zip` y la carpeta llevan el nombre de la exportación, y el `.zip` baja
donde bajan siempre las descargas, sin preguntar. Windows lo abre como una
carpeta más; con «Extraer todo» queda la carpeta suelta. Va en `.zip` porque
una página web no puede crear carpetas en Descargas: el navegador solo le deja
bajar archivos sueltos.

En todos los casos el registro va adentro de la imagen: aunque no se baje el
`.json`, la imagen se puede reproducir.

### Informe en PDF

**Prendido por defecto; se apaga con `+PDF`, al lado de PNG, JPG y TIFF.** La
elección se recuerda entre visitas.

Con `+PDF`, cada descarga suelta lleva además un informe en PDF con el mismo
nombre. Es para leer, imprimir o adjuntar; para rehacer la imagen hacen falta
el `.json` o la propia imagen exportada. Tiene:

- el original y el resultado lado a lado, con la zona en rojo, el tramo
  calibrado y la barra de escala;
- la foto de entrada, la resolución de trabajo y sus huellas;
- cada paso, cada ajuste del gotero (con una muestra del color), el contraste
  y la saturación;
- la escala métrica, si se calibró;
- el archivo de salida y sus huellas;
- cómo reproducirlo y cómo citar OPC.

Sale en el idioma de la interfaz, en A4. Si la foto tiene GPS, el informe dice
que lo tiene pero no copia las coordenadas. El lote no hace informes.
