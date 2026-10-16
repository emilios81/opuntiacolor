# Changelog — OPC OpuntiaColor

Todas las versiones que cambian resultados están señaladas de forma explícita.
Las imágenes procesadas con versiones anteriores a un cambio así **no son
reproducibles** con la versión nueva: para comparar, hay que reprocesarlas.

## v3.7.3 (2026-10-15)

**No cambia ningún resultado** a resolución completa ni en 2000 px: dan
exactamente el mismo tamaño de trabajo que antes (prueba sobre 5000 tamaños
al azar). Las resoluciones intermedias son nuevas.

### Fotos grandes: se elige la resolución al abrirlas

- **El problema.** Con el panorama de 29 MP de La Sixtina (6222 × 4666) la
  página seguía sin responder en Chrome aun con el worker de v3.7.2. La única
  alternativa era bajar a 2000 px, que es demasiado: un tercio de cada lado.

- **El cambio.** Una foto de más de **16 MP** (medida con el tope de 8192 px)
  abre con un cartel que dice su tamaño y propone tres opciones:
  - **16 MP, recomendada**: conserva tres cuartos de cada lado.
  - **12 MP**: más rápida.
  - **Completa**.

  El foco queda en la recomendada. El cartel recuerda que la resolución cambia
  el resultado y que conviene anotarla al publicar.

- **Medido** con esa foto en una PC de escritorio. El filtro más lento
  (Blanco/Negro) tarda 8,5 s a 29 MP, 4,7 s a 16 MP y 3,6 s a 12 MP. El Rojo
  tarda 6,8 s a 29 MP, 4,0 s a 16 MP y 2,8 s a 12 MP.

- **En el panel**, la resolución de trabajo pasa a ser un menú desplegable con
  más escalones: completa, 16, 12 y 8 MP, y 2000 px. Solo se ofrecen los que
  achican la foto. Debajo se ve el tamaño que se procesa. Los escalones
  intermedios limitan los megapíxeles y no el lado, así que un panorama
  alargado no queda angosto.

- Fotos de hasta 16 MP (por ejemplo 4608 × 3456 o 4032 × 3024) abren como
  siempre, a resolución completa y sin cartel.

## v3.7.2 (2026-10-15)

**No cambia ningún resultado.** Los filtros son las mismas funciones; cambia
dónde corren.

### Los filtros corren en un hilo aparte

- **El problema.** La v3.7.1 evitó que mover la intensidad encadenara
  reprocesos, pero cada uno seguía corriendo en el hilo de la página. Con una
  foto de 29 MP (6222 × 4666, un panorama de La Sixtina) el Rojo tarda unos
  8 segundos, y en ese tiempo la página no se redibujaba ni tomaba clics:
  parecía colgada, y los botones de los otros filtros no respondían.

- **El cambio.** Los filtros corren en un **Web Worker** que carga el mismo
  `app.js`, así que el cálculo es idéntico. El worker también combina el
  resultado con la selección y codifica el PNG que se muestra. Con la foto de
  29 MP la página se congela una sola vez, menos de medio segundo, al leer los
  píxeles. Antes eran unos 9 segundos seguidos.

- **Un pedido nuevo cancela el anterior.** Si mientras procesa se elige otro
  filtro, otra intensidad u otra escala del Relieve, el cálculo en curso se
  corta y arranca el nuevo. Los botones de filtro ya no se deshabilitan
  mientras procesa. Al cambiar de foto, de resolución o de selección, un
  resultado que llegue tarde se descarta.

- **Plan B.** Si el navegador no permite el worker —por ejemplo, con
  `index.html` abierto como archivo local con `OpuntiaColor.bat`— el filtro
  corre en la página como hasta v3.7.1.

- **Verificado.** En el navegador, con la foto de 29 MP, el worker y el filtro
  corrido en la página dan los mismos bytes (Rojo con y sin selección, LDS y
  Bicromo), y el PNG que arma el worker tiene exactamente esos píxeles. Siete
  pruebas nuevas cargan `app.js` como worker y como página, y comprueban que
  los doce filtros dan lo mismo por los dos caminos, con y sin selección y con
  estadísticas congeladas, y que la cancelación y el plan B funcionan.

- **Queda pendiente.** El gotero cromático y el procesado por lote siguen
  corriendo en la página: con fotos grandes, ajustar el gotero todavía congela
  unos segundos.

## v3.7.1 (2026-10-15)

**No cambia ningún resultado.** Los doce filtros dan la misma salida que en
v3.7.0, byte a byte (comparado sobre una foto real, una imagen de ruido que
cubre todo el rango RGB y una roca sintética, con cuatro intensidades, con y
sin selección de zona, y el Relieve con y sin escala).

### La página se colgaba al mover la intensidad con fotos grandes

- **El problema.** Cada vez que el deslizador de intensidad se detenía un
  cuarto de segundo, se reprocesaba la foto entera. Con una foto de 20 MP el
  Rojo tarda unos 7 segundos con la página congelada, así que arrastrar de 1.5
  a 4.0 encadenaba media docena de reprocesos: más de medio minuto sin
  responder a los clics, y en algún caso la pestaña se caía.

- **El cambio.** La intensidad se aplica al **soltar** el deslizador (con el
  teclado, en cada paso). Mientras se arrastra solo se mueve el número. Los
  botones Sutil…Extremo siguen aplicando en el acto.

### Más rápido y con menos memoria

- **Conversión a LAB.** El paso de sRGB a lineal de cada canal se precalcula
  una vez para los 256 valores posibles en lugar de calcular tres potencias por
  píxel. Es la misma cuenta, así que da los mismos valores al último bit
  (verificado sobre los 16,7 millones de colores RGB). Con una foto de 20 MP
  la conversión pasa de 3,4 a 2,1 segundos, y la aprovechan todos los filtros
  que trabajan en LAB.

- **Bicromo y Mapa de pigmentos** guardaban un arreglo `[L, a, b]` por píxel,
  unos 80 bytes cada uno. Con una foto de 45 MP eso llenaba 3,6 de los 4,4 GB
  de memoria de JavaScript de la pestaña. Ahora van en tres `Float64Array`:
  24 bytes por píxel, mismos valores.

## v3.7.0 (2026-10-10)

Los tres cambios salen de la correspondencia con B. Gunn (ago–sep 2026), que
probó OPC sobre paneles australianos y lo comparó con DStretch.

### El filtro Rojo pasa a ser adaptativo

**⚠ Cambia los resultados del filtro Rojo.**

- **El problema.** El Rojo aplicaba una transformación fija en CIE-LAB:
  multiplicaba a* por la intensidad, b* por `1 + 0.3·(intensidad − 1)` y corría
  L* según el signo de a*, sin mirar la foto. Sobre una arenisca con manchas de
  hierro —rojiza toda ella— enrojecía la roca y el pigmento por igual. En el
  panel WLO-3 que mandó Gunn, los trazos que DStretch (crgb) mostraba con
  claridad no se separaban del soporte.

- **El cambio.** Ahora es un decorrelation stretch en el plano a*-b*. Se toman
  la media y la covarianza 2×2 de la foto (o de la zona seleccionada), sin los
  píxeles que caen fuera de las vallas de Tukey de cada eje. Los dos ejes
  principales se llevan a una dispersión común de `10 · intensidad` unidades LAB
  y se vuelve a a*, b*. Lo que se aparta hacia +a* se estira además 1.5 veces.
  El color medio de la roca queda gris; lo que se aparta de él, amplificado. L*
  no se toca.

- **Qué gana.** En el panel de Gunn los trazos se leen desde la intensidad por
  defecto, y con 3.0 quedan al nivel de DStretch crgb. En pinturas de La Tunita
  aparece rojo que el filtro anterior dejaba casi igual que la foto.

- **Qué cuesta.** En un panel sin rojo, el filtro amplifica el grano cromático
  de la roca, como cualquier decorrelación. El desvío de cada eje tiene un piso
  de 1.5 unidades LAB para que una roca casi gris no dispare el ruido de
  compresión.

- **Ahora usa la selección de zona y el congelado del lote**, como los filtros
  de decorrelación.

- **No hay mapeo que conserve el resultado anterior**: el cambio es el
  algoritmo. Para reproducir una imagen hecha con el Rojo de v3.6.0 hay que usar
  esa versión (DOI 10.5281/zenodo.22162329).

### Relieve con escala

**No cambia ningún resultado con los valores por defecto.**

- **El problema.** El Relieve era un mapa de bordes Sobel sin control de qué
  escalas entran: trata igual un grano de 2 mm que un surco picoteado de 4 cm.
  Además no resta el fondo, así que un cambio general de iluminación o de altura
  a lo ancho del panel corre la línea de base. Sirve para calcar pinturas; Gunn
  lo encontró inútil en petroglifos.

- **El cambio.** Con el Relieve activo aparece un control de escala: Bordes, 0.1,
  0.25, 0.5 y 1 % del lado mayor. En **Bordes** es el mapa de siempre, byte a
  byte el de v3.6.0, y hay una prueba que lo fija. Con una escala, la luminancia
  pasa por un pasabanda: primero se le resta la superficie cuadrática que mejor
  la ajusta (iluminación general, curvatura de conjunto) y después se resta a un
  suavizado de radio r otro de radio 16·r. La salida es gris: 128 es el nivel del
  entorno, y lo que tiene el tamaño elegido sale más claro o más oscuro.

- **La escala es lo más chico que se conserva**: todo lo menor se borra. Por eso
  el tope es 1 %. Se probó 2 % sobre las fotos de Gunn: en un panel de ~1 m
  borra todo lo menor de 2 cm, que es el ancho de los propios surcos, y queda
  una mancha borrosa sin nada que no se lea mejor con una escala menor.

- **La escala es relativa.** Se expresa en % del lado mayor y no en píxeles: la
  misma foto a 2000 px o a resolución completa da el mismo relieve, y el lote
  puede reducir las fotos sin cambiar lo que se ve.

- **Por qué la superficie cuadrática.** El promedio en caja recorta la ventana en
  los bordes de la foto, y ahí un gradiente de iluminación no se cancela. Sin ese
  paso, con escala 1 % una franja de un sexto del ancho quedaba afectada y la
  normalización de toda la imagen se corría. Con el paso, un gradiente de 60
  niveles cambia la salida en ~1 nivel.

- **El nombre del archivo registra la escala** (`_e0.25`) al lado de la
  intensidad. En Bordes se omite, así que el nombre sale igual que en v3.6.0.

- **Trabaja sobre el brillo, no sobre la altura.** Ver
  [LIMITACIONES §12](docs/LIMITACIONES.md#12-el-relieve-mide-brillo-no-altura).

### Mapa de pigmentos: hipótesis, no identificación

**No cambia ningún resultado.**

- La descripción del filtro dice ahora «Falso color por firma cromática /
  hipótesis, no identificación». Con el mapa activo, el panel explica el límite
  —el ocre y los óxidos de hierro del soporte caen en la misma zona de color— y
  propone un control: mirar cómo sale una zona de roca sin pintura.

### Pruebas

- 15 pruebas nuevas, 68 en total. **Rojo:** que separe el ocre de una arenisca
  ferruginosa sintética; que lleve la roca a gris con tres dominantes distintas;
  que la tarjeta de color no cambie la roca (sin las vallas de Tukey la cambia
  ~14 niveles); que no toque L*; la selección; el lote; el checksum de la salida
  por defecto. **Relieve:** que Bordes reproduzca los checksums de v3.6.0; el
  promedio en caja contra un cálculo por fuerza bruta; la superficie cuadrática;
  un gradiente de iluminación junto a los bordes; que más escala despegue mejor
  un motivo del grano; que la escala sea relativa a la resolución; el lote; el
  checksum con escala. Corridas contra el Rojo de v3.6.0, fallan 6 de las 7 del
  Rojo.

## v3.6.0 (2026-08-29)

### La resolución de trabajo por defecto pasa a ser la completa

**⚠ Cambia los resultados con los valores por defecto.**

- **El problema.** La aplicación abría cada foto reducida a 2000 px en el lado
  mayor, y la resolución completa había que pedirla con un botón. Quien no
  reparaba en ese botón analizaba, ajustaba y exportaba en baja resolución sin
  enterarse: el resultado se ve bien en pantalla y el archivo sale con el mismo
  nombre y los mismos metadatos que uno hecho en resolución completa.

- **El cambio.** Al cargar una foto se trabaja con su resolución real, hasta el
  tope de 8192 px que ya existía.

- **El control subió a la cabecera del panel izquierdo**, antes de la lista de
  filtros, en lugar de estar al final entre los datos del archivo, donde pasaba
  inadvertido. Muestra las **dos opciones juntas** —completa o 2000 px— para que
  se vea que hay una elección y cuál está activa, y debajo el tamaño en píxeles
  que se va a procesar. Mientras se trabaja reducido, el recuadro y esa cifra
  quedan en rojo. Está arriba porque es una decisión que se toma **antes** de
  elegir filtro. La elección persiste al cargar la foto siguiente: es una
  decisión sobre la máquina, no sobre la foto. Cambiarla descarta el resultado
  procesado y la selección activa, porque sus coordenadas son las de la
  resolución anterior.

- **Qué cambia en los resultados.** Micro-relieve, Relieve y CLAHE dependen de
  vecindarios definidos en píxeles o en fracción de la imagen, así que a otra
  escala captan estructuras distintas; las diferencias pueden ser grandes. Los
  filtros de decorrelación y de pigmento son por píxel y sus estadísticas apenas
  se mueven, pero el remuestreo previo altera algo los valores. **Una imagen
  procesada con v3.5.0 en el modo por defecto no es comparable con una de v3.6.0
  sin reprocesarla.**

- **Por qué acá no hay mapeo que deje el default byte-idéntico.** En el cambio
  anterior que tocaba resultados —la intensidad de LDS en v3.4.0— el parámetro se
  eligió de modo que el valor por defecto reprodujera exactamente la versión
  previa. Acá eso no es posible: el cambio *es* el valor por defecto. Para
  reproducir el comportamiento de v3.5.0 hay que bajar explícitamente a 2000 px.

- **Documentación.** Se actualizaron `README.md`, `docs/PARAMETROS.md`,
  `docs/LIMITACIONES.md` y `docs/INSTALACION.md`. El criterio práctico quedó
  invertido: antes era «explorar en 2000 px, exportar en completa»; ahora es
  trabajar en completa y bajar solo si la máquina se arrastra.

### Correcciones de la propia v3.6.0

- **Cambiar la resolución ya no deja el filtro marcado.** Al bajar o subir la
  resolución se descarta el resultado procesado, pero el filtro seguía resaltado
  en rojo en la lista mientras el visor decía «Seleccioná un filtro»: la pantalla
  afirmaba dos cosas contradictorias. Ahora el filtro activo se apaga junto con
  el resultado.

- **La leyenda del control decía «la resolución real de la foto» siempre.** Con
  una foto de más de 8192 px en el lado mayor eso era falso, porque ese es el
  tope de trabajo. Ahora en ese caso dice «tope de 8192 px» y muestra el tamaño
  original entre paréntesis.

- **La prueba de versión mira los ocho lugares que la declaran**, no tres. En el
  bump a v3.6.0 se olvidaron el título del README y el bloque «Cómo citar», y la
  suite no lo detectó porque solo comparaba `src/app.jsx`, `index.html` y
  `package.json`. Ahora incluye también README (título y cita), `CITATION.cff`,
  `.zenodo.json` y los tres puntos visibles de `src/app.jsx`.

- **README con resumen en inglés** y `.zenodo.json` con un resumen en inglés en
  la descripción del registro: quien llega buscando la herramienta en inglés no
  tiene por qué leer en español para saber qué hace.

### Interfaz bilingüe español / inglés

**No cambia ningún resultado.**

- Toda la interfaz —nombres y descripciones de los 12 filtros, controles, textos
  de ayuda, tooltips, modal de procesado por lote y panel de novedades— está
  disponible en español y en inglés. El motivo: colegas de habla inglesa no
  llegaban a saber para qué servía cada filtro.

- Un botón en la cabecera cambia de idioma en cualquier momento. La elección se
  guarda en `localStorage`; en la primera visita se toma del idioma del
  navegador, de modo que quien abre la herramienta en inglés la ve en inglés sin
  tener que buscar nada. El atributo `lang` del documento acompaña el cambio.

- **El español sigue siendo la fuente.** La traducción se resuelve con un helper
  `tr(es, en)` que recibe el texto español y su versión inglesa juntos, en el
  mismo lugar del código. Si falta la traducción se muestra el español, así que
  agregar un texto nuevo no puede dejar un hueco en blanco en la interfaz.

- **Los nombres de archivo exportados no cambian.** Se arman con el identificador
  interno del filtro (`lds`, `red`, `petro`…), no con la etiqueta visible: un
  archivo exportado desde la interfaz en inglés es indistinguible de uno
  exportado desde la interfaz en español, y el material ya publicado sigue siendo
  citable igual.

## v3.5.0 (2026)

### LDS deja de virar a violeta: normalización robusta con ganancia común

- **El problema.** El último paso de LDS —pasar los valores reproyectados a
  0–255— tomaba el **mínimo y el máximo absolutos de cada canal**. De ahí salían
  dos defectos encadenados:

  1. *Un solo píxel extremo definía el rango.* El blanqueo amplifica la
     componente principal más chica —la cromática, con σ de 1 a 6 frente a 40 o
     60 de la primera—, así que cualquier valor extremo queda disparado. Con una
     tarjeta de color, una mano o un brillo especular en el encuadre, esos
     píxeles fijaban el mínimo y el máximo y **toda la superficie rupestre
     quedaba comprimida en una fracción de la escala**. En una escena sintética
     tipo foto de campo, la roca ocupaba el 20% del rango: unos 54 niveles de
     los 255 disponibles.

  2. *Estirar cada canal por separado destruye el tono.* Cada canal recibía una
     ganancia y un corrimiento distintos, de modo que la relación entre canales
     no se conservaba. Una roca marrón (R > G > B) salía **azul violácea**
     (B > G > R). Es el "todo violeta" que se veía en las fotos de campo, y es
     exactamente lo contrario de lo que LDS promete: reproyectar al espacio
     original para conservar un aspecto natural.

  Conviene ser preciso sobre el alcance del defecto: como la normalización es
  lineal, **la relación contraste/ruido del motivo no cambiaba**. No se perdía
  información en sentido estricto; se desperdiciaba el rango de 8 bits y se
  falseaba el color.

- **La corrección.** El rango ahora sale de las **vallas de Tukey**
  (`Q1 − 3·IQR`, `Q3 + 3·IQR`), que no se mueven por más extremo que sea un
  objeto del encuadre, y la salida se arma con una ganancia `s` y un
  desplazamiento `o` **comunes a los tres canales**:

  ```
  salida_c  =  (componente_c − media_c) · s  +  media_c + o
  ```

  `s` es la mayor ganancia para la que existe un desplazamiento que meta las
  vallas dentro de 0–255, y `o` reparte el margen sobrante entre las dos puntas.
  Al ser comunes, las diferencias entre canales se escalan por igual y **el
  orden de los canales no puede invertirse**. Los cuartiles se calculan con un
  histograma de 4096 bins, en una pasada, sin ordenar la imagen.

- **Cambia los resultados de LDS.** Las imágenes procesadas con v3.4.0 o
  anteriores **no son reproducibles** con esta versión: para compararlas hay que
  reprocesarlas. Los demás filtros no se tocaron.

- **Qué se ve distinto.** Con la tarjeta de color en el encuadre, la roca
  conserva su tono y aproximadamente el doble de contraste. En imágenes sin
  valores extremos, en cambio, el resultado puede verse **algo menos contrastado
  que antes**: la ganancia común está limitada por el canal más exigente, que es
  el precio de conservar el tono. Los controles de contraste y saturación
  compensan lo que haga falta.

- **Lo que esto no arregla.** La media, la covarianza y los eigenvectores se
  siguen calculando sobre toda la imagen. Una tarjeta de color grande dentro del
  cuadro sigue inclinando la decorrelación misma, no solo la normalización. Para
  eso está la **selección de zona**: con una selección activa, las estadísticas
  se calculan solo ahí. Sigue siendo la mejor práctica encuadrar el panel sin la
  tarjeta, o seleccionar la zona de roca antes de aplicar el filtro.

### Gotero cromático: realzar o atenuar una familia de color

- Después de aplicar un filtro, se toca un color del resultado y se lo **realza o
  se lo atenúa**, sin tocar el resto de la escena. Responde a una situación
  concreta del trabajo con decorrelación: el filtro separa bien, pero el verde o
  el violeta que aparecen ocupan medio panel y tapan justamente el color en el
  que se lee el motivo.

- **Cómo funciona.** La muestra se toma promediando un entorno de 5×5 sobre el
  resultado del filtro, para que el grano de la roca no defina la familia de
  color. La pertenencia se mide por distancia euclídea en el plano de
  crominancia Cb-Cr:

  ```
  peso = 1                        si  d ≤ tolerancia
       = smoothstep decreciente   si  tolerancia < d < tolerancia·(1+suavizado)
       = 0                        si  d ≥ tolerancia·(1+suavizado)
  ```

  y la crominancia se multiplica por `1 + (ganancia/100)·peso`. Con ganancia
  +100 el color llega a triplicarse; con −100 queda exactamente en gris. El
  suavizado evita el borde duro que delataría la selección como un recorte.

- **No toca la luminancia.** La operación es solo sobre crominancia, y el realce
  **se frena en el límite del gamut**: ningún canal se sale de 0–255, así que no
  hay zonas quemadas y el relieve y la textura de la roca quedan intactos. Hay
  una prueba automática que lo verifica píxel por píxel.

- **Por qué Cb-Cr y no CIE-LAB.** Por velocidad: la conversión es lineal y corre
  en unos 30 ms sobre 3 Mpx, contra unos 2800 ms del ida y vuelta a LAB, que
  volvería inusables los deslizadores. Sobre una imagen ya decorrelacionada
  —falso color por definición— la uniformidad perceptual de LAB no aporta nada.

- **Se acumula, y es reversible.** Cada ajuste se **fija** como una capa más y el
  gotero queda libre para el color siguiente, que se muestrea ya sobre el
  resultado acumulado. Los ajustes fijados se listan numerados en el panel y
  **cualquiera se puede quitar de a uno**, sin afectar a los demás.

  Esto funciona porque un ajuste fijado se guarda como una **regla** —color,
  tolerancia, suavizado, ganancia— y no como una imagen: la vista se recalcula
  siempre desde el resultado original del filtro, aplicando la cadena completa.
  Quitar un ajuste del medio devuelve exactamente la imagen que habría dado no
  haberlo aplicado nunca, sin copias intermedias ni pérdida acumulada por
  redondeo. Hay una prueba automática que lo verifica byte a byte.

  El orden de la cadena importa cuando dos ajustes se superponen —el primero
  cambia el color que el segundo encuentra—, y por eso la lista se muestra
  numerada.

- **Dónde se aplica.** En la vista previa, en la descarga y en el lote, siempre
  después del filtro y antes de los ajustes de contraste y saturación. El nombre
  del archivo descargado registra la cadena completa
  (`_gotero_g-80t25_g+60t15`). El panel informa qué porcentaje de la imagen
  alcanza el ajuste en curso.

- **Salvedad metodológica.** La selección se hace sobre una imagen **ya
  transformada**: la máscara describe el color que produjo el filtro, no la
  composición del pigmento. Ver
  [LIMITACIONES.md §11](docs/LIMITACIONES.md#11-el-gotero-selecciona-color-no-pigmento).

### Zoom y encuadre en el visor

- **Ampliar para mirar de cerca.** El visor pasa a tener zoom hasta 1600 %:
  rueda del mouse —que amplía sobre el punto donde está el cursor, no sobre el
  centro—, botones `−` y `+`, y una lupa que muestra el aumento y devuelve la
  imagen al encuadre completo. La mano (✋) permite correr la imagen
  arrastrándola; también responde al botón del medio del mouse sin activarla.
  La imagen no puede despegarse de los bordes del visor.

- **Pasado 300 % se muestran los píxeles reales.** El suavizado con el que el
  navegador agranda una imagen inventa detalle que no está en la foto, y sobre
  un panel rupestre eso se confunde con textura o con un trazo fino. A partir de
  3× el visor pasa a mostrar los píxeles tal cual son.

- **Lo que se toca es lo que se procesa.** El deslizador de comparación, el
  gotero y las herramientas de selección siguen cayendo exactamente donde uno
  los pone, con la imagen ampliada o corrida: la línea de comparación queda
  clavada en la pantalla y las coordenadas se traducen deshaciendo el encuadre.
  De paso se corrigió un desfase viejo de 1 px —se medía contra el rectángulo
  externo del visor, que incluye el borde, y no contra la caja de contenido—,
  que sin zoom pasaba inadvertido pero se multiplicaba por el aumento.

- **No cambia ningún resultado.** Es una herramienta de observación: no toca el
  procesamiento ni lo que se exporta. Las imágenes procesadas con v3.5.0 son las
  mismas con o sin esta función.

### Pruebas

- La batería pasa de 42 a 53 pruebas. Nuevas: que una roca marrón no salga
  violácea, que las vallas de Tukey no se muevan con un 1% de píxeles extremos,
  que la tarjeta de color en el encuadre no aplaste el contraste de la roca, seis
  del gotero —incluida la de que la luminancia no cambia— y cinco de la cadena de
  ajustes acumulados, entre ellas la de que quitar un ajuste del medio equivale a
  no haberlo aplicado nunca.
- El checksum que fijaba la salida por defecto de LDS se refijó en el valor de
  v3.5.0.

---

## v3.4.0 (2026)

### La intensidad de LDS pasa a ser el exponente de blanqueo

- **El control de intensidad ahora funciona en LDS.** Hasta v3.3.0 no tenía
  ningún efecto: las tres componentes principales se multiplicaban por
  `2 × intensidad`, un factor **común** a las tres, que se cancelaba exactamente
  contra la normalización por mínimo y máximo del final. No era un error de
  redondeo sino una identidad algebraica —la salida era idéntica byte a byte con
  intensidad 0.2 y con 5.0.

  En vez de un factor de escala, la intensidad es ahora el **exponente γ** al que
  se eleva la equalización de varianzas:

  ```
  componente_k  ←  componente_k · (σ̄ / σ_k)^γ        con  γ = intensidad / 1.5
  ```

  γ = 0 deja la transformación en la identidad, γ = 1 ecualiza por completo las
  varianzas (blanqueo ZCA) y γ > 1 sobre-blanquea. Como el exponente cambia la
  *forma* de la transformación y no su escala, no puede cancelarse. Topeado en
  γ = 2, que se alcanza en intensidad 3.0.

  Los pasos de proyección y reproyección juntos equivalen a aplicar `Σ^(−γ/2)` a
  los datos centrados: es un blanqueo ZCA parcial, con todo el rango intermedio
  bien definido.

### No cambia ningún resultado ya publicado

- **Con el valor por defecto (intensidad 1.5) γ vale exactamente 1**, que es la
  equalización completa que hacía v3.3.0. La salida es **idéntica byte a byte**,
  verificado en cinco imágenes, en modo lote con estadísticas congeladas y con
  zona seleccionada.
- Y como hasta v3.3.0 el control no hacía nada, **toda salida LDS existente *es*
  la salida por defecto**. Ninguna imagen ya publicada con LDS queda invalidada,
  cualquiera haya sido la intensidad con la que se generó.
- Hay una prueba automática que fija el checksum exacto de esa salida.

### Para qué sirve

Bajar la intensidad a 0.5 – 1.0 (γ ≈ 0.33 – 0.67) aplica una decorrelación
parcial: la roca conserva más su color real y el realce es más suave. Es la forma
de **verificar si un motivo sigue estando con menos estiramiento** — si aparece
solo a intensidad alta, conviene tratarlo como hipótesis. Hasta v3.3.0 esa
comprobación no se podía hacer, porque el filtro siempre aplicaba el máximo.

### Salvedades

- El extremo bajo **no devuelve la foto original**: la normalización por mínimo y
  máximo de cada canal se sigue aplicando, así que el piso es "la original con
  auto-niveles".
- La decorrelación efectiva crece hasta γ ≈ 1.3 y después vuelve a bajar: el
  sobre-blanqueo reintroduce correlación con la estructura invertida.
- "Intensidad 2.0" significa cosas distintas en cada filtro y **no es comparable
  entre ellos**. Al reportar parámetros hay que consignar el filtro.

Detalle en [docs/LIMITACIONES.md §3](docs/LIMITACIONES.md#3-el-rango-de-intensidad-de-lds-no-llega-a-la-foto-original)
y [docs/PARAMETROS.md](docs/PARAMETROS.md#lds-la-intensidad-es-el-exponente-de-blanqueo).

---

## v3.3.0 (2026)

> **Nota de publicación (4 de agosto de 2026).** La subida original de v3.3.0
> quedó incompleta y el sitio publicado estuvo en blanco entre el 28 de julio y
> el 4 de agosto. Se subió `app.js` ya compilado pero no `src/app.jsx`, que
> siguió en v3.2 sin la corrección de Jacobi; y un commit posterior sobreescribió
> `app.js` con el código fuente JSX **sin compilar**. Como `index.html` carga
> `app.js` como script plano y sin Babel, el navegador no podía parsearlo y la
> página no mostraba nada.
>
> Ya está corregido: `src/app.jsx` contiene la fuente de v3.3.0 y `app.js` es su
> compilado, idéntico byte a byte al que se había publicado el 28 de julio. **La
> aplicación en sí no cambió: los resultados de v3.3.0 son los mismos.** Se
> agregaron además los archivos que este changelog ya anunciaba y que no se
> habían subido (`docs/` y `tests/`), incluida una prueba automática que compara
> `app.js` con el resultado de compilar `src/app.jsx` para que el desfase no
> pueda repetirse.

### Corrección científica — cambia los resultados

- **Rotación de Jacobi corregida** — La eigendecomposición actualizaba las
  columnas de la matriz en una copia auxiliar, pero solo volcaba de vuelta las
  filas *p* y *q*. Las filas restantes quedaban con sus columnas *p*,*q* sin
  actualizar: la matriz perdía la simetría durante la iteración y el resultado
  convergía a eigenvalores incorrectos. En una covarianza típica de fotografía
  de panel el error era grande —λ₂ podía salir sobrevaluada varias veces y λ₃
  colapsaba prácticamente a cero—, justo en las componentes de baja varianza
  que el decorrelation stretch busca amplificar.

  Los eigenvalores ahora coinciden con los de una implementación de referencia
  (`numpy.linalg.eigh`) hasta la precisión de máquina, y hay una prueba
  automática que lo verifica contra valores calculados de forma independiente.

  **Afecta a CRGB, DS-LAB y LDS.** Las imágenes generadas con v3.0 a v3.2.1
  difieren de las que produce esta versión. Si hay material publicado o en
  preparación con las versiones anteriores, hay que reprocesarlo.

### Documentación y empaquetado

- `docs/ALGORITMOS.md` — descripción completa de cada filtro, paso a paso.
- `docs/PARAMETROS.md` — rangos, valores por defecto y efecto de cada parámetro.
- `docs/INSTALACION.md` — requisitos, formas de uso y compilación.
- `docs/LIMITACIONES.md` — límites metodológicos, técnicos y de reproducibilidad.
- `tests/` — pruebas automáticas del núcleo de procesamiento, sin dependencias
  (`node tests/run-tests.js`): conversiones de color, eigendecomposición contra
  valores de referencia, determinismo, comportamiento de la máscara de
  selección, congelado de estadísticas del lote y correspondencia entre
  `src/app.jsx` y `app.js`.
- `CITATION.cff` — GitHub muestra cómo citar la herramienta.
- `LICENSE` — texto completo de la GPL v3 (antes había solo el aviso de
  copyright) y encabezado de licencia en el código fuente.
- `THIRD-PARTY-NOTICES.md` — atribución de React, Babel y las tipografías
  incluidas en `lib/`, como exigen sus licencias.
- `package.json` y `.zenodo.json` — metadatos de versión, dependencias y
  depósito.

### Problemas conocidos

- **La intensidad no tiene efecto en LDS.** El factor de amplificación se
  cancela exactamente con la normalización por mínimo y máximo posterior. Sin
  resolver: la corrección exige decidir qué debería controlar ese parámetro en
  un filtro que reproyecta al espacio original.
  *Resuelto en v3.4.0: la intensidad pasó a ser el exponente de blanqueo.*

---

## v3.2 (2026)

### Procesado por lote para fotogrametría
- **Botón "Procesar lote"** — Ajustá el filtro (o cadena de filtros con Acumular) en una foto de referencia y aplicalo automáticamente a todas las fotos del lote fotogramétrico.
- **Matriz congelada** — Las estadísticas de los filtros (matriz de decorrelación, medias, desvíos, rangos de normalización) se capturan de la foto de referencia y se aplican **idénticas** a todo el lote. Sin esto, cada foto recalcularía sus propias estadísticas y la textura del modelo 3D quedaría inconsistente entre fotos. Si había una selección de zona activa, la matriz proviene de esa zona (como la matriz guardada de DStretch).
- **Mismo nombre de archivo** — Cada foto procesada se guarda con el nombre del original (en la carpeta destino que elijas), para el flujo estándar de reemplazo de texturas: alinear el modelo con los originales y reconstruir la textura con las realzadas.
- **EXIF por foto** — En formato JPG, cada foto del lote conserva su propio EXIF/GPS (distancia focal para Metashape/Meshroom, coordenadas, fecha).
- **Carpeta destino** — Con la File System Access API (Chrome/Edge) elegís dónde guardar; en navegadores sin soporte las fotos se descargan una por una. Todo sigue siendo 100% local.
- **Opciones de lote** — Formato (JPG recomendado / PNG / TIFF), resolución máxima (completa 8192 / 4000 / 2000 px), barra de progreso, cancelación y reporte de errores por archivo.
- **Ajustes post incluidos** — El contraste y la saturación aplicados a la referencia también se aplican al lote.

### Correcciones (v3.2.1)
- **Cuelgue del lote con contraste/saturación** — Con ajustes post activos, el lote creaba un segundo canvas a resolución completa por foto y aplicaba `ctx.filter` (CSS), que con fotos grandes cae al render por software: minutos por foto y el doble de memoria. Ahora el ajuste se aplica por píxel (matriz exacta de los filtros CSS `contrast()`/`saturate()`), sin canvas extra.
- **Memoria en lotes largos** — Se reutiliza un único canvas de trabajo para todo el lote (antes se creaba uno por foto sin liberar su memoria) y se libera al terminar.

---

## v3.1 (2026)

### Corrección científica
- **Componentes principales ordenados** — La eigendecomposición Jacobi ahora ordena los eigenvectores por eigenvalor descendente. Antes la asignación PC→canal RGB era arbitraria: la misma escena podía dar colores distintos en fotos distintas. Ahora CRGB y DS-LAB son reproducibles y comparables entre imágenes.
- **Estadísticas por zona de selección** — Con una selección activa, los filtros estadísticos (CRGB, DS-LAB, LDS, YBK, Blanco, Negro, Bicromo, Mapa de pigmentos, Micro-relieve) calculan media/covarianza/decorrelación solo con los píxeles de esa zona, como DStretch. Mejor separación de pigmentos locales.
- **CLAHE real** — El filtro CLAHE ahora implementa el algoritmo de Zuiderveld (1994): histogramas por tile 8×8 con clip limit e interpolación bilineal. Antes era un realce de contraste local por normalización estadística.

### Rendimiento
- **Micro-relieve con imagen integral** — Los promedios de vecindario usan summed-area tables (O(1) por píxel). En imágenes grandes pasa de minutos a menos de un segundo.
- **Máscara de mano alzada rasterizada con canvas** — Reemplaza el point-in-polygon por píxel.
- **Precompilado** — `app.js` se genera con `node build.js`; el navegador ya no compila JSX en cada arranque (arranque instantáneo, −2.8 MB).

### Correcciones
- **Modo Acumular + intensidad** — Mover el slider de intensidad con Acumular activo ya no reaplica el filtro sobre sí mismo sin control.
- **TIFF válido según spec 6.0** — BitsPerSample como array [8,8,8], X/YResolution como RATIONAL, ResolutionUnit agregado.
- **RAW eliminado de la interfaz** — El navegador no puede decodificar RAW; la promesa era falsa (los archivos se rechazaban en silencio). La UI ahora indica convertir a JPG/PNG antes.
- **Procesamiento con setTimeout** — requestAnimationFrame se pausaba si la pestaña perdía visibilidad y el filtro quedaba colgado.

### Nuevas funciones
- **Resolución completa opcional** — Toggle para procesar hasta 8192px en lugar del límite de 2000px (para publicación/archivo).
- **Exportación reproducible** — El nombre del archivo registra filtro, intensidad y ajustes post (`_OPC_crgb_i1.8_c10.png`); el JPG exportado conserva el EXIF/GPS original.
- **100% offline** — React, ReactDOM y las fuentes se cargan desde `lib/`; no se necesita internet nunca.

---

## v3.0 (2025)

### Filtros
- **CRGB reescrito** — Nuevo algoritmo de mapeo directo de componentes principales a canales RGB sin reproyección. Produce separación cromática máxima, ideal para revelar diferencias de pátina en petroglifos y grabados.
- **YBK reescrito** — Ecualización estadística de crominancia YCbCr (3× más agresiva). Normaliza por desviación estándar global antes de amplificar. Azules profundos y amarillos saturados.
- **LDS reescrito** — Ecualización de eigenvalues con reproyección al espacio RGB original. Separación cromática fuerte manteniendo colores naturales.
- **DS-LAB reescrito** — Decorrelación en espacio CIE-LAB con mapeo directo de PCs a RGB. Máxima sensibilidad a diferencias perceptuales de pigmento.
- **Micro-relieve** — Renombrado de "Petroglifo" para evitar confusión con la categoría.

### Selección de zona
- Tres herramientas: rectángulo, círculo y mano alzada
- Los filtros se aplican solo dentro de la zona seleccionada
- Máscara visual con oscurecimiento exterior y borde punteado
- Cada nueva selección reemplaza automáticamente la anterior
- Corrección de mapeo de coordenadas para objectFit contain

### Interfaz
- Filtros en lista única sin categorías (antes divididos en Pinturas/Grabados/Técnico)
- Descripción de uso visible debajo de cada filtro
- Eliminado subtítulo del header
- Eliminada toda mención a DStretch

### Exportación
- Soporte de exportación en PNG, JPG y TIFF
- Encoder TIFF sin comprimir integrado (RGB 8-bit)
- Aceptación de archivos RAW (DNG, CR2, CR3, NEF, ARW, ORF, RW2)

---

## v2.5 (2025)

### Filtros nuevos
- **CRGB** — Decorrelation stretch puro en espacio RGB
- **DS-LAB** — Decorrelation stretch en espacio CIE-LAB
- **Relieve** — Mapa de bordes multi-escala (Sobel 3×3 + 5×5) con falso color cálido

### Controles
- Intensidad ampliada: rango 0.2 – 5.0 (antes 0.5 – 3.0)
- 5 presets de intensidad: Sutil, Suave, Medio, Fuerte, Extremo
- Controles de contraste (-80 a +80) y saturación (-100 a +100) post-procesamiento
- Modo Acumular (filter stacking): encadenar filtros sobre el resultado anterior

---

## v2.0 (2025)

### Base
- 9 filtros: Rojo, Blanco, Negro, Bicromo, Petroglifo, YBK, LDS, CLAHE, Mapa de Pigmentos
- Slider comparativo original / procesada
- Extracción automática de EXIF/GPS
- Modo Solar para uso en campo
- Logo personalizado en zona de carga
- Procesamiento 100% local (sin servidor)

---

## v1.0 (2024)

- Versión inicial
- Filtros básicos de realce de pigmentos
- Interfaz mínima
