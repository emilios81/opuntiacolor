# Avisos de terceros

OPC – OpuntiaColor se distribuye bajo GNU GPL v3.0 o posterior (ver [LICENSE](LICENSE)).

Para que la aplicación funcione sin conexión a internet, el repositorio incluye
copias de librerías y tipografías de terceros dentro de `lib/`. Ese software **no**
está cubierto por la GPL de OPC: conserva su licencia original, que se reproduce
o se referencia a continuación tal como exigen sus términos.

Ninguna de estas licencias impone restricciones adicionales sobre el uso de OPC.
Todas son compatibles con la GPL v3.

---

## React 18.2.0

- Archivo: `lib/react.production.min.js`
- Copyright (c) Meta Platforms, Inc. y sus filiales
- Licencia: MIT
- Origen: https://react.dev · https://github.com/facebook/react

## ReactDOM 18.2.0

- Archivo: `lib/react-dom.production.min.js`
- Copyright (c) Meta Platforms, Inc. y sus filiales
- Licencia: MIT
- Origen: https://react.dev · https://github.com/facebook/react
- Incluye código derivado de Modernizr 3.0.0pre (licencia MIT)

## Babel Standalone 7.23.9

- Archivo: `lib/babel.min.js`
- Copyright (c) 2014-presente Sebastian McKenzie y colaboradores
- Licencia: MIT
- Origen: https://babeljs.io · https://github.com/babel/babel
- **Uso:** solo en tiempo de compilación (`node build.js`). La aplicación en
  ejecución no lo carga.

### Texto de la licencia MIT

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Crimson Pro

- Archivo: `lib/fonts/CrimsonPro-300-700.woff2`
- Copyright (c) Jacques Le Bailly, a partir del trabajo de Sebastian Kosch
- Licencia: SIL Open Font License 1.1
- Origen: https://fonts.google.com/specimen/Crimson+Pro

## JetBrains Mono

- Archivo: `lib/fonts/JetBrainsMono-400-600.woff2`
- Copyright (c) JetBrains s.r.o.
- Licencia: SIL Open Font License 1.1
- Origen: https://www.jetbrains.com/lp/mono/

### Sobre la SIL Open Font License 1.1

La OFL permite usar, estudiar, modificar y redistribuir las tipografías,
incluso de forma comercial, siempre que se conserve este aviso de copyright y
que las fuentes no se vendan por sí solas. El texto completo está disponible en
https://openfontlicense.org

Los archivos `.woff2` incluidos son subconjuntos (subsets) de las fuentes
originales, generados para reducir el peso de la aplicación. La OFL permite
esta modificación.
