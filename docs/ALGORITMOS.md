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
- [Ajustes posteriores](#ajustes-posteriores) — contraste, saturación, gotero cromático
- [Procesado por lote](#procesado-por-lote-estadísticas-congeladas)
- [Registro de sesión](#registro-de-sesión) — huellas y reproducción (v3.8.0)

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
4. Proyectar a componentes y **ecualizar parcialmente las varianzas**, con la
   intensidad como exponente:

   ```
   componente_k  ←  componente_k · (σ̄ / σ_k)^γ      con  γ = intensidad / 1.5
   ```

   γ = 0 deja la transformación en la identidad, γ = 1 ecualiza por completo las
   varianzas, γ > 1 sobre-blanquea. Topeado en γ = 2.
5. **Reproyectar al espacio RGB original** con la traspuesta de la matriz de
   eigenvectores, y volver a sumar la media.
6. Normalizar con **vallas de Tukey y ganancia común** (ver abajo).

El resultado conserva la relación aproximada con los colores originales: la roca
sigue pareciendo roca. Es el más apropiado cuando la imagen va a ilustrar una
publicación y se necesita que el lector reconozca lo que está mirando.

Los pasos 4 y 5 juntos son exactamente un **blanqueo ZCA parcial**: como
`Σ = V diag(σ²) Vᵀ`, la transformación completa equivale a aplicar `Σ^(−γ/2)` a
los datos centrados. Por eso γ = 0 devuelve la identidad y γ = 1 el blanqueo
completo, con todo el rango intermedio bien definido.

#### La normalización del paso 6

Hasta v3.4.0 el paso 6 era, literalmente, estirar cada canal entre su mínimo y su
máximo absolutos. Desde v3.5.0:

1. Para cada canal se calculan las **vallas de Tukey** sobre los valores
   reproyectados:

   ```
   valla_baja = Q1 − 3·IQR        valla_alta = Q3 + 3·IQR
   ```

   Los cuartiles salen de un histograma de 4096 bins, en una sola pasada. A
   diferencia del mínimo y el máximo, **no se mueven** aunque una parte del
   encuadre sea un valor extremo: una tarjeta de color, una mano, un brillo
   especular.

2. La salida se arma con una ganancia `s` y un desplazamiento `o` **comunes a los
   tres canales**:

   ```
   salida_c  =  (componente_c − media_c) · s  +  media_c + o
   ```

   `s` es la mayor ganancia para la que existe un `o` que meta las vallas de los
   tres canales dentro de 0–255 —se resuelve por bisección, 60 iteraciones—, y
   `o` reparte el margen sobrante entre las dos puntas. Lo que queda fuera de las
   vallas se recorta.

Que la ganancia y el desplazamiento sean **comunes** es lo que conserva el tono:
las diferencias entre canales se escalan por igual, así que el orden de los
canales no puede invertirse. Con normalización por canal, una roca marrón
(R > G > B) podía salir azul violácea (B > G > R), que es exactamente lo que
pasaba en fotos de campo con la tarjeta de color en el cuadro.

Lo que esta corrección **no** arregla: la media, la covarianza y los
eigenvectores se siguen calculando sobre toda la imagen (o sobre la zona
seleccionada, si la hay). Un objeto saturado grande dentro del cuadro inclina la
decorrelación misma, no solo la normalización. La respuesta a eso es la selección
de zona, no la normalización.

> **Cambiado en v3.5.0.** El paso 6 pasó de mínimo/máximo por canal a vallas de
> Tukey con ganancia y desplazamiento comunes. **Los resultados de LDS cambian**
> respecto de v3.4.0 y anteriores: para comparar con material ya procesado hay
> que reprocesarlo. En imágenes sin valores extremos el resultado puede verse
> algo menos contrastado que antes —la ganancia común está limitada por el canal
> más exigente—, que es el precio de conservar el tono.

> **Cambiado en v3.4.0.** Hasta v3.3.0 el paso 4 multiplicaba las tres
> componentes por `2 × intensidad`, un factor **común** a las tres. Ese factor se
> cancelaba exactamente contra la normalización por mínimo y máximo del paso 6
> —es una identidad algebraica, no un redondeo—, así que el control de intensidad
> no tenía ningún efecto. El exponente cambia la forma de la transformación y no
> puede cancelarse. Con el valor por defecto (1.5) γ vale 1 y **la salida es
> idéntica byte a byte a la de v3.3.0**, de modo que ninguna imagen ya publicada
> con LDS queda invalidada. Salvedades en
> [LIMITACIONES.md §3](LIMITACIONES.md#3-el-rango-de-intensidad-de-lds-no-llega-a-la-foto-original).

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

Desde v3.7.0 es la excepción del grupo: no aplica una regla fija sino un
decorrelation stretch en el plano cromático a*-b* de CIE-LAB, calculado con los
colores de la propia foto.

1. Media `(μa, μb)` y covarianza 2 × 2 de a* y b* sobre la zona seleccionada (o
   la imagen completa), **sin los píxeles que caen fuera de las vallas de Tukey**
   (k = 3) de cada eje. Así la tarjeta de color o una mano no entran en la
   estimación del color de la roca.
2. Ejes principales de esa covarianza, en forma cerrada:
   `θ = ½ · atan2(2·s_ab, s_aa − s_bb)` y desvíos `σ₁, σ₂` con un piso de
   1.5 unidades LAB (`RED_PISO`).
3. Cada píxel se centra en la media, se proyecta sobre los dos ejes, cada
   componente se escala a `10 · intensidad / σₖ` (`RED_SIGMA`) y se vuelve a los
   ejes a*, b*. Si el resultado tiene a* > 0 —más rojo que la roca— se
   multiplica por 1.5 (`RED_ENFASIS`).
4. L* queda como estaba y se vuelve a RGB.

El primer eje sigue la variación dominante del soporte (en una arenisca
ferruginosa, del ocre claro al naranja); el segundo, su perpendicular, que es
donde suele quedar el pigmento. Al igualar las dos dispersiones, el pigmento
gana contra el soporte, y al centrar en la media el color de la roca queda gris
sea cual sea su dominante.

Hasta v3.6.0 el filtro multiplicaba a* por la intensidad, b* por
`1 + 0.3 · (intensidad − 1)` y corría L* según el signo de a*, sin estadísticas.
Sobre un soporte rojizo enrojecía roca y pigmento por igual.

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
Sirve para vectorizar después en un SIG o en un programa de dibujo. Es lo que
hace el filtro con la escala en *Bordes*, la opción por defecto.

#### Con escala — `reliefEscala` (v3.7.0)

Con una escala `e` (en % del lado mayor `M`) el filtro pasa a ser un pasabanda
sobre la luminancia Rec.601, al modo del *Local Relief Model* que se usa con
modelos de elevación:

1. **Tendencia.** Se resta la superficie cuadrática
   `c₀ + c₁u + c₂v + c₃u² + c₄uv + c₅v²` (u, v ∈ [−1, 1]) que mejor ajusta la
   luminancia por mínimos cuadrados (`quitarTendencia`). Los momentos son
   separables, así que el ajuste cuesta tres sumas por píxel y un sistema de
   6 × 6.
2. **Pasabanda.** `D = S(r) − S(16·r)`, con `r = max(1, round(M · e / 200))` y
   `S(ρ)` tres pasadas de promedio en caja de radio ρ (`boxBlur`, separable,
   ventana recortada en los bordes), equivalentes a una gaussiana de σ ≈ ρ.
3. **Normalización.** Con los cuartiles de D sobre la zona seleccionada (o la
   imagen completa): centro `(Q1 + Q3)/2` y desvío robusto `(Q3 − Q1)/1.349`.
   Salida gris: `128 + (D − centro)/desvío · 40 · intensidad/1.5`.

El primer suavizado borra lo menor que la escala; restar el segundo saca el
fondo. El paso 1 hace falta por los bordes: ahí la ventana del promedio queda
recortada, el entorno se corre hacia el interior y un gradiente de iluminación
no se cancela. Sin él, con escala 1 % una franja de un sexto del ancho
quedaba afectada. En el interior no cambia nada, porque el pasabanda ya anulaba
ahí cualquier cuadrática.

Memoria: cuatro arreglos `Float32` del tamaño de la imagen (16 B/px), menos que
los filtros de decorrelación.

#### Opciones del Relieve con escala (v3.8.0)

Todas apagadas por defecto; apagadas, el cálculo es exactamente el de arriba
(el pasabanda se separó en `relieveBanda` sin cambiar el orden de las
operaciones).

- **Doble.** Se calculan dos pasabandas: `Dₜ` con la escala elegida y `Dₒ`
  con `4·e` (`RELIEF_OBJETO`). Cada uno se lleva a desvíos de su entorno con
  su centro y su desvío robusto, se suman con el peso `p` del objeto,
  `D = (1 − p)·zₜ + p·zₒ`, y la suma se vuelve a normalizar con sus cuartiles
  antes del paso 3. Con `p = 0` o `p = 1` da una escala sola, salvo el
  redondeo. Memoria: tres arreglos más.
- **Compresión suave.** En el paso 3, en vez de `128 + x` (con
  `x = (D − centro)/desvío · 40 · intensidad/1.5`, recortado a 0–255) la
  salida es `128 + A · asinh(x/K)`, con `K = 40` (`RELIEF_SUAVE_K`) y
  `A = 127 / asinh(3 · 127/K)` (`RELIEF_SUAVE_TOPE = 3`): la curva llega al
  blanco o al negro donde la recta llegaba a tres veces el rango. La pendiente
  en el centro es `A/K ≈ 1,08`.
- **CLAHE.** `claheEnhance` con intensidad 1.5 sobre la salida gris, que queda
  gris porque CLAHE escala los tres canales por igual.
- **Mezcla.** Se aplica `dsLabEnhance` o `ldsEnhance` a la foto (intensidad
  1.5, misma máscara). Para cada píxel, en CIE-LAB:
  `L = (1 − α)·L_color + α·L_relieve` y `a, b` del filtro de color.
  `L_relieve` es la luminosidad del gris del relieve (tabla de 256 valores).

En el lote, las estadísticas congeladas llevan las de los dos niveles
(`textura`, `objeto`), el centro y el desvío de la suma, y las del filtro de
color (`color`).

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

Sigue las fórmulas de los filtros CSS `contrast()` y `saturate()`, es decir la
matriz `feColorMatrix type="saturate"` con coeficientes Rec.709
(0.213 / 0.715 / 0.072):

```
k  = 1 + contraste/100          canal' = canal · k + 127.5·(1−k)
s  = 1 + saturación/100         salida = luma·(1−s) + s · canal'
```

En el lote **no** se usa `ctx.filter` para esto. Con fotos grandes el navegador
cae al render por software: minutos por foto —parece un cuelgue— y el pico de
memoria se duplica. Fue el motivo del arreglo de v3.2.1.

La descarga suelta, en cambio, sí usa el filtro del navegador. Los dos caminos no
dan exactamente lo mismo: el navegador recorta a 0–255 entre el contraste y la
saturación, y `applyPostAdjust` aplica las dos fórmulas seguidas, sin recortar
en el medio. Con un solo ajuste la diferencia es de 1 nivel, por redondeo. Con
contraste positivo y saturación juntos llega a 26–31 niveles (medido en v3.8.0,
Chrome 152). El registro de sesión anota cuál de los dos se usó.

### Gotero cromático — `chromaTarget`

`chromaTarget(imageData, muestra, tolerancia, suavizado, ganancia)`. Realza o
atenúa una familia de color del resultado, sin tocar el resto de la escena. Se
aplica **después del filtro y antes** del contraste y la saturación.

1. La muestra se toma promediando un entorno de 5×5 sobre el resultado del
   filtro, para que el grano de la roca no defina la familia de color.
2. Cada píxel se pasa a YCbCr y se mide su distancia euclídea a la crominancia
   muestreada:

   ```
   d = √((Cb − Cb₀)² + (Cr − Cr₀)²)

   peso = 1                        si  d ≤ tolerancia
        = 1 − u²(3 − 2u)           si  tolerancia < d < tolerancia·(1+suavizado)
        = 0                        si  d ≥ tolerancia·(1+suavizado)

   con u = (d − tolerancia) / (tolerancia·suavizado)
   ```

3. La crominancia se multiplica por `f = 1 + (ganancia/100)·peso`, con la
   ganancia positiva escalada ×2: +100 llega a triplicar el color, −100 lo deja
   exactamente en gris.
4. **Tope de gamut.** Si `f > 1`, se recorta al mayor valor que mantiene los tres
   canales dentro de 0–255. Como el color original ya está en gamut, el tope
   nunca baja de 1 y la atenuación no se ve afectada.
5. Se vuelve a RGB con la luminancia original.

La luminancia queda intacta por construcción, y el tope de gamut evita que el
recorte a 0–255 la mueva por la puerta de atrás. El relieve y la textura de la
roca no se alteran: solo cambia cuánto color tiene cada píxel.

Se eligió el plano Cb-Cr y no CIE-LAB por velocidad: la conversión es lineal y
corre en unos 30 ms sobre 3 Mpx, contra unos 2800 ms del ida y vuelta a LAB, que
volvería inusables los deslizadores. Sobre una imagen ya decorrelacionada —falso
color por definición— la uniformidad perceptual de LAB no aporta nada.

La función devuelve además la **cobertura**: la suma de los pesos dividida por la
cantidad de píxeles, o sea qué porción de la imagen alcanza la selección. Se
muestra en el panel para que quede registrada junto con los demás parámetros.

#### Cadena de ajustes — `applyPickChain`

`applyPickChain(imageData, fijados, enCurso)`. Los ajustes se acumulan: se fija
uno, se muestrea el color siguiente sobre el resultado acumulado, y así.

Cada ajuste fijado se guarda como una **regla** `{r, g, b, tolerancia,
suavizado, ganancia}`, no como una imagen. La vista se recalcula siempre desde el
resultado del filtro aplicando la cadena entera, en orden, con el ajuste en curso
—el que se está regulando con los deslizadores— al final.

De ahí salen dos propiedades:

- **Quitar un ajuste del medio revierte exactamente su efecto.** No hay copias
  intermedias que deshacer ni pérdida acumulada por redondeo: la cadena sin ese
  ajuste da byte a byte lo mismo que si nunca se hubiera aplicado.
- **El orden importa cuando dos ajustes se superponen**, porque el primero cambia
  el color que el segundo encuentra. Por eso la lista del panel va numerada.

El muestreo del color siguiente se hace sobre la imagen con los ajustes fijados
ya aplicados —lo que el usuario está viendo—, no sobre el resultado crudo del
filtro.

Salvedad metodológica en
[LIMITACIONES.md §11](LIMITACIONES.md#11-el-gotero-selecciona-color-no-pigmento).

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
| Rojo | media de a* y b*, ejes principales y desvíos del plano a*-b* |
| Relieve con escala | centro y desvío robusto del pasabanda |
| Relieve en Bordes, CLAHE | nada — no dependen de estadísticas globales |

Cada archivo se guarda con el nombre del original y conserva **su propio**
EXIF/GPS, incluida la distancia focal que leen Metashape y Meshroom. El flujo
previsto es el estándar de reemplazo de texturas: alinear el modelo con las
fotografías originales y reconstruir la textura con las realzadas.

Las pruebas automáticas verifican que el congelado se aplica de verdad: que la
matriz no cambia a lo largo del lote, y que una foto procesada dentro del lote
sale distinta de la misma foto procesada suelta.

---

## Registro de sesión

Desde v3.8.0, cada imagen exportada lleva adentro un registro de sesión. Los
campos y los formatos están en
[PARAMETROS.md](PARAMETROS.md#registro-de-sesión). Acá va lo que hace falta
saber para confiar en una reproducción.

**Huellas.** `sha256Hex` implementa SHA-256 según FIPS 180-4. Las pruebas lo
comparan con los vectores de la norma y con el de Node en todos los largos de 0
a 300 bytes, que cubren los dos casos de relleno. Cuando el navegador tiene el
suyo (`crypto.subtle`, solo en contextos seguros), se usa ese, que es más
rápido. La huella de los píxeles se calcula sobre RGB de 8 bits, fila por fila,
sin el alfa: `pixelesRGB`.

**Reproducción.** Fuera del lote, cada filtro se **recalcula** desde la foto
con la zona de su paso, igual que la primera vez. Si la foto y los parámetros
son los mismos, las estadísticas salen iguales al último bit. No se usan las
guardadas, que quedan como documentación. En el lote, en cambio, cada foto se
rehace con las estadísticas **congeladas** del registro, que es como se hizo:
salieron de la foto de referencia, no de esa foto. Las estadísticas pasan por
JSON sin perder nada. Hay una prueba con los doce filtros, con y sin selección.

**Por qué puede no salir igual.** El filtro es determinista. Lo que puede
cambiar es la entrada, por cómo decodifica cada navegador el JPG o cómo reduce
la foto cuando no se trabaja a resolución completa. Por eso el registro guarda
también la huella de los píxeles de entrada: si esa ya no coincide, la
diferencia está antes del filtro.

Incluso en un mismo navegador hay dos maneras de leer la foto. El lote usa
`createImageBitmap` y la vista un `<img>`, y Chrome decodifica distinto el mismo
JPG por cada camino: hay diferencias de 1 nivel en alrededor del 0,5 % de los
valores. Por eso un registro del lote se rehace leyendo la foto con
`createImageBitmap`, y uno de la vista con un `<img>`.

**Escala métrica.** `pxPorMM` mide la distancia entre los dos puntos en
píxeles de una imagen de ancho w y alto h, con el ancho y el alto por separado,
√((Δx·w)² + (Δy·h)²), y la divide por los milímetros. Como los puntos están en
fracción de la imagen, la misma calibración da los píxeles por milímetro de la
foto original y los de la resolución de trabajo. No interviene en ningún filtro.

**Informe en PDF.** `informePDF` arma el informe con un escritor de PDF 1.4
propio (`armarPDF`), sin bibliotecas. Usa las fuentes estándar del formato,
que todo lector de PDF trae y no hace falta incrustar, con la codificación
WinAnsi: los acentos del castellano entran, y los signos que no existen en
ella (≈, →) se cambian por equivalentes. Los renglones se cortan con los
anchos de letra de Helvetica publicados por Adobe. Las imágenes van en JPEG,
tal como las da el navegador (filtro DCTDecode), sin volver a comprimirlas.
No interviene en el procesamiento.

---

## Modo elevación (v3.9.0)

Un DEM es una grilla de alturas `z` en coma flotante. Nada pasa por el canvas.

1. **Celdas con dato** (`celdasValidas`): ni NaN, ni infinitas, ni el valor de
   la etiqueta `GDAL_NODATA`, ni fuera de ±10³⁰ (los programas usan ±3.4·10³⁸,
   el mayor Float32).
2. **Tendencia** (`quitarTendenciaValidas`): la cuadrática
   `c₀ + c₁u + c₂v + c₃u² + c₄uv + c₅v²` se ajusta por mínimos cuadrados solo
   con las celdas con dato. Con huecos los momentos ya no son separables, así
   que las ecuaciones normales (6 × 6) se arman celda por celda.
3. **Suavizado con huecos** (`suavizarConHuecos`): convolución normalizada,
   `S(z) = K * (z·v) / K * v`, con `v` la máscara de celdas con dato y `K` las
   tres pasadas de promedio en caja de radio ρ (`boxBlur`). Junto a un hueco
   el promedio usa solo celdas con dato; donde no queda ninguna en el alcance
   da NaN. Es lo que hace TVT con los huecos de sus nubes de puntos.
4. **Pasabanda** (`bandaDEM`): `D = S(r) − S(16·r)`, con
   `r = max(1, round(escala_mm / (2 · celda_mm)))`.
5. **Vista** (`relieveDEM`): igual que el paso 3 del Relieve sobre fotos, con
   los cuartiles de las celdas con dato (y de la zona, si la hay); las opciones
   doble, suave y CLAHE son las mismas. Las celdas sin dato salen negras.
6. **Residuo** (`residuoDEM`): `D` por los milímetros que mide una unidad
   vertical (`VerticalUnitsGeoKey`, o la lineal, o metros), sin normalizar;
   «sin dato» = −9999.

**Celda en mm.** De `ModelPixelScale` o de la matriz `ModelTransformation`, por
los mm de la unidad lineal (`ProjLinearUnitsGeoKey`: 9001 metro, 9002 pie…).
Si la clave falta, se suponen metros. Con `GTModelTypeGeoKey` = 2 (grados):
`111 320 · cos(lat)` m por grado en x y 110 574 m en y, en la latitud del centro.

**Sombreado** (`sombreadoDEM`): normal por diferencias centrales y luz desde el
noroeste a 45°, `L = (−½, ½, √½)`; `v = 30 + 225 · max(0, n·L)`.

**Por qué el residuo es menor que la profundidad.** El fondo `S(16·r)` abarca
también parte del surco, así que queda algo más bajo que la roca alrededor, y
el residuo, algo menor que la profundidad real. En el DEM de prueba, un surco
de 2 mm de hondo y 6,5 mm de ancho da −1,7 mm con escala 2 mm. Es un relieve
local, no una cota. Por la misma razón, junto a un surco hondo queda un borde
algo positivo.

**GeoTIFF de salida** (`tiffConEtiquetas`): TIFF sin comprimir, una tira,
*little-endian*, con las etiquetas 33550, 33922, 34264, 34735, 34736 y 34737
copiadas del DEM, y 42113 (`GDAL_NODATA`) en el residuo.

---

## Referencias

Gillespie, A. R., Kahle, A. B. y Walker, R. E. (1986). Color enhancement of
highly correlated images. II. Channel ratio and chromaticity transformation
techniques. *Remote Sensing of Environment*, 20(3), 209–235.
https://doi.org/10.1016/0034-4257(86)90044-1

Zuiderveld, K. (1994). Contrast Limited Adaptive Histogram Equalization. En
P. Heckbert (ed.), *Graphics Gems IV* (pp. 474–485). Academic Press.
