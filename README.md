# OPC – OpuntiaColor v4.0.0

**Herramienta de código abierto para el realce digital de pigmentos y grabados en arte rupestre.**

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21796290.svg)](https://doi.org/10.5281/zenodo.21796290)
[![Licencia: GPL v3](https://img.shields.io/badge/licencia-GPLv3-blue.svg)](LICENSE)

OPC (OpuntiaColor) es una aplicación web para el análisis y la documentación de
arte rupestre. Aplica decorrelation stretching, realce selectivo de pigmentos y
detección de micro-relieve sobre fotografías de campo, directamente en el
navegador y **sin conexión a internet**: todas las librerías y tipografías están
incluidas en el repositorio.

Las imágenes **no se transmiten a ningún servidor**. Todo el procesamiento
ocurre en la computadora de quien la usa.

🔗 **Usar ahora:** https://emilios81.github.io/opuntiacolor/

---

## In English

**OPC – OpuntiaColor** is an open-source web tool for the digital enhancement of
pigments and engravings in rock art. It applies decorrelation stretching (in RGB
and CIE-LAB), selective pigment enhancement, contrast-limited adaptive histogram
equalization and micro-relief detection to field photographs — entirely **in the
browser and offline**. Images are never uploaded to any server.

**The interface is available in English.** Use the language button in the top bar,
or just open the tool in an English-language browser and it starts in English.

🔗 **Use it now:** https://emilios81.github.io/opuntiacolor/

The documentation below and the code comments are in Spanish. The in-app *Info*
panel explains, in English too, what each version changed — including which ones
change processing results.

---

## Documentación

| | |
|---|---|
| [Instalación y requisitos](docs/INSTALACION.md) | Cómo usarla online, sin conexión o compilarla |
| [Algoritmos](docs/ALGORITMOS.md) | Qué hace exactamente cada filtro, paso a paso |
| [Parámetros](docs/PARAMETROS.md) | Rangos, valores por defecto y efecto de cada control |
| [Limitaciones conocidas](docs/LIMITACIONES.md) | Qué puede y qué no puede afirmarse con estos resultados |
| [Historial de cambios](CHANGELOG.md) | Versiones, y cuáles de ellas cambian resultados |
| [Pruebas](tests/README.md) | Verificación automática del núcleo de procesamiento |

---

## Uso rápido

1. Abrir https://emilios81.github.io/opuntiacolor/ (o `index.html` si se
   descargó el repositorio; en Windows, `OpuntiaColor.bat`)
2. Arrastrar una fotografía
3. Elegir un filtro
4. Ajustar intensidad, contraste y saturación
5. Opcionalmente, delimitar una zona de interés con las herramientas de selección
6. Descargar el resultado

---

## Filtros

**Decorrelación**

- **CRGB** — Decorrelation stretch en RGB con mapeo directo de componentes
  principales a canales de salida. Separación cromática máxima; revela
  diferencias de pátina.
- **DS-LAB** — Decorrelación en CIE-LAB, sensible a diferencias perceptuales de
  pigmento. El más útil con pigmentos degradados.
- **LDS** — Decorrelación con reproyección al espacio original: colores más
  naturales. La intensidad regula cuánta decorrelación se aplica, de parcial a
  completa, lo que permite verificar un motivo con menos realce. Desde v3.5.0 la
  normalización usa vallas de Tukey y una ganancia común a los tres canales, de
  modo que el tono de la roca se conserva aunque haya una tarjeta de color o un
  brillo en el encuadre.
- **YBK** — Amplificación de crominancia YCbCr con ecualización estadística.

**Pigmentos** — Rojo, Blanco, Negro y Bicromo: realce selectivo en CIE-LAB. El
Rojo se adapta a cada foto desde v3.7.0: estima el color de la roca (o de la zona
seleccionada) con una decorrelación en el plano a*-b*, lo lleva a gris y amplifica
lo que se aparta de él, con prioridad para lo más rojo que la roca. El
filtro de blancos está orientado a pigmentos claros sobre soporte oscuro, el
caso inverso al que optimizan la mayoría de las herramientas disponibles.

**Grabados** — Micro-relieve (contraste local multi-escala con imagen integral
más detección de bordes Sobel) y Relieve. El Relieve tiene un control de escala
(v3.7.0): en *Bordes* es el mapa de bordes multi-escala de siempre, para calcar;
con una escala, conserva solo las estructuras de ese tamaño y resta el fondo
(iluminación despareja, pendiente general de la roca), pensado para grabados.
Desde v3.8.0, *Más opciones* agrega el Relieve doble (objeto y textura), la
compresión suave de los extremos, el realce con CLAHE y la mezcla con DS-LAB o
LDS ([detalle](docs/PARAMETROS.md#más-opciones-v380)).

**Técnico** — CLAHE (Zuiderveld 1994) y Mapa de pigmentos (clasificación por
falso color por firma cromática: es una hipótesis, no una identificación; ver
las limitaciones antes de usarlo).

## Herramientas

- **Selección de zona** — rectángulo, círculo o mano alzada. Las estadísticas del
  filtro se calculan solo con los píxeles seleccionados y se aplican a toda la
  imagen, como en DStretch.
- **Gotero cromático** — tocar un color del resultado y realzarlo o atenuarlo sin
  tocar el resto de la escena. Actúa solo sobre la crominancia: el relieve y la
  textura quedan intactos. Sirve para bajar el color que tapa el panel y para
  subir aquel en el que se lee el motivo.
- **Modo Acumular** — encadenar filtros sobre el resultado anterior.
- **Slider comparativo** — original / procesada.
- **Zoom y encuadre** — rueda del mouse para ampliar sobre el cursor, botones
  `−` / `+`, lupa para volver a ajustar a la ventana y mano para correr el
  encuadre. Llega a 1600 %; pasado 300 % se muestran los píxeles reales, sin
  interpolar. El deslizador de comparación, el gotero y la selección siguen
  cayendo donde uno los pone, con la imagen ampliada o corrida.
- **Interfaz bilingüe** — español e inglés; el botón de la cabecera cambia de
  idioma y la elección queda guardada. En la primera visita se toma la del
  navegador.
- **Modo Solar** — interfaz de alto contraste para trabajo de campo bajo luz directa.
- **Resolución completa** — es el modo por defecto, hasta 8192 px. Una foto de más
  de 16 MP abre con un cartel que propone trabajarla a 16 MP (recomendada), 12 MP
  o completa; desde el panel también se puede elegir 8 MP o 2000 px.

## Procesado por lote para fotogrametría

Se ajusta el filtro sobre una fotografía de referencia y se aplica a todo el
lote con las **estadísticas congeladas** de esa referencia: la matriz de
decorrelación, las medias, los desvíos y los rangos de normalización se calculan
una sola vez y se reutilizan sin recalcular. Sin esto, cada foto calcularía sus
propias estadísticas y la textura del modelo 3D quedaría incoherente entre
tomas.

Cada archivo se guarda con el nombre del original y conserva su propio EXIF/GPS
—incluida la distancia focal que leen Metashape y Meshroom—, para el flujo
estándar de reemplazo de texturas: alinear el modelo con las fotografías
originales y reconstruir la textura con las realzadas.

## Modelos de elevación (DEM)

Desde v3.9.0, OPC abre un **DEM en GeoTIFF**, como los que exporta Metashape:
alturas en coma flotante, que nunca pasan a 8 bits. Se ve sombreado, como una
foto con luz rasante, y el **Relieve trabaja sobre las alturas**, con la escala
en milímetros que da el tamaño de la celda. Los huecos sin dato no contaminan
el resultado (convolución normalizada). La descarga trae, además de la imagen,
la imagen **georreferenciada** y el **residuo en mm** como GeoTIFF Float32, para
medir en QGIS u otro SIG ([detalle](docs/PARAMETROS.md#modo-elevación-dem)).
Las escalas se adaptan a la celda, así que sirve tanto para un panel
fotografiado de cerca (milímetros) como para un DEM de dron (centímetros y
metros). Se verificó con DEM de Metashape de vuelos de dron; falta uno de cerca,
de un panel con grabados
([limitaciones](docs/LIMITACIONES.md#14-el-modo-elevación-falta-probarlo-con-un-dem-real)).

## Series multi-luz

Desde v4.0.0, OPC abre **varias fotos del mismo panel** sacadas con la cámara
quieta y la luz desde distintos lados: se arrastran juntas o se eligen con
«Serie multi-luz». Si en el encuadre hay una **esfera brillante**, se la marca
con un círculo y OPC saca de su brillo la dirección de cada luz, como en la
captura de RTI. Con eso calcula, punto por punto, hacia dónde mira la superficie
(**estéreo fotométrico**): salen el **albedo**, que es el color sin las sombras,
y las alturas, sobre las que va el Relieve. Lo hundido sale oscuro venga de
donde venga la luz, y la pintura no se confunde con el relieve. Los filtros de
color trabajan sobre el albedo. Sin esfera, se **promedian las luces**. La
descarga trae además el albedo y el mapa de normales
([cómo sacar la serie y detalle](docs/PARAMETROS.md#modo-multi-luz)). Se probó
con series inventadas; falta una real
([limitaciones](docs/LIMITACIONES.md#15-el-modo-multi-luz-falta-probarlo-con-una-serie-real)).

## Entrada y salida

| | |
|---|---|
| **Entrada** | JPG, PNG, WebP (RAW no: el navegador no puede decodificarlo) |
| **Salida** | PNG, JPG (conserva EXIF/GPS), TIFF sin comprimir (spec 6.0) |

El nombre del archivo exportado registra el filtro, la intensidad y los ajustes
aplicados (`IMG_0421_OPC_crgb_i1.8_c10.png`); si se usó el gotero, también su
ganancia y su tolerancia (`_gotero+60t20`).

Desde v3.8.0 cada imagen lleva además, adentro, un **registro de sesión**. Con
`+JSON`, ese registro también baja aparte como `.json`. Anota la versión de OPC, la foto de
entrada con su huella SHA-256, la resolución de trabajo, la cadena de filtros,
la zona, el gotero y los ajustes. El lote agrega un `.csv` con una fila por
foto. Con la foto original cargada, **Reproducir un registro** rehace la imagen
y comprueba que salga igual píxel a píxel
([detalle](docs/PARAMETROS.md#registro-de-sesión)).

Si la foto tiene una escala métrica a la vista, **Calibrar con la regla**
permite marcar dos puntos sobre ella, con una lupa, y decir cuánto mide el
tramo. El registro guarda cuántos píxeles mide un milímetro, el Relieve muestra
su escala también en mm y el visor dibuja una barra de escala
([detalle](docs/PARAMETROS.md#escala-métrica)).

Con `+PDF` baja también un **informe en PDF** para leer, imprimir o adjuntar:
el original y el resultado lado a lado, el procedimiento, la escala y las
huellas, con cómo reproducirlo y cómo citar OPC
([detalle](docs/PARAMETROS.md#informe-en-pdf)). Con `+JSON` o `+PDF`, todo
baja junto en un `.zip` que trae adentro una carpeta con el nombre de la
imagen; con los dos apagados, solo la imagen
([detalle](docs/PARAMETROS.md#qué-baja-y-dónde)).

---

## Reproducibilidad

- **Sin componentes aleatorios.** La misma imagen, el mismo filtro y los mismos
  parámetros producen siempre el mismo archivo, en cualquier navegador.
- **Componentes principales ordenadas por varianza**, de modo que dos
  fotografías del mismo panel reciban la misma asignación de componente a canal.
  Sin ese ordenamiento los colores no serían comparables entre imágenes.
- **Eigendecomposición verificada** contra una implementación de referencia,
  con pruebas automáticas.
- **Compilación determinista.** `app.js` se genera desde `src/app.jsx` con
  `node build.js` y el resultado es idéntico byte a byte, lo que permite
  comprobar que el archivo compilado corresponde al código publicado.
- **Procedimiento registrado** en el nombre del archivo exportado y, desde
  v3.8.0, completo en el registro de sesión que va dentro de cada imagen. Ese
  registro se puede reproducir y comprobar píxel a píxel.

Los límites de todo esto están documentados sin adornos en
[docs/LIMITACIONES.md](docs/LIMITACIONES.md), incluido lo que todavía falta.

---

## Verificar la instalación

```bash
node tests/run-tests.js
```

No requiere dependencias ni imágenes: los casos de prueba son sintéticos y
deterministas. Ver [tests/README.md](tests/README.md).

---

## Estructura del proyecto

```
index.html              Página principal (carga app.js precompilado)
app.js                  Aplicación compilada — NO editar a mano
src/app.jsx             Código fuente (editar acá)
build.js                Compila src/app.jsx → app.js  (node build.js)
lib/                    React, Babel, geotiff.js y tipografías incluidas localmente
tests/                  Pruebas automáticas del núcleo de procesamiento
docs/                   Documentación técnica
OpuntiaColor.bat        Acceso directo para Windows
```

## Tecnología

React 18 con JSX precompilado, y procesamiento de imagen píxel a píxel en
JavaScript puro: eigendecomposición de Jacobi con ordenamiento por eigenvalor,
summed-area tables para el contraste local, conversiones RGB ↔ CIE-LAB ↔ YCbCr,
parser y reinyector EXIF/GPS propios y encoder TIFF integrado. Sin dependencias
en tiempo de ejecución más allá de React, y de geotiff.js para leer los modelos
de elevación (v3.9.0), que se carga solo al abrir uno.

---

## Contexto académico

OPC se desarrolla en el **Laboratorio de Tecnologías Digitales Aplicadas a la
Arqueología (LATDAA)**, dentro de un programa de herramientas de código abierto
para la investigación y documentación del patrimonio arqueológico del Noroeste
Argentino.

Implementa técnicas de amplio uso en el estudio de arte rupestre: decorrelation
stretching (Gillespie, Kahle y Walker 1986), ecualización adaptativa de
histograma con límite de contraste (Zuiderveld 1994) y realce selectivo de
pigmentos en espacios de color perceptuales.

### Reconocimiento

El decorrelation stretching fue difundido en el estudio del arte rupestre por
**DStretch** (Jon Harman, [dstretch.com](https://www.dstretch.com)), herramienta
de referencia en la disciplina desde hace dos décadas. OPC es una
**implementación independiente y de código abierto**, escrita desde cero a
partir de la bibliografía publicada; no utiliza ni deriva código de DStretch.

Los nombres de algunos realces (CRGB, LDS, YBK) siguen la nomenclatura de
espacios de color ya incorporada al vocabulario de la disciplina, para facilitar
la comparación entre herramientas. **Las implementaciones son distintas y los
resultados no son equivalentes.**

---

## Cómo citar

Villafañez, E. A. (2026). *OPC – OpuntiaColor: herramienta de código abierto
para el realce digital de pigmentos y grabados en arte rupestre* (v4.0.0)
[Software]. LATDAA, Universidad Nacional de Catamarca.
https://doi.org/10.5281/zenodo.21796290

Cada versión queda archivada en Zenodo con su propio DOI. El de arriba es el
**DOI concepto**: siempre resuelve a la última versión, y es el que conviene
citar salvo que se quiera referir a una versión concreta. Los de las versiones
concretas son [10.5281/zenodo.21796291](https://doi.org/10.5281/zenodo.21796291)
para v3.4.0, [10.5281/zenodo.22145678](https://doi.org/10.5281/zenodo.22145678)
para v3.5.0, [10.5281/zenodo.22162329](https://doi.org/10.5281/zenodo.22162329)
para v3.6.0, [10.5281/zenodo.23283507](https://doi.org/10.5281/zenodo.23283507)
para v3.7.0, [10.5281/zenodo.24052932](https://doi.org/10.5281/zenodo.24052932)
para v3.9.0 (incluye la v3.8.0) y
[10.5281/zenodo.24061925](https://doi.org/10.5281/zenodo.24061925) para v4.0.0.

El archivo [CITATION.cff](CITATION.cff) permite que GitHub genere la cita en
distintos formatos desde el botón *Cite this repository*.

En una publicación conviene consignar además **la versión utilizada, el filtro,
la intensidad y la resolución de trabajo**: son los datos necesarios para que
otra persona reproduzca la imagen.

---

## Contribuir

Reportes de error, sugerencias y aportes de código son bienvenidos. Ver
[CONTRIBUTING.md](CONTRIBUTING.md).

## Autor

**Dr. Emilio A. Villafañez**
LATDAA (Laboratorio de Tecnologías Digitales Aplicadas a la Arqueología) ·
Escuela de Arqueología, Universidad Nacional de Catamarca (UNCa) ·
Fundación de Historia Natural Félix de Azara · CONICET

## Licencia

Copyright (C) 2025-2026 Emilio A. Villafañez

Este programa es software libre: puede redistribuirse y modificarse bajo los
términos de la **GNU General Public License v3.0** o posterior, publicada por la
Free Software Foundation. Se distribuye con la esperanza de que sea útil, pero
**sin ninguna garantía**. Ver [LICENSE](LICENSE) para el texto completo.

La GPL obliga a que cualquier obra derivada se distribuya también como software
libre: OPC no puede convertirse en un producto cerrado.

Las librerías y tipografías incluidas en `lib/` conservan sus licencias
originales, detalladas en [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

---

## Referencias

Gillespie, A. R., Kahle, A. B. y Walker, R. E. (1986). Color enhancement of
highly correlated images. II. Channel ratio and chromaticity transformation
techniques. *Remote Sensing of Environment*, 20(3), 209–235.

Zuiderveld, K. (1994). Contrast Limited Adaptive Histogram Equalization. En
P. Heckbert (ed.), *Graphics Gems IV* (pp. 474–485). Academic Press.
