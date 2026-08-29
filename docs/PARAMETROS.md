# Parámetros

Rangos, valores por defecto y efecto real de cada control.

---

## Resumen

| Control | Rango | Paso | Por defecto |
|---|---|---|---|
| Intensidad | 0.2 – 5.0 | 0.1 | **1.5** |
| Contraste | −80 – +80 | 5 | **0** |
| Saturación | −100 – +100 | 5 | **0** |
| Resolución de trabajo | completa (hasta 8192 px) / 2000 px | — | **completa** |
| Resolución del lote | 2000 / 4000 / 8192 px | — | **8192 px** |

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
| **Rojo** | Factor sobre a*, y sobre b* al 30 % | Lineal |
| **Blanco** | Amplificación del puntaje z de L* (5 × arriba, 2 × abajo) | Lineal |
| **Negro** | Oscurecimiento de los oscuros (18 ×) y reducción de croma | Lineal |
| **Bicromo** | Factores de a* y de separación claro/oscuro | Lineal |
| **Micro-relieve** | Contraste local (2.5 × / 1.2 ×), bordes (0.25 ×) y croma (3 ×) | Lineal, **satura rápido** |
| **Relieve** | Ganancia de bordes antes de la gamma 0.7 | Satura: por encima de ~2.5 casi todo queda blanco |
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

Se aplican **después** del filtro, sobre el resultado, y son equivalentes exactos
a los filtros CSS `contrast()` y `saturate()`. No modifican el algoritmo: son
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

**Resolución completa por defecto, hasta 8192 px; se puede bajar a 2000 px.**

El control está **arriba de todo en el panel izquierdo, antes de la lista de
filtros**, y aparece solo si la foto supera los 2000 px en su lado mayor. Muestra
las dos opciones juntas —completa o 2000 px— y debajo el tamaño en píxeles que se
va a procesar; mientras se trabaja reducido, el recuadro y esa cifra quedan en
rojo. Está ahí porque la resolución se decide **antes** de elegir filtro, y porque
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

Criterio práctico: **trabajar en resolución completa** y bajar a 2000 px solo si
la máquina se arrastra. Si se exploró en 2000 px, rehacer el resultado final en
resolución completa con los parámetros ya elegidos y revisarlo antes de darlo por
bueno.

Para una publicación conviene consignar la resolución de trabajo junto con la
versión, el filtro y la intensidad: son los cuatro datos necesarios para que otra
persona reproduzca la imagen.

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

**No la usan** los filtros Rojo, Relieve y CLAHE: los tres operan con factores
fijos o locales y no calculan estadísticas globales.

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
observación. El nombre del archivo exportado **no** registra la cadena completa,
así que hay que anotarla aparte.

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
