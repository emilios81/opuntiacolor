# OPC – OpuntiaColor v3.6.0

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
filtro de blancos está orientado a pigmentos claros sobre soporte oscuro, el
caso inverso al que optimizan la mayoría de las herramientas disponibles.

**Grabados** — Micro-relieve (contraste local multi-escala con imagen integral
más detección de bordes Sobel) y Relieve (mapa de bordes multi-escala, genera un
calco digital).

**Técnico** — CLAHE (Zuiderveld 1994) y Mapa de pigmentos (clasificación por
falso color; ver las limitaciones antes de usarlo).

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
- **Resolución completa** — es el modo por defecto, hasta 8192 px; se puede bajar
  a 2000 px si la máquina se arrastra.

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

## Entrada y salida

| | |
|---|---|
| **Entrada** | JPG, PNG, WebP (RAW no: el navegador no puede decodificarlo) |
| **Salida** | PNG, JPG (conserva EXIF/GPS), TIFF sin comprimir (spec 6.0) |

El nombre del archivo exportado registra el filtro, la intensidad y los ajustes
aplicados (`IMG_0421_OPC_crgb_i1.8_c10.png`); si se usó el gotero, también su
ganancia y su tolerancia (`_gotero+60t20`).

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
- **Procedimiento registrado** en el nombre del archivo exportado.

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
lib/                    React, Babel y tipografías incluidas localmente
tests/                  Pruebas automáticas del núcleo de procesamiento
docs/                   Documentación técnica
OpuntiaColor.bat        Acceso directo para Windows
```

## Tecnología

React 18 con JSX precompilado, y procesamiento de imagen píxel a píxel en
JavaScript puro: eigendecomposición de Jacobi con ordenamiento por eigenvalor,
summed-area tables para el contraste local, conversiones RGB ↔ CIE-LAB ↔ YCbCr,
parser y reinyector EXIF/GPS propios y encoder TIFF integrado. Sin dependencias
en tiempo de ejecución más allá de React.

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
para el realce digital de pigmentos y grabados en arte rupestre* (v3.6.0)
[Software]. LATDAA, Universidad Nacional de Catamarca.
https://doi.org/10.5281/zenodo.21796290

Cada versión queda archivada en Zenodo con su propio DOI. El de arriba es el
**DOI concepto**: siempre resuelve a la última versión, y es el que conviene
citar salvo que se quiera referir a una versión concreta. El de v3.4.0 en
particular es [10.5281/zenodo.21796291](https://doi.org/10.5281/zenodo.21796291)
y el de v3.5.0 es [10.5281/zenodo.22145678](https://doi.org/10.5281/zenodo.22145678).

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
