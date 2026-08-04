# Algoritmos

Qué hace exactamente cada filtro, paso a paso. Todo el procesamiento ocurre en
8 bits por canal y sin ningún componente aleatorio: la misma entrada con los
mismos parámetros produce siempre el mismo archivo.

Los nombres de archivo y de función remiten a `src/app.jsx`.

---

## Índice

- [Núcleo compartido](#núcleo-compartido)
  - [Conversiones de color](#conversiones-de-color)
  - [Media y covarianza sobre la máscara](#media-y-covarianza-sobre-la-máscara)
  - [Eigendescomposición de Jacobi](#eigendescomposición-de-jacobi)
  - [Imagen integral](#imagen-integral)
- [Decorrelación](#decorrelación) — CRGB, DS-LAB, LDS, YBK
- [Pigmentos](#pigmentos) — Rojo, Blanco, Negro, Bicromo
- [Grabados](#grabados) — Micro-relieve, Relieve
- [Técnico](#técnico) — CLAHE, Mapa de pigmentos
- [Ajustes posteriores](#ajustes-posteriores)
- [Procesado por lote](#procesado-por-lote-estadísticas-congeladas)

---

## Núcleo compartido

### Conversiones de color

**RGB ↔ CIE-LAB** (`rgb2lab`, `lab2rgb`). sRGB con blanco de referencia D65
(X = 0.95047, Y = 1.0, Z = 1.08883). Linealización con la curva sRGB estándar
(umbral 0.04045, exponente 2.4), matriz sRGB→XYZ de Lindbloom, y la función
cúbica de CIE con el umbral 0.008856.

LAB es un espacio perceptualmente aproximado: distancias iguales en LAB
corresponden a diferencias visuales aproximadamente iguales. Por eso todos los
filtros de pigmento operan ahí y no en RGB, donde una misma diferencia numérica
se percibe muy distinta según la zona del espacio.

`lab2rgb` recorta a 0–255 y redondea. La ida y vuelta RGB→LAB→RGB se desvía como
mucho **1 nivel de 255**, verificado sobre 4000 colores en las pruebas.

**RGB ↔ YCbCr** (`rgb2ycbcr`, `ycbcr2rgb`). Coeficientes JPEG/Rec.601
(0.299 / 0.587 / 0.114), croma centrada en 128. Separa luminancia de crominancia
en una transformación lineal barata, que es lo que necesita YBK.

### Media y covarianza sobre la máscara

`meanCov3(CH, n, mask)` — media y matriz de covarianza 3 × 3 de los tres canales.

Si hay una **zona seleccionada**, las estadísticas se calculan **solo con los
píxeles de la zona** y después se aplican a toda la imagen. Es el mismo criterio
que usa DStretch, y es lo que permite decir "calibrá la decorrelación sobre este
panel con pintura y aplicásela a toda la foto".

Si la máscara quedó vacía (por ejemplo, una selección fuera de la imagen), se
descarta y se usa la imagen completa: nunca se divide por cero.

A la diagonal se le suma **ε = 1 × 10⁻¹⁰** para que la matriz siga siendo
invertible con imágenes de un solo color, donde la covarianza sería singular.

### Eigendescomposición de Jacobi

`jacobiEigen3(cov)` — eigenvalores y eigenvectores de la covarianza 3 × 3 por
rotaciones de Jacobi.

En cada iteración se busca el elemento fuera de la diagonal de mayor módulo y se
aplica la rotación que lo anula:

```
θ  = ½ · atan2( 2·a[p][q] ,  a[p][p] − a[q][q] )
A' = Jᵀ · A · J
```

Máximo 100 iteraciones; corta cuando el mayor elemento fuera de la diagonal cae
por debajo de 1 × 10⁻¹⁴. En una matriz 3 × 3 eso pasa en unas pocas rotaciones.

**Los eigenvectores se devuelven ordenados por eigenvalor descendente.** Sin ese
orden la asignación de componente principal a canal de salida sería arbitraria y
dos fotografías del mismo panel podrían recibir asignaciones distintas: los
colores dejarían de ser comparables entre imágenes. `stds` son las raíces
cuadradas de los eigenvalores, es decir el desvío estándar a lo largo de cada
componente.

> **Corregido en v3.3.0.** Hasta v3.2.1 el producto `Jᵀ·A·J` se hacía en dos
> pasos pero solo se volcaban de vuelta las filas *p* y *q*: las filas restantes
> quedaban con sus columnas *p*,*q* sin actualizar, la matriz perdía la simetría
> durante la iteración y el resultado convergía a eigenvalores incorrectos. En
> una covarianza típica de fotografía de panel λ₂ salía unas cinco veces
> sobrevaluada y λ₃ colapsaba prácticamente a cero — justo las componentes de
> baja varianza que el decorrelation stretch busca amplificar. **Cambia los
> resultados de CRGB, DS-LAB y LDS.** Las pruebas verifican ahora los
> eigenvalores contra una solución analítica independiente.

### Imagen integral

`buildSAT` / `satMean` — *summed-area table*: la suma acumulada permite obtener
el promedio de cualquier ventana rectangular con cuatro accesos, sea cual sea su
tamaño.

```
suma(x0,y0,x1,y1) = S(x1+1,y1+1) − S(x0,y1+1) − S(x1+1,y0) + S(x0,y0)
```

Sin esto, el contraste local del filtro de micro-relieve con ventanas grandes
sería O(w · h · r²) y congelaría el navegador. Con la imagen integral es O(w · h),
independiente del radio.

---

## Decorrelación

El *decorrelation stretch* (Gillespie, Kahle y Walker 1986) parte de una
observación simple: en una fotografía de roca los tres canales están muy
correlacionados —casi toda la variación es de brillo, no de color— y las
diferencias cromáticas que interesan viven en las componentes de menor varianza,
comprimidas en un rango de pocos niveles. Rotar al espacio de componentes
principales, ecualizar las varianzas y volver produce diferencias de color que
antes eran invisibles.

Los cuatro filtros de OPC comparten ese esquema y se diferencian en **el espacio
de color de partida** y en **si reproyectan o no** al espacio original.

### CRGB — decorrelación pura en RGB

`crgbEnhance`. Máxima separación cromática. El más agresivo.

1. Leer R, G, B como flotantes.
2. Media y covarianza 3 × 3 (sobre la zona seleccionada si la hay).
3. Eigendescomposición → matriz de eigenvectores `ev` y desvíos `stds`.
4. Proyectar cada píxel centrado a las componentes principales y dividir cada
   una por su desvío: todas las componentes quedan con varianza 1. Acá es donde
   las diferencias sutiles se igualan a las dominantes.
5. **Asignar cada componente directo a un canal de salida: PC1 → R, PC2 → G,
   PC3 → B.** No hay reproyección al espacio original.
6. Normalizar cada canal a 0–255 recortando a ±k desvíos, con
   `k = max(0.8 , 3.5 / intensidad)`.

Los colores resultantes **no son colores reales**: son una representación de
posición en el espacio de componentes principales. Rojo brillante en una salida
CRGB significa "valor alto en la componente de mayor varianza", no "pigmento
rojo". Es el filtro más útil para *ver* diferencias de pátina y el menos
adecuado para describir lo que se ve en términos de color.

### DS-LAB — decorrelación en CIE-LAB

`dsLabEnhance`. Idéntico a CRGB, salvo que los tres canales de entrada son L*,
a* y b* en lugar de R, G, B.

Como LAB es perceptualmente más uniforme, la covarianza refleja diferencias
*visuales* y no diferencias de codificación. En la práctica es el más útil con
pigmentos degradados o muy diluidos, donde la diferencia con el soporte es
perceptual pero mínima en RGB.

Igual que CRGB, las componentes se mapean directo a R, G, B: **la salida no está
en LAB**, y sus colores tampoco son colores reales.

### LDS — decorrelación con reproyección

`ldsEnhance`. La variante de aspecto más natural.

1–3. Igual que CRGB, sobre RGB.
4. Proyectar a componentes, normalizar por el desvío de cada una y reescalar
   todas al **desvío promedio** de las tres: se ecualizan las varianzas sin
   destruir la geometría del espacio.
5. **Reproyectar al espacio RGB original** con la traspuesta de la matriz de
   eigenvectores, y volver a sumar la media.
6. Normalizar cada canal por su mínimo y máximo.

El resultado conserva la relación aproximada con los colores originales: la roca
sigue pareciendo roca. Es el más apropiado cuando la imagen va a ilustrar una
publicación y se necesita que el lector reconozca lo que está mirando.

> ⚠️ **El control de intensidad no tiene efecto en LDS.** El factor de
> amplificación se cancela exactamente con la normalización por mínimo y máximo
> del paso 6. Ver [LIMITACIONES.md §3](LIMITACIONES.md#3-la-intensidad-no-tiene-efecto-en-lds).

### YBK — crominancia YCbCr

`ybkEnhance`. No usa componentes principales.

1. Convertir a YCbCr.
2. Media y desvío de Y, Cb y Cr (sobre la zona seleccionada si la hay).
3. Normalizar Cb y Cr por su desvío y amplificarlos por `3 × intensidad`,
   recentrando en 128.
4. Aplicar contraste a la luminancia por `1 + 0.6 · (intensidad − 1)`.
5. Volver a RGB, con recorte a 0–255.

Mucho más barato que una decorrelación y a veces suficiente: si el pigmento se
distingue del soporte por tono y no por brillo, amplificar la crominancia lo
saca a la luz sin la rotación completa. Al ser una transformación lineal fija,
el recorte a 0–255 puede saturar zonas ya coloridas.

---

## Pigmentos

Realce selectivo en CIE-LAB. A diferencia de la decorrelación —que es agnóstica
respecto de lo que hay en la imagen—, estos filtros aplican reglas explícitas
sobre qué es pigmento y qué es soporte. Esas reglas son heurísticas: funcionan
bien en el rango de casos para el que se las calibró y peor fuera de él.

### Rojo — `enhanceRedPigment`

Amplifica el eje a* (verde ↔ rojo) por la intensidad, el eje b* por
`1 + 0.3 · (intensidad − 1)`, y ajusta L* según el signo de a*: los píxeles con
a* > 0 se aclaran, el resto se oscurece. Separa ocres y hematita del soporte,
que en el NOA suele tener a* bajo pero no nulo.

Es el único filtro de pigmento que no calcula estadísticas: opera píxel a
píxel con factores fijos. Por eso ignora la selección de zona y el congelado del
lote.

### Blanco — `enhanceWhitePigment`

Calcula la media y el desvío de L* (sobre la zona seleccionada si la hay), y
para cada píxel obtiene su puntaje z. Los píxeles por encima de la media se
aclaran proporcionalmente a `z · intensidad · 5`; los que están por debajo se
oscurecen a `z · intensidad · 2`. Además desatura los píxeles claros
(`1 / (1 + 0.5 · (intensidad − 1))`), porque el pigmento blanco degradado tiende
a tomar el tinte del soporte.

Está orientado a **pigmento claro sobre soporte oscuro**, el caso inverso al que
optimizan la mayoría de las herramientas disponibles.

### Negro — `enhanceBlackPigment`

Clasifica cada píxel como "oscuro y poco cromático" si L* está por debajo de la
media y el croma √(a*² + b*²) es menor a 20. A esos los oscurece
proporcionalmente a su distancia a la media y les reduce el croma; al resto le
aplica un realce suave de luminancia y croma. Separa carbón y manganeso de las
sombras y de la roca oscura, que sí tiene croma.

### Bicromo — `enhanceBichrome`

Combina las dos reglas anteriores en una sola pasada, para paneles con pintura
roja y blanca simultáneas. Amplifica a* con un factor mayor (1.3 ×) cuando
a* > 5, detecta blancos como L* por encima de la media con croma menor a 25, y
oscurece los píxeles que no son ni una cosa ni la otra.

---

## Grabados

### Micro-relieve — `enhancePetroglyph`

El más complejo de la herramienta. Combina tres señales:

1. **Contraste local multi-escala.** Dos ventanas por imagen integral: una fina
   (`max(8, min(w,h)/40)`) que capta el surco, y una gruesa
   (`max(24, min(w,h)/10)`) que capta la forma. La desviación del píxel respecto
   de cada promedio local se amplifica (2.5 × y 1.2 × la intensidad) y se mezcla
   60/40 a favor de la fina.
2. **Bordes.** Sobel 3 × 3 sobre L*, normalizado por el máximo de la imagen y
   sumado con peso `0.25 × intensidad`.
3. **Expansión cromática.** El rango de a* y b* se toma de la zona seleccionada
   (o de toda la imagen) y cada píxel se aleja del centro de ese rango por
   `3 × intensidad`. Recupera la diferencia de pátina entre el surco fresco y la
   superficie expuesta.

La combinación busca separar la geometría del surco de la diferencia de pátina,
que son las dos señales que hacen legible un grabado.

### Relieve — `reliefMap`

Solo bordes: descarta el color. Sobel 3 × 3 y Sobel extendido 5 × 5 sobre la
luminancia Rec.601, mezclados 65/35. El resultado se normaliza por el máximo, se
amplifica por `1.2 × intensidad`, se le aplica una gamma de 0.7 para levantar
los bordes débiles, y se colorea en falso color cálido (R 1.05 ×, G 0.92 ×,
B 0.78 ×) para que se lea mejor que un gris plano.

Produce algo parecido a un calco digital: líneas claras sobre fondo oscuro.
Sirve para vectorizar después en un SIG o en un programa de dibujo.

---

## Técnico

### CLAHE — `claheEnhance`

*Contrast Limited Adaptive Histogram Equalization* (Zuiderveld 1994),
implementado completo:

1. Luminancia Rec.601.
2. Grilla de **8 × 8 tiles**.
3. Histograma de 256 bins por tile.
4. **Recorte del histograma** en `clip = (1 + 2 · intensidad) · n / 256`, y
   redistribución uniforme del exceso entre todos los bins. Esto es lo que
   impide que el ruido de las zonas planas se amplifique hasta dominar la
   imagen, y lo que distingue a CLAHE de la ecualización adaptativa a secas.
5. CDF de cada tile → función de mapeo.
6. **Interpolación bilineal** entre los mapeos de los cuatro tiles vecinos,
   según la posición del píxel respecto de los centros de tile. Sin esto se
   verían los bordes de la grilla.
7. El mapeo se aplica como **razón sobre los tres canales RGB**, no sobre la
   luminancia sola: preserva el tono. Los píxeles con luminancia menor a 0.5
   quedan sin tocar, para no amplificar el ruido del negro.

Es el filtro indicado cuando el problema es la iluminación —panel medio a la
sombra y medio al sol— y no el color.

### Mapa de pigmentos — `pigmentMapping`

Clasificación en cuatro categorías por umbrales fijos en LAB, y coloreado en
falso color:

| Condición | Categoría | Color |
|---|---|---|
| a* > 8 y croma > 12 | rojo | rojo → naranja |
| L* < media − 10 y croma < 15 | oscuro | verde |
| L* > 65 y croma < 18 | claro | cian |
| resto | soporte | gris (L* × 1.2) |

**Es exploratorio, no analítico.** Los umbrales son fijos y no se adaptan a la
iluminación, al balance de blancos ni al tipo de roca. Ver
[LIMITACIONES.md §2](LIMITACIONES.md#2-el-mapa-de-pigmentos-no-identifica-pigmentos).

---

## Ajustes posteriores

`applyPostAdjust(imageData, contraste, saturación)` — se aplica después del
filtro, sobre el resultado.

Reproduce exactamente los filtros CSS `contrast()` y `saturate()`, es decir la
matriz `feColorMatrix type="saturate"` con coeficientes Rec.709
(0.213 / 0.715 / 0.072):

```
k  = 1 + contraste/100          canal' = canal · k + 127.5·(1−k)
s  = 1 + saturación/100         salida = luma·(1−s) + s · canal'
```

En el lote **no** se usa `ctx.filter` para esto. Con fotos grandes el navegador
cae al render por software: minutos por foto —parece un cuelgue— y el pico de
memoria se duplica. Fue el motivo del arreglo de v3.2.1.

---

## Procesado por lote: estadísticas congeladas

El problema: si cada fotografía de un lote calcula sus propias estadísticas, dos
tomas del mismo panel con encuadres apenas distintos reciben matrices de
decorrelación distintas y salen con colores distintos. Al reconstruir la textura
en fotogrametría, las costuras entre fotos quedan visibles.

La solución es el parámetro `store` que llevan todos los filtros con
estadísticas:

- **Primera foto (la referencia).** `store.frozen` está vacío: el filtro calcula
  todo normalmente y guarda ahí la media, la matriz de eigenvectores, los
  desvíos y los recortes o rangos de normalización.
- **Resto del lote.** `store.frozen` existe: el filtro **no recalcula nada** y
  usa esos valores tal cual.

El resultado es que toda la serie comparte la misma transformación. La foto de
referencia sale idéntica a como saldría procesada sola; las demás salen distintas
de como saldrían sueltas, que es exactamente lo que se busca.

Qué se congela en cada filtro:

| Filtro | Valores congelados |
|---|---|
| CRGB, DS-LAB | media, eigenvectores, desvíos, recortes por percentil |
| LDS | media, eigenvectores, desvíos, rangos mín/máx por canal |
| YBK | medias y desvíos de Y, Cb, Cr |
| Blanco, Negro | media y desvío de L* |
| Bicromo, Mapa | media de L* |
| Micro-relieve | rango de a* y b* |
| Rojo, Relieve, CLAHE | nada — no dependen de estadísticas globales |

Cada archivo se guarda con el nombre del original y conserva **su propio**
EXIF/GPS, incluida la distancia focal que leen Metashape y Meshroom. El flujo
previsto es el estándar de reemplazo de texturas: alinear el modelo con las
fotografías originales y reconstruir la textura con las realzadas.

Las pruebas automáticas verifican que el congelado se aplica de verdad: que la
matriz no cambia a lo largo del lote, y que una foto procesada dentro del lote
sale distinta de la misma foto procesada suelta.

---

## Referencias

Gillespie, A. R., Kahle, A. B. y Walker, R. E. (1986). Color enhancement of
highly correlated images. II. Channel ratio and chromaticity transformation
techniques. *Remote Sensing of Environment*, 20(3), 209–235.
https://doi.org/10.1016/0034-4257(86)90044-1

Zuiderveld, K. (1994). Contrast Limited Adaptive Histogram Equalization. En
P. Heckbert (ed.), *Graphics Gems IV* (pp. 474–485). Academic Press.
