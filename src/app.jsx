/*
 * OPC – OpuntiaColor
 * Herramienta de procesamiento digital para realce de pigmentos y grabados
 * en arte rupestre.
 *
 * Copyright (C) 2025-2026  Emilio A. Villafañez
 * LATDAA – Universidad Nacional de Catamarca (UNCa), Argentina
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Este mismo archivo se carga dos veces: como página y como Web Worker, que
// corre los filtros en un hilo aparte (v3.7.2). En el worker no hay React ni
// documento: solo se usan las funciones de procesamiento y PRESETS.
const { useState, useRef, useCallback, useEffect } = typeof React !== "undefined" ? React : {};
// Dirección de app.js, para lanzar el worker con exactamente el mismo código
const APP_SRC = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : null;
// Versión que se anota en el registro de cada exportación (v3.8.0)
const OPC_VERSION = "3.8.0";
const OPC_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCACgAKADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxk0c0n0paCgHFB60UUALSGiigA7UUUUAHekPWlNJj1oAUUpFSWlrcXkwhs7ea4m/uQxl2/IAmrmo6Jqumx+ZqOl39pGf457Z0X8yMUAZ3ejHNJ3paACgGjrSd6AFzxQKKMUAIeaBRzR2oABS0L0oNAATQKbSrSAU0dKdximmmB0Fp4akvvCNzrdncLK9pKUubYL80aYGHz3/w+hrFsYDd3tvbKcGaVIwfTcwH9a3fAPiL/hHddWWcb9PuF8i7jIyGjPfHt1+maunTrPSPiRFHZO17pdrdRz77VDNsj4bB2g5I4FcntJwnKMu11/l8jo5IyjGS9H/mY3i7SotD8S6hpsErzR20mxXcAMeAecfWtf4ZeCrnxz4kSwhcw2kS+bdXGM+XHnHH+0TwPxPaquvXVhqHjPWL6++0C1eV5UhCGOSXoFXkfID1JPQDjmvefg3DD4I+Dd34kuI18y5jlvpCc7mCnbCn0/8Aiq1pSlyLm3sjOokpO3ct6t478H/CoN4f0TTHnuoQPOS2IXBxn97K3JbnJ649qoaN8fdJ1G6Sy1fRpbKzmPltOZlnRM8ZdcDK+vWsX4GeBbfxO974s8VxJeiW4fyYpuUkkzmSRh3AJwAeOD7Vq/GTwz4e17wJJ4n8MR2WbI8y2aBVmiDbHVgAASp5B9j2NK73Jstjmvj98NrPQ7WLxL4eiSKzldUu7eIfu0ZvuyIOyk8EdBkYrw85r6t8Nuviz9nmSC8cvMNOmtyWP8UOdp/DatfKSNvVWPcA1rF3RIZwKAc0p9KQCqAU0dqMUEUAFH1pAeaXrQAZo60lL0oATFL0oNIaAFzXR+HfCV1r1k1zbahpcAVyhjuLkI/HfGOnNc2OnNbXhzwzqfiSV10y1EkceBJNIQscf1Y/yFY1pcsL83L5s0pq8rWubR+H2oW+s6TZ3l1ZMl/MYw9tMJCoUbmOMeg/Ou78R+MNP8BvDoehaYjNEitIC2xVBHGSOWY9Sa4qBNF8F61pVzDqjalqNvcZuhbxjyEjIIYBupYZz/hXb+L/AANb+MbuLWdH1KJfOjUMxUyRyADAYEcg44I/lXkYicJVIfWW3Cz6NK/pvselRjKMJexXv+qegtxFbfFDwdJcQWfkarDJ5UZ+8yvxwG7qQehrqv2iruPQPh7o/h2x+VJnSIKO8UKjj8W20fD220zwtq2ieGraX7TfTytNIP4uFLNIw/hHAAFc98aJjrnxo8P6N96OH7NEV95JN7f+OgVvgPgly/Bf3fQwxnxx5vitr6nZeK7keBfgR9htJAt4ltHY5HBWaUZc/XDMay/gnbrffBLX7OVd0TSXcYHsYgf50ftUX3l6FoVip/191JMRnsiYH6vUvwZdLD4Iavd5ILG9lPPA2pgfTpXecXQZ+zzMbj4Ua1BIMpFNOo+jQhj+pr5hh/1Sf7o/lX03+zlEyfC3XZW+69xNj8IFFfMkXMMf+6P5VpDYT3Hd6XNJ0FFWIdmk5zS0E0AIOtL1NJRQApFKOaQmgGgA70hpaUYxSAbirEN5dQ20tvFczx28pzJGkhCv9QOtQcDr34Fben+FPEWoIHsNC1S4Q9GS1fB/EjFDSe472MUAthUGWPAHqe1dl44j/wCEYv7LS9HnntJorKP7a0EzL5krckkA4ziol+G/jUbXXwzqoIIIPljIP50mreEfG17ezXep6BrU11KdzyNakljjHb6VlOm5TTb0V9P6+ZcZqMWluek/Ai20298b6RqGn7VuY9Hn+2R7izCYOqb2J/vBs0pQan+1JhvmWG8z/wB+4P8AGrX7Mfh7VNN8R63c6pp17ZD7LHEhuIGj3ZkyQNw5+6KzPhnM2o/tDX15y2Z76T8BlR/Sko8i5b3E5czbF/aiuN3i7R7beSIbFpCD2LyH+i12LwDQf2Y3UkxvNpu4+paZ8/8As1ecftHSm6+JkkCD5orOCEfUgn/2YV6R+0FN/Y3wt0rR1PM00FuR/sxJk/qooDsSfA2MQ/Ba8kYbVdr1y3rwR/SvleEfuI/90fyr6v8Ah5EbP9nh3B+ZtNvZ8Z7nzK+UY+I0H+yP5VpDYl7i4opc0hqxCikopM0gFFLxTQaX60wDFLigUopAGa7T4Z/D3U/Heoslsfs2mwsBcXjrkJ/sqP4m9u3euKc7VJ9BmvsjRxD4E+Dcd1plurm000XbLj/WysgYsfqxyfYUm7IDEe1+HfwhtoRcRJPqrLlS6Ce7k/2h2QfkK5fVf2g3Vj/ZWhKeMeZd3J5/4CgwPzryHRrHVfHvjOK1a587U9RlLSXE5yBgZZj7ADgD2Ar6Gj8BeAPh/pMV/wCJUhuCGCfar8GQyORkBIhxng8YPA61ndsuyR59/wANA+I2YlNN0bHoEkOP/HquQfH/AF6MA3Oh6ey/7LSx/wA811x+NPgSwXytPsrwoOn2exSNfwyRUqfHjwfKAJrbVEHfdaqw/RqQfI5N/wBom5I50C2DjlT9tbG73G3ke1R/s36TeXfifVPEd1E0dqInjSZhtV5ZHBIXPXAz+YFdbL8WfhzcOrzQOx9X0sN/StXT/jH4FldYBqElvGvKma0dEX2GBxQHyPN/G/gvX9e+OrkabdHT5bqCX7V5Z8pYVCbju6Z+UjHXNbv7Vkch0zw5KoPkrcTKx9GKAj9A1el2nxC8IXZzD4l0wj0ecJ/6Fik1r/hE/GGnTafd32mX1tPjcEu0LArnaykNlWB70Cucx8KbrSvFPwitdAjvQk32J7G6jikUTRZyCQD6g5BxjmvPfEX7PWpW5kbw7qkV1GvSK9TyXPsGXKn8QK09X/Z6YS+f4d8Q4Gcxi6iOV/7aRn+lYs2g/FrwS3nWF3e31tH1FtP9rTHvG/zY+gqlJoLJ7HlfibwxrXhm58jXdNuLNicKzrlH/wB1x8p/OscV9NeAvivY+NCPDXjLT7RLm6PkqWTME7f3GVvuP6ds+hrzL43/AA6TwTqkF3pYc6JesViVzkwSDkxk9xjkE88EdqtSuJqx5jikpaBxVCExRS0uKACjoaOMUGkAhIPWvq74HeNLHxR4Oh0G/ZX1OxtzbyW0hH+lQhSqkZ6/LwfQ+xr5Rqeyup7K7iurOaSC5hYPHLGxVkYdwR0oauB6746+GuveAtdTXvCP2ifT4ZPOhlgG+W1/2XX+JeozyCOtdTpXxj8L+KtHGl/EDSVjBI3yCMywFh/EMfOh/l61meCPj/c2yx2vi6yN1GBtN9aALJ9Wj6H6qR9K79tK+G/xLiNxapYXV22Nz2z/AGe5U9yw4J/EGs3Foq/c562+Fnw48SIZfD2tSASdEt71JNv/AAFxuFZuofs7N5h+weISI8cfaLXkH0yrf0qzrf7PNsXL6Drk0D/wx3kQf/x9cH9DXPS+CPix4Wf/AIlGoXl1ApwPsV9vH/fuT/CpHfzEu/2f/EcSk2up6TcEdATJGf1Brn774OeNrWYRrpSXIIyJLe4Rl+hyQQa1vDXxW8bWvimw0/Vbw3AN2ltcW1zbojfM4UgkAFSM17f8XfFU/gzwhLqVhFFJeyTpbxGUZVS2csR3wB0oC7R81zfC3xtEuW8P3p9kKN/Jqz5Ph54vhbL+GNT4/wCnbd/LNd9pfxs8XlTLLpVlqEa5G9bSRce25DgVpJ+0NqEUmLvw5bBvQXLofyK0aD1PN9KsfHehzKdLs/Elk/pDDMoP4Ywfyr3v4RXXj/UJJ18bQOmmeV+5kuUEU7SZ6YXBK4z1A7Yrkj+0d8pB8OLv7EX+B/6BWZN8S/iD4132fhbSntEk4L2UTMwB9Zn4X6jFAndmN8bLeG5+M32fw+gN7K1skgh73JPXj+LG0n6V6l+07JDH8PIY5yDPLqEPlAnuoYsR6cZ/Ok+Fnw4tfBkdx4i8VXUEmrxhnkkkfMdoCMsd5+85zy34DvXjfxs8dr428RRiwLDR7ANHbZGDIT96QjtnAA9h71UVrclvoede1HegUtaiA4xQOlJiigABpaSkFAC0c0tFACZoBIcMOGHQjqPxo7UUAdhoHxJ8X6GEWx127aJekVw3np9MPk/rXvvwQ8da149i1aLXraz8izWMCaBWjLuxJwRnHRc8V8p19Wfsz6W1l8OzeMNrahePMOB8yLhB/wCgmolsB5V452337QUqW4UZ1a1i4HVh5eT+leo/tPuD4DshxzqaD/xx68j8Gu2ufHazuMhhNq8txn/ZUuw/QCvUP2ppQPCmiwlvme/LgdM4jb/GszTqix+z5cjTfhPqV9PvMFvdXFxtRsEqiKxH6Gmx/HjwXfIpvtO1NCQDiW0ST+RNUvhdmD9nvXpt2MxagcZ4+7jP6V80Lwq/QVcVch7n1LL8XfhuqFo7STzMcFdKGQfXkVmaz+0NpsMBj0HRbqdwMKbplhj+u1cn8OK+bqUVXKhHV+N/H/iHxlJjWL3FoG3JZwDZCp7fL/Efck1ymTigjmimAlBNKaTvTAKUUUtADTQKXFAoATvS55pTSDrSAKKDRTAa5wpI7DNfa+hRjwp8KbMqSosNI8xgf74j3n9Sa+LIk3yov95gv5nFfZ3xfb7J8MPEJjCgrYeV15wSq/lyaiY0eB/s5QG5+J9tK/zGC1nmJPrtC5/8err/ANqm9UT+G9OUksomuGBOTglVH8mrB/ZjMC+OdS89kU/2a+3cQP40z+lct8YvE0Xijx5e3lo++wt1FrbMDwyJnLD2LFj9MVmX9o9g8LxfZf2Yb18YMun3cnH+0zCvmMcDFfVerWi6X+zbJAxxIuhqSM/38Hp9TXyo1ax2IYUCkpeMUxB1pMUoNBoAKSjpS0AJ9KKXtRTAM0Zoo5pAJQBS0A0wCigsBwSMntmtey8M67fCNrPRNTnWQZRo7SQhh7HGKQGQrmNhIOShDAfTmvt7xTZxeLvh/exW2HfUtOLQ46tlQ6/rivlay+Ffje7I8vw5eID3mKRj9Wr6X+D9j4j0fwjDo/ii1it5bP5LaWO4WTfH1CkDoV6e4xUzA+PpUeB8NkEg+3sR+YIIqbSrCXVNStLC1UvPdSrCij1Y4/8Ar19LfED4L2/iO8m1DSLyPTLmeQyzQSR+ZEZD1dSMFS3UjkE88Gr3ww+Edj4MvRqd7djUdWAKxME2RwA8EqOSWxxuP4CsjTmJvjxNFpHwe1C0QjEiwWcfv8y/0U18iE5r6q+OvhDxT40OnWOiR2I0u0zOwludjyykbR8uMYUZ/FvavFbz4OeOrXJ/sTzgO8FxG/8AUVrHYzPPqUe9dFqPgjxTpylr7w9qsSr1b7MzD81zXOyAxuUkBRx1Vhg/kasAxS8YpM5oNIBKU03vTx0oAaaMUpopgLyKDRnilpANp8TKkiMyLIqsCUbOGAPQ45welNPApKAPRtJ+KlxowH9k+FfC1oQcho7Ni3/fRYn9a2H+P/i4xhUt9IT6QOf5vXkFKKLID1SX46+M2ztk0xP92zBx+Zqu/wAb/HDY26hZp/u2Sf1rzSkosgPSj8bPHXfVLb/wCj/wpB8bPHQ/5ilvj/ryj/wrzc0AHFFkB6WPjd43BBN9ZOwyAzWSZ5qdPjp40AG6XTGPqbMf415ZiiiyA9XHx58ZgddLP/bqR/7NVPUPjJ4g1JCmo6b4eu1PUT6eH/ma80PFANFgLOpXIvL+a5W1trQSHd5NshSNOP4QScDv1quRmkJ5pRQAmPzoHFLSZpgHWg0tJSA//9k=";

// ============================================================
// OPC – OpuntiaColor v3.8.0
// Decorrelation Stretch & pigment enhancement for archaeology
// v3.1: PCs ordenados, estadísticas por zona, CLAHE real,
//       imagen integral (rápido), TIFF válido, EXIF preservado
// v3.2: Procesado por lote para fotogrametría — pipeline con
//       estadísticas congeladas de la foto de referencia,
//       mismo nombre de archivo y EXIF conservado por foto
// v3.3: Rotación de Jacobi corregida (los eigenvalores eran
//       incorrectos: cambia los resultados de CRGB, DS-LAB y LDS)
// v3.4: La intensidad de LDS pasa a ser el exponente de blanqueo.
//       Antes no tenía ningún efecto; ahora el valor por defecto (1.5)
//       reproduce exactamente la salida de v3.3.0
// v3.7: Rojo adaptativo (decorrelación en el plano a*-b*: cambian
//       sus resultados) y Relieve con escala; la escala 0 (bordes)
//       reproduce exactamente la salida de v3.6.0
// v3.7.1: la intensidad se aplica al soltar el deslizador; conversión
//       a LAB más rápida y Bicromo / Mapa con menos memoria, sin
//       cambiar ningún resultado
// v3.7.2: los filtros corren en un Web Worker; la página no se congela
//       mientras procesa y un pedido nuevo cancela el anterior
// v3.7.3: una foto de más de 16 MP abre con un cartel que propone bajarla
//       un poco (16 MP recomendada); más escalones de resolución
// v3.8.0: registro de sesión dentro de cada exportación y en un .json
//       aparte (y un .csv por lote); un registro se puede reproducir y
//       comprobar píxel a píxel. No cambia ningún resultado
// ============================================================

// --- Color Conversion Core ---

// sRGB → lineal de cada canal de 8 bits, precalculado (v3.7.1). Es la misma
// cuenta que se hacía píxel por píxel, así que da los mismos valores al último
// bit —verificado sobre los 16,7 millones de colores—, pero ahorra tres
// potencias por píxel: la conversión a LAB tarda un tercio menos.
const SRGB_LINEAL = Float64Array.from({ length: 256 }, (_, v) => { const c = v / 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; });

function rgb2lab(r, g, b) {
  const rr = SRGB_LINEAL[r], gg = SRGB_LINEAL[g], bb = SRGB_LINEAL[b];
  let x = (rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) / 0.95047;
  let y = (rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750);
  let z = (rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function lab2rgb(L, a, b) {
  let y = (L + 16) / 116, x = a / 500 + y, z = y - b / 200;
  const finv = t => { const t3 = t*t*t; return t3 > 0.008856 ? t3 : (t - 16/116) / 7.787; };
  x = 0.95047*finv(x); y = 1.0*finv(y); z = 1.08883*finv(z);
  let rr = x*3.2404542 - y*1.5371385 - z*0.4985314;
  let gg = -x*0.9692660 + y*1.8760108 + z*0.0415560;
  let bb = x*0.0556434 - y*0.2040259 + z*1.0572252;
  const gamma = c => c > 0.0031308 ? 1.055*Math.pow(c, 1/2.4) - 0.055 : 12.92*c;
  return [Math.max(0,Math.min(255,Math.round(gamma(rr)*255))),Math.max(0,Math.min(255,Math.round(gamma(gg)*255))),Math.max(0,Math.min(255,Math.round(gamma(bb)*255)))];
}

function rgb2ycbcr(r, g, b) { return [0.299*r+0.587*g+0.114*b, 128-0.168736*r-0.331264*g+0.5*b, 128+0.5*r-0.418688*g-0.081312*b]; }
function ycbcr2rgb(y, cb, cr) { return [Math.max(0,Math.min(255,Math.round(y+1.402*(cr-128)))),Math.max(0,Math.min(255,Math.round(y-0.344136*(cb-128)-0.714136*(cr-128)))),Math.max(0,Math.min(255,Math.round(y+1.772*(cb-128))))]; }

// ============================================================
// HELPERS ESTADÍSTICOS COMPARTIDOS
// Todos aceptan una máscara opcional (Uint8Array): las estadísticas
// se calculan solo sobre los píxeles seleccionados, como en DStretch.
// ============================================================

// Media y covarianza 3x3 sobre los píxeles de la máscara (o todos si no hay)
function meanCov3(CH, n, mask) {
  const mean=[0,0,0]; let cnt=0;
  for(let i=0;i<n;i++){ if(mask&&!mask[i])continue; mean[0]+=CH[0][i];mean[1]+=CH[1][i];mean[2]+=CH[2][i];cnt++; }
  if(!cnt){ mask=null; for(let i=0;i<n;i++){mean[0]+=CH[0][i];mean[1]+=CH[1][i];mean[2]+=CH[2][i];} cnt=n; }
  mean[0]/=cnt;mean[1]/=cnt;mean[2]/=cnt;
  const cov=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<n;i++){
    if(mask&&!mask[i])continue;
    const d0=CH[0][i]-mean[0],d1=CH[1][i]-mean[1],d2=CH[2][i]-mean[2];
    cov[0][0]+=d0*d0;cov[0][1]+=d0*d1;cov[0][2]+=d0*d2;
    cov[1][1]+=d1*d1;cov[1][2]+=d1*d2;cov[2][2]+=d2*d2;
  }
  for(let j=0;j<3;j++)for(let k=j;k<3;k++){cov[j][k]/=cnt;cov[k][j]=cov[j][k];}
  const eps=1e-10;cov[0][0]+=eps;cov[1][1]+=eps;cov[2][2]+=eps;
  return { mean, cov, mask };
}

// Media y desvío estándar de un canal sobre la máscara (o todos)
function meanStd1(arr, n, mask) {
  let s=0,cnt=0;
  for(let i=0;i<n;i++){ if(mask&&!mask[i])continue; s+=arr[i];cnt++; }
  if(!cnt){ mask=null; for(let i=0;i<n;i++)s+=arr[i]; cnt=n; }
  const m=s/cnt; let v=0;
  for(let i=0;i<n;i++){ if(mask&&!mask[i])continue; v+=(arr[i]-m)**2; }
  return { mean:m, std:Math.sqrt(v/cnt)||1 };
}

// Eigendecomposición Jacobi 3x3 con eigenvectores ORDENADOS por
// eigenvalor descendente: PC1 es siempre la componente de mayor varianza.
// Sin esto, la asignación PC→canal era aleatoria y los resultados no
// eran comparables entre fotos.
// Vallas robustas de Tukey (Q1 - k·IQR, Q3 + k·IQR) de un canal, calculadas
// con un histograma de 4096 bins: es O(n) y evita ordenar varios millones de
// valores. A diferencia del mínimo y el máximo, los cuartiles no se mueven
// aunque una parte de la imagen sea un valor extremo —la tarjeta de color, la
// mano, un brillo especular—, así que el rango de salida lo fija la escena y
// no el objeto más saturado del encuadre.
function tukeyFences(arr, n, mask, k) {
  let mn = Infinity, mx = -Infinity, cnt = 0;
  for (let i = 0; i < n; i++) { if (mask && !mask[i]) continue; const v = arr[i]; if (v < mn) mn = v; if (v > mx) mx = v; cnt++; }
  if (cnt === 0) { mask = null; cnt = n; for (let i = 0; i < n; i++) { const v = arr[i]; if (v < mn) mn = v; if (v > mx) mx = v; } }
  const rng = mx - mn;
  if (!(rng > 0)) return { lo: mn, hi: mx };
  const B = 4096, hist = new Int32Array(B), sc = (B - 1) / rng;
  for (let i = 0; i < n; i++) { if (mask && !mask[i]) continue; hist[((arr[i] - mn) * sc) | 0]++; }
  const oq1 = 0.25 * cnt, oq3 = 0.75 * cnt;
  let acc = 0, q1 = mn, q3 = mx, got1 = false;
  for (let b = 0; b < B; b++) {
    acc += hist[b];
    if (!got1 && acc >= oq1) { q1 = mn + b / sc; got1 = true; }
    if (acc >= oq3) { q3 = mn + (b + 1) / sc; break; }
  }
  const iqr = q3 - q1;
  return { lo: q1 - k * iqr, hi: q3 + k * iqr };
}

function jacobiEigen3(cov) {
  let a=cov.map(r=>[...r]);const ev=[[1,0,0],[0,1,0],[0,0,1]];
  for(let it=0;it<100;it++){
    let mx=0,p=0,q=1;
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(Math.abs(a[i][j])>mx){mx=Math.abs(a[i][j]);p=i;q=j;}
    if(mx<1e-14)break;
    const th=0.5*Math.atan2(2*a[p][q],a[p][p]-a[q][q]),co=Math.cos(th),si=Math.sin(th);
    // A' = Jᵀ·A·J en dos pasos. El resultado del primer paso (columnas) debe
    // arrastrarse COMPLETO al segundo: si solo se reescriben las filas p y q,
    // las filas restantes quedan con sus columnas p,q sin actualizar, la matriz
    // deja de ser simétrica y la iteración converge a un resultado incorrecto.
    const t=a.map(r=>[...r]);
    for(let i=0;i<3;i++){t[i][p]=co*a[i][p]+si*a[i][q];t[i][q]=-si*a[i][p]+co*a[i][q];}
    const u=t.map(r=>[...r]);
    for(let j=0;j<3;j++){u[p][j]=co*t[p][j]+si*t[q][j];u[q][j]=-si*t[p][j]+co*t[q][j];}
    a=u;
    const nV=ev.map(r=>[...r]);
    for(let i=0;i<3;i++){ev[i][p]=co*nV[i][p]+si*nV[i][q];ev[i][q]=-si*nV[i][p]+co*nV[i][q];}
  }
  const eps=1e-10;
  const order=[0,1,2].sort((x,y)=>a[y][y]-a[x][x]);
  const stds=order.map(k=>Math.sqrt(Math.max(a[k][k],eps)));
  const evS=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++)for(let k=0;k<3;k++)evS[i][k]=ev[i][order[k]];
  return { ev:evS, stds };
}

// Summed-area table: promedio de cualquier ventana en O(1) por píxel.
// Reemplaza los muestreos por vecindario que congelaban el navegador.
function buildSAT(src, w, h) {
  const sat=new Float64Array((w+1)*(h+1));
  for(let y=0;y<h;y++){
    let row=0;
    for(let x=0;x<w;x++){ row+=src[y*w+x]; sat[(y+1)*(w+1)+(x+1)]=sat[y*(w+1)+(x+1)]+row; }
  }
  return sat;
}
function satMean(sat, w, x0, y0, x1, y1) {
  const W=w+1;
  const s=sat[(y1+1)*W+(x1+1)]-sat[y0*W+(x1+1)]-sat[(y1+1)*W+x0]+sat[y0*W+x0];
  return s/((x1-x0+1)*(y1-y0+1));
}

// ============================================================
// FILTER FUNCTIONS
// ============================================================

// --- Pinturas ---

// Rojo adaptativo (v3.7.0)
//
// Hasta v3.6.0 este filtro era una transformación FIJA en CIE-LAB: multiplicaba
// a* por la intensidad y corría L* según el signo de a*, sin mirar la foto. En
// una arenisca con manchas de hierro —rojiza toda ella— eso enrojecía la roca y
// el pigmento por igual, y los trazos no se separaban del soporte. Es lo que
// mostró la comparación de B. Gunn contra DStretch (sep-2026).
//
// Ahora es un decorrelation stretch en el plano cromático a*-b*, calculado con
// los colores de la propia foto o de la zona seleccionada:
//
//   1. Media y covarianza 2×2 de (a*, b*), sin los píxeles que caen fuera de
//      las vallas de Tukey (k = 3) de cada eje: la tarjeta de color o una mano
//      no deciden cuál es el color de la roca.
//   2. Ejes principales: el primero sigue la variación dominante del soporte
//      (en una arenisca ferruginosa, del ocre claro al naranja); el segundo es
//      su perpendicular, donde suele quedar el pigmento.
//   3. Los dos ejes se llevan a la misma dispersión, RED_SIGMA · intensidad
//      unidades LAB, y se vuelve a los ejes a*, b*. El color medio de la roca
//      queda gris; lo que se aparta de él, amplificado.
//   4. Lo que se aparta hacia +a* —más rojo que la roca— se estira además
//      RED_ENFASIS veces: es lo que hace de este un filtro rojo.
//
// L* no se toca, así que la textura y el relieve quedan como en la foto. El
// desvío de cada eje tiene un piso de RED_PISO: en una roca casi gris un eje
// puede tener σ ≈ 1, que es ruido de compresión, y sin piso se lo amplificaría
// ×15 con el valor por defecto. En el lote, media, ejes y desvíos van
// congelados de la referencia; la intensidad se sigue aplicando en cada foto.
const RED_SIGMA = 10;
const RED_PISO = 1.5;
const RED_ENFASIS = 1.5;

function enhanceRedPigment(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data, n = data.length / 4;
  const L = new Float64Array(n), A = new Float64Array(n), B = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [l, a, b] = rgb2lab(data[i*4], data[i*4+1], data[i*4+2]);
    L[i] = l; A[i] = a; B[i] = b;
  }
  let st = store && store.frozen;
  if (!st) {
    // Máscara vacía → toda la imagen, igual que meanCov3
    if (mask) { let alguno = false; for (let i = 0; i < n; i++) if (mask[i]) { alguno = true; break; } if (!alguno) mask = null; }
    const fa = tukeyFences(A, n, mask, 3), fb = tukeyFences(B, n, mask, 3);
    const vale = (i) => (!mask || mask[i]) && A[i] >= fa.lo && A[i] <= fa.hi && B[i] >= fb.lo && B[i] <= fb.hi;
    let ma = 0, mb = 0, cnt = 0;
    for (let i = 0; i < n; i++) { if (!vale(i)) continue; ma += A[i]; mb += B[i]; cnt++; }
    ma /= cnt; mb /= cnt;
    let saa = 0, sab = 0, sbb = 0;
    for (let i = 0; i < n; i++) {
      if (!vale(i)) continue;
      const da = A[i] - ma, db = B[i] - mb;
      saa += da*da; sab += da*db; sbb += db*db;
    }
    saa /= cnt; sab /= cnt; sbb /= cnt;
    // Ejes principales de una covarianza 2×2, en forma cerrada
    const th = 0.5 * Math.atan2(2*sab, saa - sbb);
    const medio = (saa + sbb) / 2, radio = Math.sqrt(((saa - sbb) / 2) ** 2 + sab*sab);
    st = {
      ma, mb, co: Math.cos(th), si: Math.sin(th),
      s1: Math.max(RED_PISO, Math.sqrt(Math.max(0, medio + radio))),
      s2: Math.max(RED_PISO, Math.sqrt(Math.max(0, medio - radio))),
    };
    if (store) store.frozen = st;
  }
  const { ma, mb, co, si } = st;
  const objetivo = RED_SIGMA * intensity, w1 = objetivo / st.s1, w2 = objetivo / st.s2;
  const output = new Uint8ClampedArray(data.length);
  for (let i = 0; i < n; i++) {
    const da = A[i] - ma, db = B[i] - mb;
    const p1 = (co*da + si*db) * w1, p2 = (co*db - si*da) * w2;
    let a = co*p1 - si*p2;
    const b = si*p1 + co*p2;
    if (a > 0) a *= RED_ENFASIS;
    const [r, g, bb] = lab2rgb(L[i], Math.max(-128, Math.min(127, a)), Math.max(-128, Math.min(127, b)));
    output[i*4] = r; output[i*4+1] = g; output[i*4+2] = bb; output[i*4+3] = 255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}

function enhanceWhitePigment(imageData, intensity = 1.5, mask = null, store = null) {
  const data=imageData.data,n=data.length/4,output=new Uint8ClampedArray(data.length);
  const lv=new Float64Array(n);for(let i=0;i<n;i++){const[L]=rgb2lab(data[i*4],data[i*4+1],data[i*4+2]);lv[i]=L;}
  // Estadísticas congeladas (lote) o calculadas sobre esta imagen
  const { mean:mL, std:stdL } = (store && store.frozen) || meanStd1(lv, n, mask);
  if (store && !store.frozen) store.frozen = { mean:mL, std:stdL };
  for(let i=0;i<n;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2];const[L,a,bL]=rgb2lab(r,g,b);const z=(L-mL)/(stdL||1),boost=z>0?z*intensity*5:z*intensity*2,nL=Math.max(0,Math.min(100,L+boost)),sf=L>mL?1/(1+(intensity-1)*0.5):1;const[nr,ng,nb]=lab2rgb(nL,a*sf,bL*sf);output[i*4]=nr;output[i*4+1]=ng;output[i*4+2]=nb;output[i*4+3]=255;}
  return new ImageData(output, imageData.width, imageData.height);
}

// L*, a* y b* se guardan en tres Float64Array (v3.7.1). Antes iba un arreglo
// [L,a,b] por píxel: unos 80 bytes cada uno, que con una foto de 45 MP casi
// llenaban los ~4 GB de memoria de JavaScript de la pestaña. Mismos valores,
// menos de un tercio de la memoria. El Mapa de pigmentos hace lo mismo.
function enhanceBichrome(imageData, intensity = 1.5, mask = null, store = null) {
  const data=imageData.data,n=data.length/4,output=new Uint8ClampedArray(data.length);
  const lv=new Float64Array(n),av=new Float64Array(n),bv=new Float64Array(n);for(let i=0;i<n;i++){const[L,a,bL]=rgb2lab(data[i*4],data[i*4+1],data[i*4+2]);lv[i]=L;av[i]=a;bv[i]=bL;}
  const mL = (store && store.frozen) ? store.frozen.mL : meanStd1(lv, n, mask).mean;
  if (store && !store.frozen) store.frozen = { mL };
  for(let i=0;i<n;i++){let L=lv[i],a=av[i],bL=bv[i];const rb=a>5?intensity*1.3:(a>0?intensity:1),nA=a*rb,ch=Math.sqrt(a*a+bL*bL),isW=L>mL&&ch<25,wb=isW?(L-mL)*intensity*0.15:0,nL=Math.max(0,Math.min(100,L+wb)),isR=!isW&&a<5&&L<mL,rs=isR?0.7:1;const[nr,ng,nb]=lab2rgb(nL*rs+(1-rs)*(nL*0.6),Math.max(-128,Math.min(127,nA)),Math.max(-128,Math.min(127,bL*(isW?0.5:1))));output[i*4]=nr;output[i*4+1]=ng;output[i*4+2]=nb;output[i*4+3]=255;}
  return new ImageData(output, imageData.width, imageData.height);
}

function enhanceBlackPigment(imageData, intensity = 1.5, mask = null, store = null) {
  const data=imageData.data,n=data.length/4,output=new Uint8ClampedArray(data.length);
  const lv=new Float64Array(n);for(let i=0;i<n;i++){const[L]=rgb2lab(data[i*4],data[i*4+1],data[i*4+2]);lv[i]=L;}
  const { mean:mL, std:stdL } = (store && store.frozen) || meanStd1(lv, n, mask);
  if (store && !store.frozen) store.frozen = { mean:mL, std:stdL };
  for(let i=0;i<n;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2];const[L,a,bL]=rgb2lab(r,g,b);const ch=Math.sqrt(a*a+bL*bL),z=(L-mL)/stdL,isDLC=L<mL&&ch<20;let nL=L,nA=a,nB=bL;if(isDLC){const df=Math.max(0,(mL-L)/mL);nL=L-df*intensity*18;const cr=1/(1+(intensity-1)*0.8);nA=a*cr;nB=bL*cr;}else{nL=L+Math.max(0,z)*intensity*3;nA=a*(1+(intensity-1)*0.15);nB=bL*(1+(intensity-1)*0.15);}const[nr,ng,nb]=lab2rgb(Math.max(0,Math.min(100,nL)),Math.max(-128,Math.min(127,nA)),Math.max(-128,Math.min(127,nB)));output[i*4]=nr;output[i*4+1]=ng;output[i*4+2]=nb;output[i*4+3]=255;}
  return new ImageData(output, imageData.width, imageData.height);
}

// --- Grabados ---

function enhancePetroglyph(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data, w = imageData.width, h = imageData.height, n = w * h;
  const output = new Uint8ClampedArray(data.length);
  const Lchan = new Float64Array(n), Achan = new Float64Array(n), Bchan = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [L, a, b] = rgb2lab(data[i*4], data[i*4+1], data[i*4+2]);
    Lchan[i] = L; Achan[i] = a; Bchan[i] = b;
  }
  const scaleSmall = Math.max(8, Math.floor(Math.min(w,h) / 40));
  const scaleLarge = Math.max(24, Math.floor(Math.min(w,h) / 10));
  // Promedios locales exactos vía imagen integral: O(1) por píxel
  const sat = buildSAT(Lchan, w, h);
  const localEnhL = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const x = i % w, y = (i / w) | 0;
    const mS = satMean(sat, w, Math.max(0,x-scaleSmall), Math.max(0,y-scaleSmall), Math.min(w-1,x+scaleSmall), Math.min(h-1,y+scaleSmall));
    const mLg = satMean(sat, w, Math.max(0,x-scaleLarge), Math.max(0,y-scaleLarge), Math.min(w-1,x+scaleLarge), Math.min(h-1,y+scaleLarge));
    const devS=(Lchan[i]-mS)*intensity*2.5, devL=(Lchan[i]-mLg)*intensity*1.2;
    localEnhL[i]=Lchan[i]+devS*0.6+devL*0.4;
  }
  const edges = new Float64Array(n); let maxEdge=0;
  for (let i=0;i<n;i++){const x=i%w,y=Math.floor(i/w);if(x===0||x===w-1||y===0||y===h-1){edges[i]=0;continue;}const gx=-Lchan[(y-1)*w+(x-1)]+Lchan[(y-1)*w+(x+1)]-2*Lchan[y*w+(x-1)]+2*Lchan[y*w+(x+1)]-Lchan[(y+1)*w+(x-1)]+Lchan[(y+1)*w+(x+1)];const gy=-Lchan[(y-1)*w+(x-1)]-2*Lchan[(y-1)*w+x]-Lchan[(y-1)*w+(x+1)]+Lchan[(y+1)*w+(x-1)]+2*Lchan[(y+1)*w+x]+Lchan[(y+1)*w+(x+1)];edges[i]=Math.sqrt(gx*gx+gy*gy);if(edges[i]>maxEdge)maxEdge=edges[i];}
  // Rango cromático sobre la zona seleccionada (o toda la imagen),
  // o congelado desde la foto de referencia en modo lote
  let minA=Infinity,maxA=-Infinity,minB=Infinity,maxB=-Infinity;
  if (store && store.frozen) {
    ({ minA, maxA, minB, maxB } = store.frozen);
  } else {
    for(let i=0;i<n;i++){if(mask&&!mask[i])continue;if(Achan[i]<minA)minA=Achan[i];if(Achan[i]>maxA)maxA=Achan[i];if(Bchan[i]<minB)minB=Bchan[i];if(Bchan[i]>maxB)maxB=Bchan[i];}
    if(minA===Infinity){for(let i=0;i<n;i++){if(Achan[i]<minA)minA=Achan[i];if(Achan[i]>maxA)maxA=Achan[i];if(Bchan[i]<minB)minB=Bchan[i];if(Bchan[i]>maxB)maxB=Bchan[i];}}
    if (store) store.frozen = { minA, maxA, minB, maxB };
  }
  const rangeA=maxA-minA||1,rangeB=maxB-minB||1,chromaBoost=intensity*3;
  const edgeNorm=maxEdge||1,edgeMix=intensity*0.25;
  for(let i=0;i<n;i++){let newL=localEnhL[i]+(edges[i]/edgeNorm)*20*edgeMix;newL=Math.max(0,Math.min(100,newL));const midA=(minA+maxA)/2,midB=(minB+maxB)/2;let newA=midA+(Achan[i]-midA)*chromaBoost,newB=midB+(Bchan[i]-midB)*chromaBoost;newA=Math.max(-128,Math.min(127,newA));newB=Math.max(-128,Math.min(127,newB));const[r,g,b]=lab2rgb(newL,newA,newB);output[i*4]=r;output[i*4+1]=g;output[i*4+2]=b;output[i*4+3]=255;}
  return new ImageData(output, w, h);
}

// CRGB — Decorrelation Stretch puro en RGB
// Mapeo directo de componentes principales a canales R,G,B
// SIN reproyectar al espacio original — máxima separación cromática
function crgbEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data, w = imageData.width, h = imageData.height, n = w * h;

  // Paso 1: Leer RGB como float
  const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) { CH[0][i] = data[i*4]; CH[1][i] = data[i*4+1]; CH[2][i] = data[i*4+2]; }

  // Paso 2-4: Matriz congelada del lote, o media/covarianza + Jacobi
  // (sobre la zona seleccionada si la hay)
  const frozen = store && store.frozen;
  let mean, ev, stds;
  if (frozen) {
    ({ mean, ev, stds } = frozen);
  } else {
    const stats = meanCov3(CH, n, mask); mask = stats.mask;
    mean = stats.mean;
    ({ ev, stds } = jacobiEigen3(stats.cov));
  }

  // Paso 5: Proyectar a PCs y ecualizar varianza
  // CLAVE: cada PC normalizada se asigna DIRECTO a un canal RGB
  // PC1→R, PC2→G, PC3→B — sin reproyección al espacio original
  const pc = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const d0=CH[0][i]-mean[0], d1=CH[1][i]-mean[1], d2=CH[2][i]-mean[2];
    for (let k = 0; k < 3; k++) {
      pc[k][i] = (ev[0][k]*d0 + ev[1][k]*d1 + ev[2][k]*d2) / stds[k];
    }
  }

  // Paso 6: Normalizar cada PC independientemente a 0-255
  // Recorte por percentil para máximo contraste (más bajo = más agresivo)
  // En modo lote los recortes también van congelados: misma normalización
  // en todas las fotos → colores idénticos en todo el lote
  const output = new Uint8ClampedArray(data.length);
  let clips;
  if (frozen) {
    clips = frozen.clips;
  } else {
    const clipStd = Math.max(0.8, 3.5 / intensity); // intensity alta = clip más agresivo
    clips = [];
    for (let k = 0; k < 3; k++) {
      const st = meanStd1(pc[k], n, mask);
      clips.push({ lo: st.mean - st.std * clipStd, hi: st.mean + st.std * clipStd });
    }
    if (store) store.frozen = { mean, ev, stds, clips };
  }
  for (let k = 0; k < 3; k++) {
    const { lo, hi } = clips[k], range = hi - lo || 1;
    for (let i = 0; i < n; i++) {
      const clamped = Math.max(lo, Math.min(hi, pc[k][i]));
      output[i*4+k] = Math.round(((clamped - lo) / range) * 255);
    }
  }
  for (let i = 0; i < n; i++) output[i*4+3] = 255;

  return new ImageData(output, w, h);
}

// Mapa de Relieve
//
// Con escala 0 (por defecto) es el mapa de bordes multi-escala de v3.0–v3.6,
// byte a byte el mismo: un calco digital, útil sobre todo en pinturas. Con una
// escala mayor que 0 pasa a reliefEscala (v3.7.0), pensado para grabados.
function reliefMap(imageData, intensity = 1.5, mask = null, store = null, opts = null) {
  const escala = (opts && opts.escala) || 0;
  if (escala > 0) return reliefEscala(imageData, intensity, mask, store, escala, opts);
  const data = imageData.data, w = imageData.width, h = imageData.height, n = w * h;
  const output = new Uint8ClampedArray(data.length);
  const lum = new Float64Array(n);
  for (let i = 0; i < n; i++) lum[i] = 0.299*data[i*4] + 0.587*data[i*4+1] + 0.114*data[i*4+2];

  // Multi-scale Sobel: escala fina (surcos) + gruesa (paneles)
  const edges = new Float64Array(n);
  let maxEdge = 0;
  for (let i = 0; i < n; i++) {
    const x = i % w, y = Math.floor(i / w);
    if (x < 2 || x >= w-2 || y < 2 || y >= h-2) { edges[i] = 0; continue; }
    // 3x3 Sobel
    const gx1 = -lum[(y-1)*w+(x-1)] + lum[(y-1)*w+(x+1)] -2*lum[y*w+(x-1)] + 2*lum[y*w+(x+1)] -lum[(y+1)*w+(x-1)] + lum[(y+1)*w+(x+1)];
    const gy1 = -lum[(y-1)*w+(x-1)] -2*lum[(y-1)*w+x] -lum[(y-1)*w+(x+1)] +lum[(y+1)*w+(x-1)] +2*lum[(y+1)*w+x] +lum[(y+1)*w+(x+1)];
    // 5x5 extended
    const gx2 = -lum[(y-2)*w+(x-2)] + lum[(y-2)*w+(x+2)] -2*lum[y*w+(x-2)] + 2*lum[y*w+(x+2)] -lum[(y+2)*w+(x-2)] + lum[(y+2)*w+(x+2)];
    const gy2 = -lum[(y-2)*w+(x-2)] -2*lum[(y-2)*w+x] -lum[(y-2)*w+(x+2)] +lum[(y+2)*w+(x-2)] +2*lum[(y+2)*w+x] +lum[(y+2)*w+(x+2)];
    edges[i] = Math.sqrt(gx1*gx1+gy1*gy1)*0.65 + Math.sqrt(gx2*gx2+gy2*gy2)*0.35;
    if (edges[i] > maxEdge) maxEdge = edges[i];
  }
  const norm = maxEdge || 1;
  for (let i = 0; i < n; i++) {
    const e = Math.pow(Math.min(1, (edges[i] / norm) * intensity * 1.2), 0.7);
    const v = Math.round(e * 255);
    // Falso color cálido para mejor lectura: bordes claros sobre fondo oscuro
    output[i*4] = Math.min(255, Math.round(v * 1.05));
    output[i*4+1] = Math.min(255, Math.round(v * 0.92));
    output[i*4+2] = Math.min(255, Math.round(v * 0.78));
    output[i*4+3] = 255;
  }
  return new ImageData(output, w, h);
}

// Escalas del Relieve, en % del lado mayor de la imagen. 0 = mapa de bordes.
// La escala es lo más chico que se conserva: todo lo menor se borra. El tope es
// 1 %: con 2 %, en una foto de panel (~1 m) se borra lo que mide menos de 2 cm,
// que es el ancho de los propios surcos, y queda una mancha borrosa.
const RELIEF_ESCALAS = [0, 0.1, 0.25, 0.5, 1];
// Cuántas veces más grande que la escala es el entorno que se resta como fondo
const RELIEF_FONDO = 16;
// Relieve doble (v3.8.0): cuántas veces más grande que la escala elegida (la
// textura) es la del objeto, la forma de conjunto del surco o del panel
const RELIEF_OBJETO = 4;
// Compresión suave (v3.8.0): rodilla de la curva asinh, en niveles de gris, y
// hasta cuántas veces el recorte lineal llega a abarcar el rango de grises
const RELIEF_SUAVE_K = 40;
const RELIEF_SUAVE_TOPE = 3;

// Promedio en caja de (2r+1)×(2r+1) píxeles, separable y recorriendo siempre
// por filas (la pasada vertical lleva una suma corrida por columna, así no
// salta de fila en fila con imágenes de decenas de megapíxeles). En los bordes
// la ventana se recorta y promedia solo los píxeles que caen dentro, el mismo
// criterio que satMean. Lee src y escribe dst usando tmp de intermedio; src y
// dst pueden ser el mismo arreglo, tmp no.
function boxBlur(src, dst, tmp, w, h, r) {
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let s = 0;
    for (let x = 0; x <= Math.min(w - 1, r); x++) s += src[o + x];
    for (let x = 0; x < w; x++) {
      tmp[o + x] = s / (Math.min(w - 1, x + r) - Math.max(0, x - r) + 1);
      if (x + r + 1 < w) s += src[o + x + r + 1];
      if (x - r >= 0) s -= src[o + x - r];
    }
  }
  const col = new Float64Array(w);
  for (let y = 0; y <= Math.min(h - 1, r); y++) { const o = y * w; for (let x = 0; x < w; x++) col[x] += tmp[o + x]; }
  for (let y = 0; y < h; y++) {
    const o = y * w, cnt = Math.min(h - 1, y + r) - Math.max(0, y - r) + 1;
    for (let x = 0; x < w; x++) dst[o + x] = col[x] / cnt;
    if (y + r + 1 < h) { const o2 = (y + r + 1) * w; for (let x = 0; x < w; x++) col[x] += tmp[o2 + x]; }
    if (y - r >= 0) { const o3 = (y - r) * w; for (let x = 0; x < w; x++) col[x] -= tmp[o3 + x]; }
  }
}

// Resta a la luminancia, en el lugar, la superficie cuadrática que mejor la
// ajusta por mínimos cuadrados: c0 + c1·u + c2·v + c3·u² + c4·u·v + c5·v², con
// u, v ∈ [-1, 1] del centro a los bordes. Es la iluminación general de la foto
// —un gradiente de luz, un viñeteo— y la curvatura de conjunto de la roca.
//
// Hace falta porque el promedio en caja recorta la ventana en los bordes: ahí
// el entorno queda corrido hacia el interior y un gradiente no se cancela. Con
// escala 1 % la franja afectada llegaba a un sexto del ancho, y de
// rebote movía la normalización de toda la imagen. Sacada antes la tendencia,
// en los bordes no queda gradiente que cancelar; en el interior no cambia
// nada, porque el pasabanda ya anulaba ahí cualquier cuadrática.
//
// La grilla es separable: los momentos geométricos salen de sumas por columna
// y por fila, y de cada píxel solo hacen falta ΣL, ΣL·u y ΣL·u² de su fila.
function quitarTendencia(lum, w, h) {
  const cx = (w - 1) / 2, cy = (h - 1) / 2, sx = Math.max(cx, 1), sy = Math.max(cy, 1);
  const uu = new Float64Array(w), vv = new Float64Array(h);
  for (let x = 0; x < w; x++) uu[x] = (x - cx) / sx;
  for (let y = 0; y < h; y++) vv[y] = (y - cy) / sy;
  // U[a] = Σ u^a, V[b] = Σ v^b, a, b = 0..4
  const U = [0,0,0,0,0], V = [0,0,0,0,0];
  for (let x = 0; x < w; x++) { let p = 1; for (let a = 0; a < 5; a++) { U[a] += p; p *= uu[x]; } }
  for (let y = 0; y < h; y++) { let p = 1; for (let a = 0; a < 5; a++) { V[a] += p; p *= vv[y]; } }
  // Exponentes (de u, de v) de cada término: 1, u, v, u², u·v, v²
  const E = [[0,0],[1,0],[0,1],[2,0],[1,1],[0,2]];
  const M = E.map(([aj, bj]) => E.map(([ak, bk]) => U[aj + ak] * V[bj + bk]));
  const b = [0,0,0,0,0,0];
  for (let y = 0; y < h; y++) {
    const o = y * w, v = vv[y];
    let s0 = 0, s1 = 0, s2 = 0;
    for (let x = 0; x < w; x++) { const L = lum[o + x], u = uu[x]; s0 += L; s1 += L * u; s2 += L * u * u; }
    b[0] += s0; b[1] += s1; b[2] += v * s0; b[3] += s2; b[4] += v * s1; b[5] += v * v * s0;
  }
  // Eliminación gaussiana con pivoteo parcial
  for (let c = 0; c < 6; c++) {
    let p = c;
    for (let r = c + 1; r < 6; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return;   // imagen de una fila o columna: no hay superficie que ajustar
    [M[c], M[p]] = [M[p], M[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < 6; r++) {
      const k = M[r][c] / M[c][c];
      for (let j = c; j < 6; j++) M[r][j] -= k * M[c][j];
      b[r] -= k * b[c];
    }
  }
  const co = [0,0,0,0,0,0];
  for (let c = 5; c >= 0; c--) {
    let s = b[c];
    for (let j = c + 1; j < 6; j++) s -= M[c][j] * co[j];
    co[c] = s / M[c][c];
  }
  for (let y = 0; y < h; y++) {
    const o = y * w, v = vv[y];
    const k0 = co[0] + co[2]*v + co[5]*v*v, k1 = co[1] + co[4]*v;
    for (let x = 0; x < w; x++) { const u = uu[x]; lum[o + x] -= k0 + k1*u + co[3]*u*u; }
  }
}

// Relieve por escala (v3.7.0)
//
// El mapa de bordes trata igual un grano de 2 mm que un surco picoteado de
// 4 cm, y como no resta el fondo, un cambio general de iluminación o de altura
// a lo ancho del panel corre toda la línea de base y tapa la señal. Sirve para
// calcar una pintura; en petroglifos casi no sirve (B. Gunn, sep-2026).
//
// Acá la luminancia pasa por un pasabanda, al modo del Local Relief Model que
// se usa con los modelos de elevación:
//
//   D = suavizado(r) − suavizado(RELIEF_FONDO · r)
//
// El primer suavizado borra lo que es más chico que la escala elegida; restar
// el segundo saca el fondo: la iluminación despareja y la pendiente general de
// la roca. Queda lo que tiene el tamaño elegido, positivo donde es más claro
// que su entorno y negativo donde es más oscuro. Cada suavizado son tres
// pasadas de promedio en caja de radio r, que equivalen a una gaussiana de
// σ ≈ r. Antes se resta la tendencia cuadrática de toda la foto
// (quitarTendencia), para que el fondo también se vaya junto a los bordes.
//
// r sale de la escala como fracción del lado mayor y no en píxeles: la misma
// foto a 2000 px o a resolución completa da el mismo relieve, y el lote puede
// reducir las fotos sin cambiar lo que se ve.
//
// La salida es gris: 128 es el nivel del entorno, y cada desvío robusto
// (IQR/1.349) vale 40 · intensidad/1.5 niveles. El centro (punto medio entre
// cuartiles) y el desvío salen de la zona seleccionada si la hay, y en el lote
// quedan congelados de la referencia.
//
// Trabaja sobre el brillo, no sobre la altura: muestra lo que la foto registra
// como más claro o más oscuro a esa escala. Con luz rasante eso es relieve; con
// luz difusa, pátina y picado. Ver docs/LIMITACIONES.md.
//
// Opciones (v3.8.0), todas apagadas por defecto; apagadas, la salida es byte a
// byte la de v3.7:
//   doble (0–1): suma a la escala elegida (textura) otra RELIEF_OBJETO veces
//     mayor (objeto), cada una en desvíos de su propio entorno; el número es
//     el peso del objeto. Después se vuelve a normalizar la suma.
//   suave: los extremos se comprimen con asinh en vez de recortarse.
//   clahe: CLAHE sobre el resultado. Realza, pero deja de ser una medida.
//   mezcla ("dslab" o "lds") y alfa (0–1): el relieve entra como luminosidad
//     de ese filtro de color, en proporción alfa; el color queda del filtro.
function reliefEscala(imageData, intensity, mask, store, escala, opts) {
  const o = opts || {};
  const data = imageData.data, w = imageData.width, h = imageData.height, n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = 0.299*data[i*4] + 0.587*data[i*4+1] + 0.114*data[i*4+2];
  quitarTendencia(lum, w, h);
  const estad = (D) => { const q = tukeyFences(D, n, mask, 0); return { mid: (q.lo + q.hi) / 2, sig: (q.hi - q.lo) / 1.349 || 1 }; };   // k = 0: Q1 y Q3
  let st = store && store.frozen, D;
  if (o.doble == null) {
    D = relieveBanda(lum, w, h, escala, false);
    if (!st) { st = estad(D); if (store) store.frozen = st; }
  } else {
    const p = Math.max(0, Math.min(1, o.doble));
    D = relieveBanda(lum, w, h, escala, true);
    const obj = relieveBanda(lum, w, h, escala * RELIEF_OBJETO, false);
    if (!st) st = { textura: estad(D), objeto: estad(obj) };
    const t = st.textura, b = st.objeto;
    for (let i = 0; i < n; i++) D[i] = (1 - p) * (D[i] - t.mid) / t.sig + p * (obj[i] - b.mid) / b.sig;
    if (st.mid == null) Object.assign(st, estad(D));
    if (store) store.frozen = st;
  }
  const g = 40 * intensity / 1.5 / st.sig;
  const output = new Uint8ClampedArray(data.length);
  if (!o.suave) {
    for (let i = 0; i < n; i++) {
      const v = 128 + (D[i] - st.mid) * g;
      output[i*4] = v; output[i*4+1] = v; output[i*4+2] = v; output[i*4+3] = 255;
    }
  } else {
    // Pendiente ~1 en el centro; lo que antes se recortaba a 127 niveles del
    // gris medio llega hasta RELIEF_SUAVE_TOPE veces más lejos antes de saturar
    const K = RELIEF_SUAVE_K, A = 127 / Math.asinh(127 * RELIEF_SUAVE_TOPE / K);
    for (let i = 0; i < n; i++) {
      const v = 128 + A * Math.asinh((D[i] - st.mid) * g / K);
      output[i*4] = v; output[i*4+1] = v; output[i*4+2] = v; output[i*4+3] = 255;
    }
  }
  let out = new ImageData(output, w, h);
  if (o.clahe) out = claheEnhance(out, 1.5);
  if (o.mezcla === "dslab" || o.mezcla === "lds") {
    // El filtro de color, con su intensidad por defecto y la misma zona; en el
    // lote, con sus estadísticas congeladas junto a las del relieve
    const sub = { frozen: st.color || null };
    const col = (o.mezcla === "lds" ? ldsEnhance : dsLabEnhance)(imageData, 1.5, mask, sub);
    st.color = sub.frozen;
    if (store) store.frozen = st;
    const a = o.alfa == null ? 0.5 : Math.max(0, Math.min(1, o.alfa));
    const Lgris = new Float64Array(256);
    for (let v = 0; v < 256; v++) Lgris[v] = rgb2lab(v, v, v)[0];
    const s = out.data, c = col.data, mix = new Uint8ClampedArray(data.length);
    for (let i = 0; i < n; i++) {
      const q = i * 4, lab = rgb2lab(c[q], c[q+1], c[q+2]);
      const rgb = lab2rgb((1 - a) * lab[0] + a * Lgris[s[q]], lab[1], lab[2]);
      mix[q] = rgb[0]; mix[q+1] = rgb[1]; mix[q+2] = rgb[2]; mix[q+3] = 255;
    }
    out = new ImageData(mix, w, h);
  }
  return out;
}

// El pasabanda del Relieve: suavizado(r) − suavizado(RELIEF_FONDO · r) sobre la
// luminancia ya sin tendencia. Cada suavizado son tres pasadas de promedio en
// caja. Con conservar = false usa lum de intermedio para el fondo (lo deja
// inservible), que es lo que hacía v3.7 y ahorra memoria; el Relieve doble lo
// conserva para la segunda escala.
function relieveBanda(lum, w, h, escala, conservar) {
  const n = w * h, fino = new Float32Array(n), fondo = new Float32Array(n), tmp = new Float32Array(n);
  const aux = conservar ? new Float32Array(n) : lum;
  const r = Math.max(1, Math.round(Math.max(w, h) * escala / 200)), R = r * RELIEF_FONDO;
  boxBlur(lum, fino, tmp, w, h, r); boxBlur(fino, fondo, tmp, w, h, r); boxBlur(fondo, fino, tmp, w, h, r);
  boxBlur(lum, fondo, tmp, w, h, R); boxBlur(fondo, aux, tmp, w, h, R); boxBlur(aux, fondo, tmp, w, h, R);
  for (let i = 0; i < n; i++) fino[i] -= fondo[i];
  return fino;
}

// Las opciones del Relieve tal como viajan al filtro, al lote y al registro.
// Solo lleva las prendidas, así que con todo apagado queda {escala} como en
// v3.7: mismo registro y mismo nombre de archivo. Sin escala no valen.
// o: {doble (peso del objeto, 0–1, o null), suave, clahe, mezcla, alfa}
function opcionesRelieve(escala, o) {
  const r = { escala };
  if (!escala || !o) return r;
  if (o.doble != null) r.doble = o.doble;
  if (o.suave) r.suave = true;
  if (o.clahe) r.clahe = true;
  if (o.mezcla) { r.mezcla = o.mezcla; r.alfa = o.alfa; }
  return r;
}

// Lo que el Relieve agrega al nombre del archivo: _e0.25_doble50_suave_clahe_lds50.
// Con escala 0 (bordes) no agrega nada, como en v3.6.
function sufijoRelieve(opts) {
  if (!opts || !opts.escala) return "";
  let s = `_e${opts.escala}`;
  if (opts.doble != null) s += `_doble${Math.round(opts.doble * 100)}`;
  if (opts.suave) s += "_suave";
  if (opts.clahe) s += "_clahe";
  if (opts.mezcla) s += `_${opts.mezcla}${Math.round((opts.alfa == null ? 0.5 : opts.alfa) * 100)}`;
  return s;
}

// --- Técnico ---

function ybkEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data=imageData.data,n=data.length/4,output=new Uint8ClampedArray(data.length);
  // Estadísticas de crominancia sobre la zona seleccionada (o toda la imagen)
  const Yc=new Float64Array(n),Cbc=new Float64Array(n),Crc=new Float64Array(n);
  for(let i=0;i<n;i++){
    const[y,cb,cr]=rgb2ycbcr(data[i*4],data[i*4+1],data[i*4+2]);
    Yc[i]=y;Cbc[i]=cb;Crc[i]=cr;
  }
  let mCb,mCr,mY,stdCb,stdCr;
  if (store && store.frozen) {
    ({ mCb, mCr, mY, stdCb, stdCr } = store.frozen);
  } else {
    const sY=meanStd1(Yc,n,mask), sCb=meanStd1(Cbc,n,mask), sCr=meanStd1(Crc,n,mask);
    mCb=sCb.mean;mCr=sCr.mean;mY=sY.mean;stdCb=sCb.std;stdCr=sCr.std;
    if (store) store.frozen = { mCb, mCr, mY, stdCb, stdCr };
  }
  // Factor de amplificación agresivo: normalizar crominancia y luego escalar
  const chromaBoost = intensity * 3.0; // 3x más agresivo que antes
  const lumaContrast = 1 + (intensity - 1) * 0.6; // contraste en luminancia
  for(let i=0;i<n;i++){
    // Ecualizar crominancia: centrar, normalizar por std, escalar agresivamente
    const cb = 128 + ((Cbc[i] - mCb) / stdCb) * 40 * chromaBoost;
    const cr = 128 + ((Crc[i] - mCr) / stdCr) * 40 * chromaBoost;
    // Contraste en luminancia
    const y = mY + (Yc[i] - mY) * lumaContrast;
    const[nr,ng,nb]=ycbcr2rgb(Math.max(0,Math.min(255,y)),Math.max(0,Math.min(255,cb)),Math.max(0,Math.min(255,cr)));
    output[i*4]=nr;output[i*4+1]=ng;output[i*4+2]=nb;output[i*4+3]=255;
  }
  return new ImageData(output, imageData.width, imageData.height);
}

// LDS — Decorrelation Stretch en RGB con reproyección ecualizada
// Amplifica componentes menores manteniendo aspecto más natural que CRGB
// Factor de las vallas de Tukey en la normalización de LDS. k = 3 es la valla
// "far out" clásica: sobre datos normales recorta menos del 1% de los píxeles,
// y sobre una foto con tarjeta de color recorta la tarjeta sin tocar la roca.
const LDS_TUKEY_K = 3;

function ldsEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data, w = imageData.width, h = imageData.height, n = w * h;
  const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) { CH[0][i] = data[i*4]; CH[1][i] = data[i*4+1]; CH[2][i] = data[i*4+2]; }
  const frozen = store && store.frozen;
  let mean, ev, stds;
  if (frozen) {
    ({ mean, ev, stds } = frozen);
  } else {
    const stats = meanCov3(CH, n, mask); mask = stats.mask;
    mean = stats.mean;
    ({ ev, stds } = jacobiEigen3(stats.cov));
  }
  // La intensidad es el EXPONENTE de blanqueo, no un factor de escala.
  // Hasta v3.3.0 acá se multiplicaba por intensity*2, un factor común a las
  // tres componentes que se cancelaba exactamente contra la normalización por
  // mínimo y máximo del final: el control no tenía ningún efecto. El exponente
  // cambia la FORMA de la transformación y por eso no puede cancelarse.
  //   γ = 0  →  identidad: sin decorrelación
  //   γ = 1  →  equalización completa de varianzas (blanqueo ZCA)
  //   γ > 1  →  sobre-blanqueo: las componentes menores se amplifican de más
  // γ = intensidad/1.5 hace que el valor por defecto reproduzca exactamente la
  // salida de v3.0–v3.3.0. Tope en 2 para que el sobre-blanqueo no dispare el
  // ruido sin límite (a partir de intensidad 3.0 el control ya no cambia nada).
  const tgtStd = (stds[0]+stds[1]+stds[2])/3;
  const gamma = Math.min(2.0, intensity/1.5);
  const wPC = [0,1,2].map(k => Math.pow(tgtStd/stds[k], gamma));
  const output = new Uint8ClampedArray(data.length);
  const out = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const d0=CH[0][i]-mean[0],d1=CH[1][i]-mean[1],d2=CH[2][i]-mean[2];
    let pc0=(ev[0][0]*d0+ev[1][0]*d1+ev[2][0]*d2)*wPC[0];
    let pc1=(ev[0][1]*d0+ev[1][1]*d1+ev[2][1]*d2)*wPC[1];
    let pc2=(ev[0][2]*d0+ev[1][2]*d1+ev[2][2]*d2)*wPC[2];
    out[0][i]=mean[0]+ev[0][0]*pc0+ev[0][1]*pc1+ev[0][2]*pc2;
    out[1][i]=mean[1]+ev[1][0]*pc0+ev[1][1]*pc1+ev[1][2]*pc2;
    out[2][i]=mean[2]+ev[2][0]*pc0+ev[2][1]*pc1+ev[2][2]*pc2;
  }
  // Normalización robusta con ganancia y desplazamiento COMUNES (v3.5.0)
  //
  // Hasta v3.4.0 cada canal se estiraba entre su mínimo y su máximo absolutos.
  // Eso arrastraba dos problemas encadenados:
  //
  //  1. El blanqueo amplifica la componente principal más chica —la cromática,
  //     con σ típico de 1 a 6 frente a 40 o 60 de la primera—, así que cualquier
  //     píxel extremo queda disparado. En una foto de campo con tarjeta de color,
  //     mano o brillo especular en el encuadre, ese píxel fijaba el mínimo y el
  //     máximo y toda la superficie rupestre quedaba comprimida en un quinto de
  //     la escala: la imagen salía plana y solo la tarjeta conservaba color.
  //
  //  2. Estirar cada canal por separado corre la media de cada uno a un lugar
  //     distinto y rompe la relación de tonos. La roca marrón viraba a violeta,
  //     justo lo contrario de lo que LDS promete —reproyectar al espacio original
  //     para conservar un aspecto natural—.
  //
  // Ahora el rango se toma de las vallas de Tukey (Q1 - 3·IQR, Q3 + 3·IQR), que
  // no se mueven por más extremo que sea un objeto del encuadre, y la salida se
  // arma con una ganancia s y un desplazamiento o COMUNES a los tres canales:
  //
  //     salida_c  =  (componente_c − media_c) · s  +  media_c + o
  //
  // Al ser comunes, las diferencias entre canales se escalan por igual y el tono
  // se conserva. s es la mayor ganancia para la que existe un desplazamiento que
  // meta las vallas dentro de 0–255, y o reparte el margen sobrante entre las dos
  // puntas. Lo que queda fuera de las vallas se recorta: son los extremos, no la
  // escena. En modo lote van congelados de la referencia, igual que la matriz.
  let gain, offset;
  if (frozen && frozen.gain !== undefined) {
    gain = frozen.gain; offset = frozen.offset;
  } else {
    const hi = [0,0,0], lo = [0,0,0];
    for (let ch = 0; ch < 3; ch++) {
      const f = tukeyFences(out[ch], n, mask, LDS_TUKEY_K);
      hi[ch] = f.hi - mean[ch]; lo[ch] = f.lo - mean[ch];
    }
    const alto = (s) => Math.max(mean[0]+s*hi[0], mean[1]+s*hi[1], mean[2]+s*hi[2]);
    const bajo = (s) => Math.min(mean[0]+s*lo[0], mean[1]+s*lo[1], mean[2]+s*lo[2]);
    // s = 0 siempre es factible (el ancho es la dispersión de las medias, < 255)
    let a = 0, b = 1000;
    for (let it = 0; it < 60; it++) { const m = (a+b)/2; if (alto(m)-bajo(m) <= 255) a = m; else b = m; }
    gain = a; offset = ((255 - alto(gain)) + (0 - bajo(gain))) / 2;
  }
  for(let ch=0;ch<3;ch++){
    const base = mean[ch] + offset;
    for(let i=0;i<n;i++)output[i*4+ch]=Math.max(0,Math.min(255,Math.round((out[ch][i]-mean[ch])*gain+base)));
  }
  if (store && !store.frozen) store.frozen = { mean, ev, stds, gain, offset };
  for(let i=0;i<n;i++)output[i*4+3]=255;
  return new ImageData(output, w, h);
}

// DS-LAB — Decorrelation Stretch en CIE-LAB con mapeo directo de PCs
// Más sensible a diferencias perceptuales; PCs se mapean directo a RGB
function dsLabEnhance(imageData, intensity = 1.5, mask = null, store = null) {
  const data = imageData.data, w = imageData.width, h = imageData.height, n = w * h;
  const CH = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const [L, a, b] = rgb2lab(data[i*4], data[i*4+1], data[i*4+2]);
    CH[0][i] = L; CH[1][i] = a; CH[2][i] = b;
  }
  const frozen = store && store.frozen;
  let mean, ev, stds;
  if (frozen) {
    ({ mean, ev, stds } = frozen);
  } else {
    const stats = meanCov3(CH, n, mask); mask = stats.mask;
    mean = stats.mean;
    ({ ev, stds } = jacobiEigen3(stats.cov));
  }
  // Mapeo directo PC→RGB (como CRGB pero desde espacio LAB)
  const pc = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  for (let i = 0; i < n; i++) {
    const d0=CH[0][i]-mean[0],d1=CH[1][i]-mean[1],d2=CH[2][i]-mean[2];
    for(let k=0;k<3;k++) pc[k][i]=(ev[0][k]*d0+ev[1][k]*d1+ev[2][k]*d2)/stds[k];
  }
  const output = new Uint8ClampedArray(data.length);
  let clips;
  if (frozen) {
    clips = frozen.clips;
  } else {
    const clipStd = Math.max(0.8, 3.5 / intensity);
    clips = [];
    for(let k=0;k<3;k++){
      const st = meanStd1(pc[k], n, mask);
      clips.push({ lo:st.mean-st.std*clipStd, hi:st.mean+st.std*clipStd });
    }
    if (store) store.frozen = { mean, ev, stds, clips };
  }
  for(let k=0;k<3;k++){
    const { lo, hi } = clips[k], rng=hi-lo||1;
    for(let i=0;i<n;i++){const v=Math.max(lo,Math.min(hi,pc[k][i]));output[i*4+k]=Math.round(((v-lo)/rng)*255);}
  }
  for(let i=0;i<n;i++)output[i*4+3]=255;
  return new ImageData(output, w, h);
}

// CLAHE real (Zuiderveld 1994): ecualización adaptativa de histograma
// con límite de contraste. Grilla de 8×8 tiles, histograma de 256 bins
// por tile con recorte y redistribución, e interpolación bilineal entre
// los mapeos de los 4 tiles vecinos. La intensidad controla el clip limit.
function claheEnhance(imageData, intensity = 1.5) {
  const data=imageData.data,w=imageData.width,h=imageData.height,n=w*h;
  const output=new Uint8ClampedArray(data.length);
  const lum=new Float64Array(n);
  for(let i=0;i<n;i++)lum[i]=0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2];
  const grid=8;
  const tw=Math.ceil(w/grid), th=Math.ceil(h/grid);
  const nx=Math.ceil(w/tw), ny=Math.ceil(h/th);
  const clipFactor=1+intensity*2; // límite de recorte relativo al histograma uniforme
  const maps=new Array(nx*ny);
  for(let ty=0;ty<ny;ty++)for(let tx=0;tx<nx;tx++){
    const x0=tx*tw,y0=ty*th,x1=Math.min(w,x0+tw),y1=Math.min(h,y0+th);
    const hist=new Float64Array(256); let cnt=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){hist[Math.max(0,Math.min(255,Math.round(lum[y*w+x])))]++;cnt++;}
    if(!cnt)cnt=1;
    // Recorte del histograma y redistribución uniforme del exceso
    const clip=Math.max(1,clipFactor*cnt/256);
    let excess=0;
    for(let v=0;v<256;v++){if(hist[v]>clip){excess+=hist[v]-clip;hist[v]=clip;}}
    const add=excess/256;
    // CDF → función de mapeo del tile
    const map=new Float64Array(256); let acc=0;
    for(let v=0;v<256;v++){acc+=hist[v]+add;map[v]=acc/cnt*255;}
    maps[ty*nx+tx]=map;
  }
  for(let i=0;i<n;i++){
    const x=i%w,y=(i/w)|0;
    // Posición fraccional respecto a los centros de tile → interpolación bilineal
    const fx=Math.max(0,Math.min(nx-1,(x-tw/2)/tw)), fy=Math.max(0,Math.min(ny-1,(y-th/2)/th));
    const tx0=Math.floor(fx),ty0=Math.floor(fy),tx1=Math.min(nx-1,tx0+1),ty1=Math.min(ny-1,ty0+1);
    const ax=fx-tx0, ay=fy-ty0;
    const v=Math.max(0,Math.min(255,Math.round(lum[i])));
    const m00=maps[ty0*nx+tx0][v],m10=maps[ty0*nx+tx1][v],m01=maps[ty1*nx+tx0][v],m11=maps[ty1*nx+tx1][v];
    const newLum=(m00*(1-ax)+m10*ax)*(1-ay)+(m01*(1-ax)+m11*ax)*ay;
    const ratio=lum[i]>0.5?newLum/lum[i]:1;
    for(let ch=0;ch<3;ch++)output[i*4+ch]=Math.max(0,Math.min(255,Math.round(data[i*4+ch]*ratio)));
    output[i*4+3]=255;
  }
  return new ImageData(output,w,h);
}

function pigmentMapping(imageData, intensity = 1.5, mask = null, store = null) {
  const data=imageData.data,n=data.length/4,output=new Uint8ClampedArray(data.length);
  const lv=new Float64Array(n),av=new Float64Array(n),bv=new Float64Array(n);for(let i=0;i<n;i++){const[L,a,bL]=rgb2lab(data[i*4],data[i*4+1],data[i*4+2]);lv[i]=L;av[i]=a;bv[i]=bL;}
  const mL = (store && store.frozen) ? store.frozen.mL : meanStd1(lv, n, mask).mean;
  if (store && !store.frozen) store.frozen = { mL };
  for(let i=0;i<n;i++){const L=lv[i],a=av[i],bL=bv[i];const ch=Math.sqrt(a*a+bL*bL);if(a>8&&ch>12){const ri=Math.min(1,a/40);output[i*4]=Math.round(255*ri);output[i*4+1]=Math.round(80*(1-ri));output[i*4+2]=0;}else if(L<(mL-10)&&ch<15){const bi=Math.min(1,(mL-L)/(mL*0.6));output[i*4]=Math.round(40*(1-bi));output[i*4+1]=Math.round(200+55*bi);output[i*4+2]=Math.round(40*(1-bi));}else if(L>65&&ch<18){const wi=Math.min(1,(L-65)/35);output[i*4]=Math.round(100*(1-wi));output[i*4+1]=Math.round(200+55*wi);output[i*4+2]=Math.round(220+35*wi);}else{const g=Math.min(255,Math.round(L*1.2));output[i*4]=g;output[i*4+1]=g;output[i*4+2]=g;}output[i*4+3]=255;}
  return new ImageData(output, imageData.width, imageData.height);
}

// Ajustes post (contraste/saturación) por píxel, equivalentes exactos a los
// filtros CSS contrast()/saturate() (matriz feColorMatrix "saturate", Rec.709).
// En el lote NO se usa ctx.filter: con fotos grandes cae al render por
// software (minutos por foto, parece un cuelgue) y duplica el pico de memoria.
function applyPostAdjust(imageData, contrast, saturation) {
  if (!contrast && !saturation) return imageData;
  const d = imageData.data, n = d.length;
  const k = 1 + contrast / 100, ko = 127.5 * (1 - k);
  const s = 1 + saturation / 100;
  const sr = 0.213 * (1 - s), sg = 0.715 * (1 - s), sb = 0.072 * (1 - s);
  for (let i = 0; i < n; i += 4) {
    const r = d[i] * k + ko, g = d[i+1] * k + ko, b = d[i+2] * k + ko;
    const lum = sr * r + sg * g + sb * b;
    // Uint8ClampedArray recorta y redondea solo
    d[i] = lum + s * r; d[i+1] = lum + s * g; d[i+2] = lum + s * b;
  }
  return imageData;
}

// Gotero cromático — realce o atenuación selectiva de una familia de color
//
// Trabaja sobre el plano de crominancia Cb-Cr de YCbCr: la luminancia queda
// intacta, así que el relieve y la textura de la roca no se tocan; solo cambia
// cuánto color tiene cada píxel. La familia de color se define por la distancia
// euclídea a la crominancia muestreada:
//
//   peso = 1                      si  d ≤ tolerancia
//        = smoothstep decreciente si  tolerancia < d < tolerancia·(1+suavizado)
//        = 0                      si  d ≥ tolerancia·(1+suavizado)
//
// y la crominancia se multiplica por 1 + (ganancia/100)·peso, con la ganancia
// positiva escalada ×2 para que +100 llegue a triplicar el color y −100 lo deje
// exactamente en gris. El realce se frena en el límite del gamut, así que la
// luminancia se conserva exactamente: no hay zonas quemadas y la textura de la
// roca no se altera. El suavizado evita el borde duro que delataría la
// selección como un recorte artificial.
//
// Se eligió Cb-Cr y no CIE-LAB por velocidad: la conversión es lineal y corre
// en ~30 ms sobre 3 Mpx, contra ~2800 ms del ida y vuelta a LAB, que haría
// inusables los deslizadores. Sobre una imagen ya decorrelacionada —falso color
// por definición— la uniformidad perceptual de LAB no aporta nada.
//
// ADVERTENCIA METODOLÓGICA: la selección se hace sobre una imagen YA
// transformada. La máscara describe el color que produjo el filtro, no la
// composición del pigmento. Ver docs/LIMITACIONES.md.
function chromaTarget(imageData, pick, tol, feather, gain) {
  if (!pick || !gain) return { data: imageData, coverage: 0 };
  const d = imageData.data, n = d.length;
  const cb0 = -0.168736*pick.r - 0.331264*pick.g + 0.5*pick.b;
  const cr0 = 0.5*pick.r - 0.418688*pick.g - 0.081312*pick.b;
  const tolOut = tol * (1 + feather/100);
  const amp = gain > 0 ? gain/50 : gain/100;   // +100 → ×3 ; −100 → gris
  let alcanzados = 0;
  for (let i = 0; i < n; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const y  = 0.299*r + 0.587*g + 0.114*b;
    const cb = -0.168736*r - 0.331264*g + 0.5*b;
    const cr = 0.5*r - 0.418688*g - 0.081312*b;
    const dx = cb - cb0, dy = cr - cr0;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist >= tolOut) continue;
    let peso = 1;
    if (dist > tol) { const u = (dist - tol) / (tolOut - tol); peso = 1 - u*u*(3 - 2*u); }
    alcanzados += peso;
    let f = 1 + amp * peso;
    // Tope de gamut: el realce se frena justo antes de que algún canal se salga
    // de 0-255. Sin este tope, el recorte de Uint8ClampedArray movería la
    // luminancia —el color se "quemaría" y con él el relieve de la roca—. Como
    // el color original ya está dentro del gamut, el tope nunca baja de 1 y la
    // atenuación (f < 1) no se ve afectada.
    if (f > 1) {
      const kr = 1.402*cr, kg = -0.344136*cb - 0.714136*cr, kb = 1.772*cb;
      let fMax = f;
      for (const k of [kr, kg, kb]) {
        if (k > 1e-9) fMax = Math.min(fMax, (255 - y) / k);
        else if (k < -1e-9) fMax = Math.min(fMax, -y / k);
      }
      f = Math.max(1, fMax);
    }
    const ncb = cb * f, ncr = cr * f;
    // Uint8ClampedArray recorta y redondea solo
    d[i]   = y + 1.402*ncr;
    d[i+1] = y - 0.344136*ncb - 0.714136*ncr;
    d[i+2] = y + 1.772*ncb;
  }
  return { data: imageData, coverage: alcanzados / (n/4) };
}

// Cadena de ajustes del gotero: se aplican en orden sobre el resultado del
// filtro. Cada ajuste fijado es una regla —color, tolerancia, suavizado,
// ganancia—, no una imagen: la vista se recalcula siempre desde el resultado
// original del filtro, así que quitar un ajuste del medio revierte exactamente
// su efecto y deja intactos los demás. Es lo que hace que el gotero sea
// reversible sin guardar copias intermedias.
//
// `enCurso` es el ajuste que se está regulando con los deslizadores y todavía
// no se fijó; va último, sobre todos los ya fijados.
function applyPickChain(imageData, fijados, enCurso) {
  if (fijados) for (const a of fijados) chromaTarget(imageData, a, a.tol, a.feather, a.gain);
  const cob = (enCurso && enCurso.gain)
    ? chromaTarget(imageData, enCurso, enCurso.tol, enCurso.feather, enCurso.gain).coverage
    : 0;
  return { data: imageData, coverage: cob };
}

// ============================================================
// EXIF / GPS PARSER
// ============================================================

// Extrae el segmento APP1 (EXIF) crudo de un JPEG, incluyendo marcador y
// longitud, para reinyectarlo en el JPG exportado y no perder GPS/fecha.
function extractExifSegment(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return null;
  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) { const length = view.getUint16(offset + 2); return new Uint8Array(arrayBuffer.slice(offset, Math.min(view.byteLength, offset + 2 + length))); }
    if ((marker & 0xFF00) !== 0xFF00) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function parseExifData(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0) !== 0xFFD8) return null;
  let offset = 2;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) { const length = view.getUint16(offset + 2); return parseExifBlock(arrayBuffer, offset + 4, length - 2); }
    if ((marker & 0xFF00) !== 0xFF00) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function parseExifBlock(buffer, start, length) {
  const view = new DataView(buffer, start, Math.min(length, buffer.byteLength - start));
  if (view.getUint32(0) !== 0x45786966 || view.getUint16(4) !== 0x0000) return null;
  const tiffStart = start + 6, tiffView = new DataView(buffer, tiffStart);
  const le = tiffView.getUint16(0) === 0x4949;
  const ifdOff = tiffView.getUint32(4, le);
  const result = { dateTime: null, gps: null };
  const ifd0 = parseIFD(buffer, tiffStart, ifdOff, le);
  if (ifd0[0x0132]) result.dateTime = ifd0[0x0132];
  if (ifd0[0x8769]) { const exifIFD = parseIFD(buffer, tiffStart, ifd0[0x8769], le); if (exifIFD[0x9003]) result.dateTime = exifIFD[0x9003]; else if (exifIFD[0x9004]) result.dateTime = exifIFD[0x9004]; }
  if (ifd0[0x8825]) { const gpsIFD = parseIFD(buffer, tiffStart, ifd0[0x8825], le); result.gps = extractGPS(gpsIFD); }
  return result;
}

function parseIFD(buffer, tiffStart, ifdOffset, le) {
  const view = new DataView(buffer, tiffStart); const entries = {};
  try { const count = view.getUint16(ifdOffset, le);
    for (let i = 0; i < count; i++) { const eOff = ifdOffset + 2 + i * 12, tag = view.getUint16(eOff, le), type = view.getUint16(eOff + 2, le), numV = view.getUint32(eOff + 4, le), vOff = eOff + 8;
      const typeSize = { 1:1, 2:1, 3:2, 4:4, 5:8, 7:1, 10:8 }; const totalBytes = (typeSize[type] || 1) * numV;
      const realOff = totalBytes > 4 ? tiffStart + view.getUint32(vOff, le) : tiffStart + eOff + 8;
      if (type === 2) { let str = ""; for (let j = 0; j < numV - 1; j++) { const cc = new DataView(buffer).getUint8(realOff + j); if (cc === 0) break; str += String.fromCharCode(cc); } entries[tag] = str;
      } else if (type === 3) { entries[tag] = view.getUint16(vOff, le);
      } else if (type === 4) { entries[tag] = view.getUint32(vOff, le);
      } else if (type === 5) { const rV = new DataView(buffer, realOff); if (numV === 1) { entries[tag] = rV.getUint32(0, le) / (rV.getUint32(4, le) || 1); } else { const rats = []; for (let j = 0; j < numV; j++) rats.push(rV.getUint32(j*8, le) / (rV.getUint32(j*8+4, le) || 1)); entries[tag] = rats; }
      } else if (type === 1) { entries[tag] = new DataView(buffer).getUint8(realOff); }
    }
  } catch (e) {}
  return entries;
}

function extractGPS(gpsIFD) {
  const latRef = gpsIFD[1] || "N", lat = gpsIFD[2], lonRef = gpsIFD[3] || "W", lon = gpsIFD[4], alt = gpsIFD[6];
  if (!lat || !lon || !Array.isArray(lat) || !Array.isArray(lon)) return null;
  const toD = (dms, ref) => { const d = dms[0] + dms[1]/60 + (dms[2]||0)/3600; return (ref==="S"||ref==="W") ? -d : d; };
  return { latitude: toD(lat, latRef), longitude: toD(lon, lonRef), altitude: typeof alt === "number" ? alt : null, latRef, lonRef };
}

function formatGPSCoord(decimal, isLat) {
  const abs = Math.abs(decimal), d = Math.floor(abs), m = Math.floor((abs-d)*60), s = ((abs-d-m/60)*3600).toFixed(1);
  return `${d}\u00B0 ${m}' ${s}" ${isLat ? (decimal>=0?"N":"S") : (decimal>=0?"E":"W")}`;
}

// ============================================================
// REGISTRO DE SESIÓN (v3.8.0)
// ============================================================
// Cada imagen exportada lleva adentro un registro con todo lo necesario para
// rehacerla: versión, foto de entrada y su huella, resolución de trabajo,
// cadena de filtros con sus parámetros, zona seleccionada, gotero y ajustes.
// Va también al lado, como .json, y el lote agrega un .csv con una fila por
// foto. Cargando la foto original y el registro, OPC rehace la imagen y
// comprueba que salga igual (docs/LIMITACIONES.md §9).
//
// Las huellas son SHA-256. Se guardan dos de cada imagen:
//   - la del archivo, que identifica la foto exacta que se usó;
//   - la de los píxeles (RGB de 8 bits, fila por fila, sin alfa), que es la
//     que importa para comparar resultados: dos navegadores pueden guardar los
//     mismos píxeles en dos PNG distintos, porque comprimen distinto. Es la
//     misma cuenta que hashlib.sha256(np.asarray(img.convert("RGB")).tobytes())
//     en Python, así que se puede verificar fuera de OPC.

// SHA-256 (FIPS 180-4) en JavaScript puro. El navegador tiene uno propio
// (crypto.subtle), más rápido, pero solo en contextos seguros: abierto como
// archivo local puede faltar. Este da exactamente el mismo resultado.
function sha256Hex(bytes) {
  const K = sha256Hex.K || (sha256Hex.K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]));
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const W = new Uint32Array(64);
  const bloque = (b, o) => {
    for (let t = 0; t < 16; t++) W[t] = (b[o+4*t] << 24) | (b[o+4*t+1] << 16) | (b[o+4*t+2] << 8) | b[o+4*t+3];
    for (let t = 16; t < 64; t++) {
      const x = W[t-15], y = W[t-2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      W[t] = (W[t-16] + s0 + W[t-7] + s1) | 0;
    }
    let a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[t] + W[t]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const t2 = (S0 + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  };
  const n = bytes.length, completos = n - (n % 64);
  for (let o = 0; o < completos; o += 64) bloque(bytes, o);
  // Cola: lo que sobra, el bit 1, ceros y el largo en bits (64 bits, big-endian)
  const cola = new Uint8Array((n % 64) < 56 ? 64 : 128);
  cola.set(bytes.subarray(completos)); cola[n % 64] = 0x80;
  const bits = n * 8, hi = Math.floor(bits / 4294967296), lo = bits >>> 0, L = cola.length;
  cola[L-8] = hi >>> 24; cola[L-7] = hi >>> 16; cola[L-6] = hi >>> 8; cola[L-5] = hi;
  cola[L-4] = lo >>> 24; cola[L-3] = lo >>> 16; cola[L-2] = lo >>> 8; cola[L-1] = lo;
  for (let o = 0; o < L; o += 64) bloque(cola, o);
  let s = "";
  for (let i = 0; i < 8; i++) s += H[i].toString(16).padStart(8, "0");
  return s;
}

// Los píxeles RGB de una imagen RGBA, sin el alfa: lo que entra en la huella
function pixelesRGB(rgba) {
  const n = rgba.length >> 2, out = new Uint8Array(n * 3);
  for (let i = 0, j = 0; i < n; i++, j += 3) { out[j] = rgba[i*4]; out[j+1] = rgba[i*4+1]; out[j+2] = rgba[i*4+2]; }
  return out;
}

// CRC-32 de los bloques PNG (ISO 3309, polinomio 0xEDB88320)
function crc32(bytes) {
  let T = crc32.T;
  if (!T) {
    T = crc32.T = new Uint32Array(256);
    for (let k = 0; k < 256; k++) { let c = k; for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[k] = c >>> 0; }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = T[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Nombre con que el registro va dentro de cada formato (bloque iTXt del PNG,
// segmentos de comentario del JPG) y valor del campo «formato» del JSON
const REGISTRO_CLAVE = "OPC-registro";

// PNG: el registro va en un bloque iTXt (texto UTF-8 sin comprimir), justo
// antes del IEND. Los visores lo ignoran; exiftool y similares lo muestran.
function pngConRegistro(png, texto) {
  const clave = new TextEncoder().encode(REGISTRO_CLAVE), cuerpo = new TextEncoder().encode(texto);
  // clave \0, sin compresión (0, 0), idioma "" \0, clave traducida "" \0, texto
  const datos = new Uint8Array(clave.length + 5 + cuerpo.length);
  datos.set(clave, 0); datos.set(cuerpo, clave.length + 5);
  const tipoYDatos = new Uint8Array(4 + datos.length);
  tipoYDatos.set([0x69, 0x54, 0x58, 0x74], 0); tipoYDatos.set(datos, 4);   // "iTXt"
  const bloque = new Uint8Array(12 + datos.length), v = new DataView(bloque.buffer);
  v.setUint32(0, datos.length); bloque.set(tipoYDatos, 4); v.setUint32(8 + datos.length, crc32(tipoYDatos));
  // Posición del IEND: se recorren los bloques desde la firma de 8 bytes
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let o = 8, iend = -1;
  while (o + 8 <= png.length) {
    const largo = dv.getUint32(o), tipo = String.fromCharCode(png[o+4], png[o+5], png[o+6], png[o+7]);
    if (tipo === "IEND") { iend = o; break; }
    o += 12 + largo;
  }
  if (iend < 0) throw new Error("PNG sin IEND");
  const out = new Uint8Array(png.length + bloque.length);
  out.set(png.subarray(0, iend), 0); out.set(bloque, iend); out.set(png.subarray(iend), iend + bloque.length);
  return out;
}

// JPG: un segmento de comentario (COM) tiene como máximo 65 533 bytes, así que
// el registro se reparte en varios si hace falta —una selección a mano alzada
// puede tener miles de puntos—. Cada uno empieza con «OPC-registro k/N» y un
// salto de línea. Van después de los segmentos APPn del principio (EXIF, JFIF).
function jpegConRegistro(jpg, texto) {
  const cuerpo = new TextEncoder().encode(texto), TROZO = 65000;
  const total = Math.max(1, Math.ceil(cuerpo.length / TROZO)), segs = [];
  for (let k = 0; k < total; k++) {
    const cab = new TextEncoder().encode(`${REGISTRO_CLAVE} ${k + 1}/${total}\n`);
    const trozo = cuerpo.subarray(k * TROZO, (k + 1) * TROZO);
    const seg = new Uint8Array(4 + cab.length + trozo.length);
    seg[0] = 0xFF; seg[1] = 0xFE;
    const largo = 2 + cab.length + trozo.length; seg[2] = largo >> 8; seg[3] = largo & 0xFF;
    seg.set(cab, 4); seg.set(trozo, 4 + cab.length);
    segs.push(seg);
  }
  if (jpg[0] !== 0xFF || jpg[1] !== 0xD8) throw new Error("JPG sin SOI");
  let o = 2;
  while (o + 4 <= jpg.length && jpg[o] === 0xFF && jpg[o+1] >= 0xE0 && jpg[o+1] <= 0xEF) o += 2 + ((jpg[o+2] << 8) | jpg[o+3]);
  const extra = segs.reduce((s, x) => s + x.length, 0), out = new Uint8Array(jpg.length + extra);
  out.set(jpg.subarray(0, o), 0);
  let p = o; for (const s of segs) { out.set(s, p); p += s.length; }
  out.set(jpg.subarray(o), p);
  return out;
}

// TIFF RGB de 8 bits sin comprimir, una sola tira. Sin descripción da el mismo
// archivo que el codificador de v3.1–v3.7.3; con ella agrega la etiqueta 270
// (ImageDescription), que es ASCII: lo que no lo es se escribe como \uXXXX, que
// sigue siendo un JSON válido.
function tiffRGB(rgba, w, h, descripcion) {
  let desc = null;
  if (descripcion) {
    const ascii = descripcion.replace(/[^\x20-\x7e\n]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
    desc = new Uint8Array(ascii.length + 1);
    for (let i = 0; i < ascii.length; i++) desc[i] = ascii.charCodeAt(i);
  }
  const pixelBytes = w * h * 3;
  const ifdOffset = 8, ifdEntries = desc ? 13 : 12, ifdSize = 2 + ifdEntries * 12 + 4;
  // Área de valores fuera de línea (BitsPerSample necesita 3 SHORTs,
  // X/YResolution son RATIONAL de 8 bytes según spec TIFF 6.0)
  const bitsOffset = ifdOffset + ifdSize;
  const xresOffset = bitsOffset + 8;   // 6 bytes + 2 de alineación
  const yresOffset = xresOffset + 8;
  const descOffset = yresOffset + 8;
  const stripOffset = descOffset + (desc ? desc.length + (desc.length & 1) : 0);
  const buf = new ArrayBuffer(stripOffset + pixelBytes), view = new DataView(buf), u8 = new Uint8Array(buf);
  // Header: little-endian TIFF
  view.setUint16(0, 0x4949, false); view.setUint16(2, 42, true); view.setUint32(4, ifdOffset, true);
  let off = ifdOffset;
  view.setUint16(off, ifdEntries, true); off += 2;
  const writeIFD = (tag, type, count, value) => {
    view.setUint16(off, tag, true); view.setUint16(off + 2, type, true);
    view.setUint32(off + 4, count, true); view.setUint32(off + 8, value, true); off += 12;
  };
  // Las etiquetas van en orden creciente, como pide la especificación
  writeIFD(256, 3, 1, w);            // ImageWidth
  writeIFD(257, 3, 1, h);            // ImageLength
  writeIFD(258, 3, 3, bitsOffset);   // BitsPerSample [8,8,8]
  writeIFD(259, 3, 1, 1);            // Compression: none
  writeIFD(262, 3, 1, 2);            // PhotometricInterpretation: RGB
  if (desc) writeIFD(270, 2, desc.length, descOffset);   // ImageDescription
  writeIFD(273, 4, 1, stripOffset);  // StripOffsets
  writeIFD(277, 3, 1, 3);            // SamplesPerPixel
  writeIFD(278, 4, 1, h);            // RowsPerStrip
  writeIFD(279, 4, 1, pixelBytes);   // StripByteCounts
  writeIFD(282, 5, 1, xresOffset);   // XResolution: RATIONAL 72/1
  writeIFD(283, 5, 1, yresOffset);   // YResolution: RATIONAL 72/1
  writeIFD(296, 3, 1, 2);            // ResolutionUnit: pulgadas
  view.setUint32(off, 0, true);      // no hay otro IFD
  view.setUint16(bitsOffset, 8, true); view.setUint16(bitsOffset+2, 8, true); view.setUint16(bitsOffset+4, 8, true);
  view.setUint32(xresOffset, 72, true); view.setUint32(xresOffset+4, 1, true);
  view.setUint32(yresOffset, 72, true); view.setUint32(yresOffset+4, 1, true);
  if (desc) u8.set(desc, descOffset);
  let pOff = stripOffset;
  for (let i = 0; i < w * h; i++) { u8[pOff++] = rgba[i*4]; u8[pOff++] = rgba[i*4+1]; u8[pOff++] = rgba[i*4+2]; }
  return u8;
}

// Lee el registro de un .json, o de un PNG, JPG o TIFF exportados por OPC.
// Devuelve el objeto, o null si el archivo no trae ninguno.
function leerRegistro(bytes) {
  const comoRegistro = (texto) => {
    try { const r = JSON.parse(texto); return (r && r.formato === REGISTRO_CLAVE) ? r : null; } catch (e) { return null; }
  };
  const dec = new TextDecoder("utf-8");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // PNG
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    let o = 8;
    while (o + 8 <= bytes.length) {
      const largo = dv.getUint32(o), tipo = String.fromCharCode(bytes[o+4], bytes[o+5], bytes[o+6], bytes[o+7]);
      if (tipo === "iTXt") {
        const d = bytes.subarray(o + 8, o + 8 + largo);
        let z = d.indexOf(0);
        if (z > 0 && dec.decode(d.subarray(0, z)) === REGISTRO_CLAVE && d[z + 1] === 0) {
          let p = z + 3;                       // flag y método de compresión
          p = d.indexOf(0, p) + 1;             // idioma
          p = d.indexOf(0, p) + 1;             // clave traducida
          if (p > 0) return comoRegistro(dec.decode(d.subarray(p)));
        }
      }
      if (tipo === "IEND") break;
      o += 12 + largo;
    }
    return null;
  }
  // JPG: se juntan los segmentos de comentario del registro, en orden
  if (bytes.length > 4 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
    const trozos = [];
    let o = 2;
    while (o + 4 <= bytes.length && bytes[o] === 0xFF) {
      const m = bytes[o+1];
      if (m === 0xDA || m === 0xD9) break;   // empieza la imagen: no hay más metadatos
      const largo = (bytes[o+2] << 8) | bytes[o+3];
      if (m === 0xFE) {
        const d = bytes.subarray(o + 4, o + 2 + largo), nl = d.indexOf(10);
        const cab = nl > 0 ? dec.decode(d.subarray(0, nl)) : "";
        const mm = cab.match(/^OPC-registro (\d+)\/(\d+)$/);
        if (mm) trozos.push({ k: +mm[1], datos: d.subarray(nl + 1) });
      }
      o += 2 + largo;
    }
    if (!trozos.length) return null;
    trozos.sort((a, b) => a.k - b.k);
    const total = trozos.reduce((s, t) => s + t.datos.length, 0), todo = new Uint8Array(total);
    let p = 0; for (const t of trozos) { todo.set(t.datos, p); p += t.datos.length; }
    return comoRegistro(dec.decode(todo));
  }
  // TIFF (II o MM): la etiqueta 270 del primer IFD
  if (bytes.length > 8 && ((bytes[0] === 0x49 && bytes[1] === 0x49) || (bytes[0] === 0x4D && bytes[1] === 0x4D))) {
    const le = bytes[0] === 0x49, ifd = dv.getUint32(4, le), cuenta = dv.getUint16(ifd, le);
    for (let i = 0; i < cuenta; i++) {
      const e = ifd + 2 + i * 12;
      if (dv.getUint16(e, le) !== 270) continue;
      const n = dv.getUint32(e + 4, le), off = n > 4 ? dv.getUint32(e + 8, le) : e + 8;
      let s = ""; for (let j = 0; j < n && bytes[off + j]; j++) s += String.fromCharCode(bytes[off + j]);
      return comoRegistro(s);
    }
    return null;
  }
  // JSON suelto (con o sin BOM)
  let i = 0;
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) i = 3;
  while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0A || bytes[i] === 0x0D)) i++;
  return bytes[i] === 0x7B ? comoRegistro(dec.decode(bytes.subarray(i))) : null;
}

// Selección del visor → registro. Las coordenadas van en fracción del ancho y
// del alto (0–1), que es como las guarda la aplicación: la máscara se vuelve a
// trazar a la resolución de trabajo. caja_px es solo para leerla a ojo.
function seleccionARegistro(sel, w, h) {
  if (!sel) return null;
  if (sel.type === "free") {
    const xs = sel.points.map(p => p.x), ys = sel.points.map(p => p.y);
    return { tipo: "free", puntos: sel.points.map(p => [p.x, p.y]),
      caja_px: [Math.round(Math.min(...xs) * w), Math.round(Math.min(...ys) * h), Math.round(Math.max(...xs) * w), Math.round(Math.max(...ys) * h)] };
  }
  return { tipo: sel.type, x1: sel.x1, y1: sel.y1, x2: sel.x2, y2: sel.y2,
    caja_px: [Math.round(Math.min(sel.x1, sel.x2) * w), Math.round(Math.min(sel.y1, sel.y2) * h), Math.round(Math.max(sel.x1, sel.x2) * w), Math.round(Math.max(sel.y1, sel.y2) * h)] };
}

function seleccionDesdeRegistro(s) {
  if (!s) return null;
  if (s.tipo === "free") return { type: "free", points: s.puntos.map(([x, y]) => ({ x, y })) };
  return { type: s.tipo, x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 };
}

// Arma el registro a partir del estado de la aplicación. d:
//   version, fecha, entrada {archivo, bytes, sha256, ancho, alto},
//   trabajo {resolucion o lado_max, ancho, alto, sha256_pixeles},
//   pasos [{presetId, intensity, opts, frozen, sel}] (el pipeline),
//   gotero [{r, g, b, tol, feather, gain}], contraste, saturacion,
//   metodoAjustes ("filtro_css" en la descarga suelta, "por_pixel" en el lote),
//   salida {archivo, formato, sha256_pixeles}, lote (o null),
//   tamSeleccion {ancho, alto}: tamaño sobre el que se dibujó la selección,
//   si no es el de trabajo (en el lote, el de la foto de referencia),
//   escala: la escala métrica (escalaARegistro) o null
function armarRegistro(d) {
  const ts = d.tamSeleccion || d.trabajo, tw = ts ? ts.ancho : 0, th = ts ? ts.alto : 0;
  return {
    formato: REGISTRO_CLAVE,
    version_formato: 1,
    opc: { version: d.version, sitio: "https://emilios81.github.io/opuntiacolor/" },
    fecha: d.fecha,
    entrada: d.entrada || null,
    trabajo: d.trabajo || null,
    escala: d.escala || null,
    pasos: d.pasos.map(p => ({
      filtro: p.presetId,
      intensidad: p.intensity,
      opciones: p.opts || null,
      seleccion: seleccionARegistro(p.sel, tw, th),
      estadisticas: p.frozen || null,
    })),
    gotero: (d.gotero || []).map(a => ({ r: a.r, g: a.g, b: a.b, tolerancia: a.tol, suavizado: a.feather, ganancia: a.gain })),
    ajustes: { contraste: d.contraste || 0, saturacion: d.saturacion || 0, metodo: d.metodoAjustes },
    salida: d.salida || null,
    lote: d.lote || null,
  };
}

// Lo inverso, para rehacer la imagen: el pipeline y la cadena del gotero
function pasosDesdeRegistro(r) {
  return r.pasos.map(p => ({ presetId: p.filtro, intensity: p.intensidad, opts: p.opciones || null,
    frozen: p.estadisticas || null, sel: seleccionDesdeRegistro(p.seleccion) }));
}

function goteroDesdeRegistro(r) {
  return (r.gotero || []).map(a => ({ r: a.r, g: a.g, b: a.b, tol: a.tolerancia, feather: a.suavizado, gain: a.ganancia }));
}

// Escala métrica (v3.8.0): dos puntos marcados sobre la escala de la foto y
// los milímetros que hay entre ellos. Los puntos van en fracción del ancho y
// del alto (0–1), como la selección, así que la calibración vale a cualquier
// resolución de trabajo: los píxeles por milímetro se recalculan con el tamaño
// de cada una. No toca el procesamiento; solo queda en el registro y en los
// textos del panel. cal: {p1: {x, y}, p2: {x, y}, mm}
function pxPorMM(cal, w, h) {
  if (!cal || !cal.p1 || !cal.p2 || !(cal.mm > 0) || !(w > 0) || !(h > 0)) return 0;
  const d = Math.hypot((cal.p2.x - cal.p1.x) * w, (cal.p2.y - cal.p1.y) * h);
  return d > 0 ? d / cal.mm : 0;
}

// original y trabajo: {ancho, alto}. Los puntos en píxeles de la foto original
// y los valores redondeados son para leer a ojo; para rehacer se usan los
// puntos en fracción y distancia_mm.
function escalaARegistro(cal, original, trabajo) {
  const po = pxPorMM(cal, original.ancho, original.alto), pt = pxPorMM(cal, trabajo.ancho, trabajo.alto);
  if (!po || !pt) return null;
  const red = (v, n) => Math.round(v * Math.pow(10, n)) / Math.pow(10, n);
  const px = (p) => [red(p.x * original.ancho, 1), red(p.y * original.alto, 1)];
  return {
    distancia_mm: cal.mm,
    puntos: [[cal.p1.x, cal.p1.y], [cal.p2.x, cal.p2.y]],
    puntos_px_original: [px(cal.p1), px(cal.p2)],
    px_por_mm_original: red(po, 4),
    px_por_mm_trabajo: red(pt, 4),
    mm_por_px_trabajo: red(1 / pt, 6),
  };
}

function escalaDesdeRegistro(e) {
  if (!e || !Array.isArray(e.puntos) || e.puntos.length !== 2 || !(e.distancia_mm > 0)) return null;
  const [[x1, y1], [x2, y2]] = e.puntos;
  const cal = { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, mm: e.distancia_mm };
  return pxPorMM(cal, 1, 1) ? cal : null;
}

// Los milímetros que se escriben en el panel: acepta coma decimal ("12,5").
// Devuelve 0 si no es un número positivo.
function leerMM(texto) {
  const v = parseFloat(String(texto == null ? "" : texto).trim().replace(",", "."));
  return isFinite(v) && v > 0 ? v : 0;
}

// Cifras para leer en el panel: tres o cuatro significativas
function numCorto(v) {
  return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toPrecision(2);
}

// ============================================================
// INFORME EN PDF (v3.8.0)
// El registro .json es para que OPC rehaga la imagen; el informe es para
// leer, imprimir o adjuntar a una publicación. Lo arma un escritor de PDF
// mínimo, sin bibliotecas: las fuentes estándar del formato (no se
// incrustan), imágenes JPEG tal como las da el canvas y trazos simples. No
// usa el documento ni React, así que también se puede probar en Node.
// ============================================================

// WinAnsiEncoding (cp1252) coincide con Latin-1 entre 0xA0 y 0xFF. Los demás
// signos que pueden aparecer van por tabla; lo que no existe en la
// codificación se cambia por un equivalente, o por «?».
const WINANSI_EXTRA = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
const WINANSI_EQUIV = { 0x2248: "~", 0x2192: "->", 0x2190: "<-", 0x2264: "<=", 0x2265: ">=", 0x2212: "-", 0x2713: "" };
function aWinAnsi(s) {
  const out = [];
  for (const ch of String(s)) {
    const u = ch.codePointAt(0);
    if (u < 0x80 || (u >= 0xA0 && u <= 0xFF)) out.push(u);
    else if (WINANSI_EXTRA[u]) out.push(WINANSI_EXTRA[u]);
    else if (WINANSI_EQUIV[u] !== undefined) { for (const c of WINANSI_EQUIV[u]) out.push(c.charCodeAt(0)); }
    else out.push(0x3F);
  }
  return out;
}

// Cadena literal de PDF solo con ASCII imprimible: lo demás va en octal
function cadenaPDF(s) {
  let r = "(";
  for (const b of aWinAnsi(s)) {
    if (b === 0x28 || b === 0x29 || b === 0x5C) r += "\\" + String.fromCharCode(b);
    else if (b < 0x20 || b > 0x7E) r += "\\" + b.toString(8).padStart(3, "0");
    else r += String.fromCharCode(b);
  }
  return r + ")";
}

// Texto para el diccionario de información (título, autor): UTF-16 en hexa,
// que cualquier lector muestra bien, con acentos o sin ellos
function textoInfoPDF(s) {
  let h = "<FEFF";
  for (let i = 0; i < s.length; i++) h += s.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0");
  return h + ">";
}

// Anchos de Helvetica y Helvetica-Bold (métricas AFM de Adobe) para los
// signos del 32 al 126, en milésimas del cuerpo. Courier mide 600 en todos.
const ANCHO_HELV = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278, 556,556,556,556,556,556,556,556,556,556, 278,278,584,584,584,556,1015,
  667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611, 278,278,278,469,556,333,
  556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500, 334,260,334,584];
const ANCHO_HELV_N = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278, 556,556,556,556,556,556,556,556,556,556, 333,333,584,584,584,611,975,
  722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611, 333,278,333,584,556,333,
  556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500, 389,280,389,584];
// Entre 0xC0 y 0xFF las letras con acento miden como su base; «_» marca los
// signos sin base, que se toman como 556 (el ancho del guion bajo)
const BASE_LATIN1 = "AAAAAA_CEEEEIIII_NOOOOO_OUUUUY__aaaaaa_ceeeeiiii_nooooo_ouuuuy_y";
const ANCHO_OTROS = { 0xA0: 278, 0xA1: 333, 0xB0: 400, 0xB7: 278, 0xBF: 611, 0x85: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333, 0x95: 350, 0x96: 556, 0x97: 1000 };

// Ancho de un texto en puntos. F1 Helvetica, F2 Helvetica-Bold, F3 Courier,
// F4 Times-Bold (se mide como Helvetica-Bold: solo se usa en el título).
function anchoTexto(s, fuente, tam) {
  const bytes = aWinAnsi(s);
  if (fuente === "F3") return bytes.length * 0.6 * tam;
  const t = fuente === "F2" || fuente === "F4" ? ANCHO_HELV_N : ANCHO_HELV;
  let w = 0;
  for (const b of bytes) {
    if (b >= 32 && b <= 126) w += t[b - 32];
    else if (b >= 0xC0) w += t[BASE_LATIN1.charCodeAt(b - 0xC0) - 32];
    else w += ANCHO_OTROS[b] || 556;
  }
  return w / 1000 * tam;
}

// Corta un texto en renglones de hasta `ancho` puntos. Una palabra que sola no
// entra (una huella, un nombre de archivo largo) se corta donde haga falta.
function partirTexto(s, fuente, tam, ancho) {
  const lineas = [];
  for (const parrafo of String(s).split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(" ")) {
      const prueba = linea ? linea + " " + palabra : palabra;
      if (anchoTexto(prueba, fuente, tam) <= ancho) { linea = prueba; continue; }
      if (linea) lineas.push(linea);
      let resto = palabra;
      while (resto.length > 1 && anchoTexto(resto, fuente, tam) > ancho) {
        let k = resto.length - 1;
        while (k > 1 && anchoTexto(resto.slice(0, k), fuente, tam) > ancho) k--;
        lineas.push(resto.slice(0, k));
        resto = resto.slice(k);
      }
      linea = resto;
    }
    lineas.push(linea);
  }
  return lineas;
}

// Ancho, alto y canales de un JPEG, leídos de su marcador SOF
function tamanoJPEG(b) {
  if (!b || b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0x01 || (m >= 0xD0 && m <= 0xD8)) { i += 2; continue; }
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC)
      return { alto: (b[i + 5] << 8) | b[i + 6], ancho: (b[i + 7] << 8) | b[i + 8], canales: b[i + 9] };
    i += 2 + ((b[i + 2] << 8) | b[i + 3]);
  }
  return null;
}

// Operadores de dibujo de una página. El origen va arriba a la izquierda,
// como en pantalla; PDF lo tiene abajo, así que acá se da vuelta la y.
// Colores en [r, g, b] de 0 a 255; el texto se ubica por su línea de base.
function lienzoPDF(ancho, alto) {
  const ops = [];
  const n = (v) => String(Math.round(v * 100) / 100);
  const rgb = (c) => c.map(v => n(v / 255)).join(" ");
  const Y = (y) => alto - y;
  const pluma = (color, grosor, guiones) => `${rgb(color)} RG ${n(grosor)} w [${guiones ? guiones.join(" ") : ""}] 0 d`;
  return {
    ancho, alto,
    contenido: () => ops.join("\n"),
    texto(x, y, s, f, tam, color, espaciado) {
      ops.push(`BT /${f} ${n(tam)} Tf ${rgb(color)} rg ${n(espaciado || 0)} Tc ${n(x)} ${n(Y(y))} Td ${cadenaPDF(s)} Tj ET`);
    },
    rect(x, y, w, h, relleno, borde, grosor) {
      const r = `${n(x)} ${n(Y(y + h))} ${n(w)} ${n(h)} re`;
      if (relleno && borde) ops.push(`${rgb(relleno)} rg ${pluma(borde, grosor || 0.5)} ${r} B`);
      else if (relleno) ops.push(`${rgb(relleno)} rg ${r} f`);
      else ops.push(`${pluma(borde, grosor || 0.5)} ${r} S`);
    },
    linea(x1, y1, x2, y2, color, grosor, guiones) {
      ops.push(`${pluma(color, grosor, guiones)} ${n(x1)} ${n(Y(y1))} m ${n(x2)} ${n(Y(y2))} l S`);
    },
    poligono(pts, color, grosor, guiones) {
      ops.push(`${pluma(color, grosor, guiones)} ${pts.map((p, i) => `${n(p[0])} ${n(Y(p[1]))} ${i ? "l" : "m"}`).join(" ")} h S`);
    },
    elipse(cx, cy, rx, ry, color, grosor, guiones) {
      const k = 0.5523, a = rx * k, b = ry * k, y0 = Y(cy);
      ops.push(`${pluma(color, grosor, guiones)} ${n(cx + rx)} ${n(y0)} m ` +
        `${n(cx + rx)} ${n(y0 + b)} ${n(cx + a)} ${n(y0 + ry)} ${n(cx)} ${n(y0 + ry)} c ` +
        `${n(cx - a)} ${n(y0 + ry)} ${n(cx - rx)} ${n(y0 + b)} ${n(cx - rx)} ${n(y0)} c ` +
        `${n(cx - rx)} ${n(y0 - b)} ${n(cx - a)} ${n(y0 - ry)} ${n(cx)} ${n(y0 - ry)} c ` +
        `${n(cx + a)} ${n(y0 - ry)} ${n(cx + rx)} ${n(y0 - b)} ${n(cx + rx)} ${n(y0)} c S`);
    },
    imagen(i, x, y, w, h) { ops.push(`q ${n(w)} 0 0 ${n(h)} ${n(x)} ${n(Y(y + h))} cm /Im${i} Do Q`); },
    recortar(x, y, w, h) { ops.push(`q ${n(x)} ${n(Y(y + h))} ${n(w)} ${n(h)} re W n`); },
    soltar() { ops.push("Q"); },
  };
}

// Arma el archivo PDF 1.4. paginas: lienzos de lienzoPDF; imagenes:
// [{bytes, ancho, alto, canales}] (JPEG), que las páginas nombran /Im0,
// /Im1…; info: {titulo, autor, productor, fecha} (fecha como D:AAAAMMDDhhmmssZ).
function armarPDF(paginas, imagenes, info) {
  const partes = [], offsets = [];
  let largo = 0;
  const ascii = (s) => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xFF; return u; };
  const poner = (u) => { partes.push(u); largo += u.length; };
  const objeto = (num, dicc, flujo) => {
    offsets[num] = largo;
    if (flujo) { poner(ascii(`${num} 0 obj\n${dicc}\nstream\n`)); poner(flujo); poner(ascii("\nendstream\nendobj\n")); }
    else poner(ascii(`${num} 0 obj\n${dicc}\nendobj\n`));
  };
  poner(ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  const fuentes = ["Helvetica", "Helvetica-Bold", "Courier", "Times-Bold"];
  const nF = 3, nI = nF + fuentes.length, nP = nI + imagenes.length, nInfo = nP + 2 * paginas.length;
  const recursos = `<< /Font << ${fuentes.map((f, i) => `/F${i + 1} ${nF + i} 0 R`).join(" ")} >> /XObject << ${imagenes.map((im, i) => `/Im${i} ${nI + i} 0 R`).join(" ")} >> >>`;
  objeto(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objeto(2, `<< /Type /Pages /Kids [${paginas.map((p, i) => `${nP + 2 * i} 0 R`).join(" ")}] /Count ${paginas.length} >>`);
  fuentes.forEach((f, i) => objeto(nF + i, `<< /Type /Font /Subtype /Type1 /BaseFont /${f} /Encoding /WinAnsiEncoding >>`));
  imagenes.forEach((im, i) => {
    const color = im.canales === 1 ? "/DeviceGray" : im.canales === 4 ? "/DeviceCMYK /Decode [1 0 1 0 1 0 1 0]" : "/DeviceRGB";
    objeto(nI + i, `<< /Type /XObject /Subtype /Image /Width ${im.ancho} /Height ${im.alto} /ColorSpace ${color} /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>`, im.bytes);
  });
  paginas.forEach((p, i) => {
    const flujo = ascii(p.contenido());
    objeto(nP + 2 * i, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.ancho} ${p.alto}] /Resources ${recursos} /Contents ${nP + 2 * i + 1} 0 R >>`);
    objeto(nP + 2 * i + 1, `<< /Length ${flujo.length} >>`, flujo);
  });
  objeto(nInfo, `<< /Title ${textoInfoPDF(info.titulo || "")} /Author ${textoInfoPDF(info.autor || "")} /Producer ${textoInfoPDF(info.productor || "")}${info.fecha ? ` /CreationDate (${info.fecha})` : ""} >>`);
  const inicioXref = largo, total = nInfo + 1;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let k = 1; k < total; k++) xref += String(offsets[k]).padStart(10, "0") + " 00000 n \n";
  poner(ascii(`${xref}trailer\n<< /Size ${total} /Root 1 0 R /Info ${nInfo} 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`));
  const out = new Uint8Array(largo);
  let o = 0;
  for (const u of partes) { out.set(u, o); o += u.length; }
  return out;
}

// El informe de una exportación, a partir de su registro. x:
//   lang ("es" o "en"), nombreFiltro(id), fecha (Date; por defecto, la del registro),
//   original y resultado: {bytes, ancho, alto, canales} en JPEG, o null,
//   logo: lo mismo, o null, fechaToma (texto EXIF) y hayGPS.
// Devuelve los bytes del PDF.
function informePDF(reg, x) {
  const es = (x.lang || "es") !== "en";
  const t = (a, b) => es ? a : b;
  const W = 595.28, H = 841.89, M = 42, CW = W - 2 * M, PIE = H - 54;
  const TIERRA = [62, 39, 35], ORO = [201, 162, 39], ORO_OSC = [150, 116, 18], PERG = [245, 237, 224];
  const GRIS = [112, 100, 88], GRIS_CL = [214, 203, 188], TINTA = [34, 28, 24], BLANCO = [255, 255, 255], ZONA = [192, 57, 43];
  const nombre = (id) => (x.nombreFiltro && x.nombreFiltro(id)) || id;
  const miles = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, es ? "." : ",");
  const signo = (v) => (v > 0 ? "+" : "") + v;
  const dec = (v) => es ? String(v).replace(".", ",") : String(v);
  const fecha = x.fecha || new Date(reg.fecha || Date.now());
  const dos = (v) => String(v).padStart(2, "0");
  const fechaTxt = es ? `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`
    : `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
  const version = (reg.opc && reg.opc.version) || "";
  const ent = reg.entrada || {}, trab = reg.trabajo || {}, sal = reg.salida || {}, esc = reg.escala || null;

  const imagenes = [];
  const sumarImagen = (im) => im && im.bytes ? (imagenes.push(im), imagenes.length - 1) : -1;
  const iLogo = sumarImagen(x.logo), iOrig = sumarImagen(x.original), iRes = sumarImagen(x.resultado);

  const paginas = [];
  let lz = null, y = 0;
  const nuevaPagina = () => {
    lz = lienzoPDF(W, H);
    paginas.push(lz);
    if (paginas.length === 1) {
      lz.rect(0, 0, W, 82, PERG);
      let tx = M;
      if (iLogo >= 0) { lz.imagen(iLogo, M, 19, 44, 44); tx = M + 56; }
      lz.texto(tx, 45, "OPC – OpuntiaColor", "F4", 21, TIERRA);
      lz.texto(tx, 60, t("Informe de procesamiento", "Processing report"), "F1", 9.5, GRIS, 0.2);
      const v = `v${version}`;
      lz.texto(W - M - anchoTexto(v, "F2", 10), 43, v, "F2", 10, TIERRA);
      lz.texto(W - M - anchoTexto(fechaTxt, "F1", 8), 57, fechaTxt, "F1", 8, GRIS);
      lz.rect(0, 82, W, 2.2, ORO);
      y = 108;
    } else {
      lz.texto(M, 40, t("OPC – OpuntiaColor · informe de procesamiento (sigue)", "OPC – OpuntiaColor · processing report (continued)"), "F1", 8, GRIS);
      lz.linea(M, 48, W - M, 48, GRIS_CL, 0.6);
      y = 72;
    }
  };
  const asegurar = (h) => { if (y + h > PIE) nuevaPagina(); };
  const seccion = (titulo) => {
    asegurar(44);
    y += 6;
    const tt = titulo.toUpperCase(), ancho = anchoTexto(tt, "F2", 7.5) + 1.3 * tt.length;
    lz.texto(M, y, tt, "F2", 7.5, TIERRA, 1.3);
    lz.linea(M + ancho + 8, y - 2.6, W - M, y - 2.6, GRIS_CL, 0.6);
    y += 14;
  };
  const COL = 122;
  const fila = (etiqueta, valor, mono, color) => {
    const f = mono ? "F3" : "F1", tam = mono ? 7.6 : 8.4, lh = 11.2;
    const lineas = partirTexto(valor, f, tam, CW - COL);
    asegurar(lineas.length * lh + 3);
    lz.texto(M, y, etiqueta, "F1", 7.8, GRIS);
    lineas.forEach((l, i) => lz.texto(M + COL, y + i * lh, l, f, tam, TINTA));
    if (color) lz.rect(M + COL - 13, y - 7, 8, 8, color, GRIS, 0.4);
    y += lineas.length * lh + 3.5;
  };
  const parrafo = (texto, tam, color) => {
    const lh = tam * 1.42;
    for (const l of partirTexto(texto, "F1", tam, CW)) { asegurar(lh); lz.texto(M, y, l, "F1", tam, color || TINTA); y += lh; }
    y += 3;
  };

  nuevaPagina();

  // ---- Original y resultado, lado a lado, a la misma escala
  const gap = 18, colW = (CW - gap) / 2;
  const aw = trab.ancho || ent.ancho || 1, ah = trab.alto || ent.alto || 1, asp = aw / ah;
  const ih = Math.min(232, colW / asp), iw = ih * asp;
  const pasos = reg.pasos || [];
  const zonas = [];
  for (const p of pasos) if (p.seleccion && !zonas.some(z => JSON.stringify(z) === JSON.stringify(p.seleccion))) zonas.push(p.seleccion);
  const barraEn = (x0, y0) => {
    if (!esc || !(esc.px_por_mm_trabajo > 0)) return;
    const bar = largoBarra(esc.px_por_mm_trabajo * iw / aw, iw * 0.32);
    if (!bar) return;
    const et = etiquetaLargo(bar.mm), bx = x0 + 7, by = y0 + ih - 7 - 19;
    lz.rect(bx, by, bar.px + 14, 19, BLANCO, GRIS, 0.4);
    for (let k = 0; k < 4; k++) lz.rect(bx + 7 + k * bar.px / 4, by + 4, bar.px / 4, 3.6, k % 2 ? BLANCO : TINTA, TINTA, 0.35);
    lz.texto(bx + 6, by + 15.2, "0", "F1", 5.8, TINTA);
    lz.texto(bx + 7 + bar.px - anchoTexto(et, "F2", 5.8) + 1, by + 15.2, et, "F2", 5.8, TINTA);
  };
  const panel = (k, idx, rotulo, pie1, pie2) => {
    const x0 = M + k * (colW + gap) + (colW - iw) / 2, y0 = y + 9;
    lz.texto(x0, y, rotulo, "F2", 6.8, ORO_OSC, 1.2);
    if (idx >= 0) lz.imagen(idx, x0, y0, iw, ih);
    else lz.rect(x0, y0, iw, ih, PERG);
    lz.recortar(x0, y0, iw, ih);
    if (k === 0) {
      for (const z of zonas) {
        if (z.tipo === "free" && z.puntos) lz.poligono(z.puntos.map(([px, py]) => [x0 + px * iw, y0 + py * ih]), ZONA, 1, [3, 2]);
        else if (z.tipo === "circle") lz.elipse(x0 + (z.x1 + z.x2) / 2 * iw, y0 + (z.y1 + z.y2) / 2 * ih, Math.abs(z.x2 - z.x1) / 2 * iw, Math.abs(z.y2 - z.y1) / 2 * ih, ZONA, 1, [3, 2]);
        else if (z.tipo === "rect") lz.rect(x0 + Math.min(z.x1, z.x2) * iw, y0 + Math.min(z.y1, z.y2) * ih, Math.abs(z.x2 - z.x1) * iw, Math.abs(z.y2 - z.y1) * ih, null, ZONA, 1);
      }
      if (esc && esc.puntos) {
        const [[ax, ay], [bx, by]] = esc.puntos;
        const A = [x0 + ax * iw, y0 + ay * ih], B = [x0 + bx * iw, y0 + by * ih];
        const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, nx = -(B[1] - A[1]) / L * 3.5, ny = (B[0] - A[0]) / L * 3.5;
        for (const [c, g] of [[TINTA, 2.6], [ORO, 1.1]]) {
          lz.linea(A[0], A[1], B[0], B[1], c, g);
          lz.linea(A[0] + nx, A[1] + ny, A[0] - nx, A[1] - ny, c, g);
          lz.linea(B[0] + nx, B[1] + ny, B[0] - nx, B[1] - ny, c, g);
        }
      }
    }
    barraEn(x0, y0);
    lz.soltar();
    lz.rect(x0, y0, iw, ih, null, GRIS_CL, 0.6);
    const p1 = partirTexto(pie1, "F2", 7.4, iw)[0], p2 = partirTexto(pie2, "F1", 7.2, iw)[0];
    lz.texto(x0, y0 + ih + 12, p1, "F2", 7.4, TINTA);
    lz.texto(x0, y0 + ih + 22.5, p2, "F1", 7.2, GRIS);
  };
  asegurar(ih + 50);
  const cadena = pasos.map(p => nombre(p.filtro)).join(" › ") || t("sin filtro", "no filter");
  panel(0, iOrig, "ORIGINAL", ent.archivo || "", `${ent.ancho || "?"} × ${ent.alto || "?"} px${zonas.length ? t(" · en rojo, la zona", " · area in red") : ""}`);
  panel(1, iRes, t("RESULTADO", "RESULT"), cadena, `${aw} × ${ah} px${esc ? t(" · barra de escala en mm", " · scale bar in mm") : ""}`);
  y += 9 + ih + 34;

  // ---- Foto de entrada
  seccion(t("Foto de entrada", "Input photo"));
  fila(t("Archivo", "File"), ent.archivo || "—");
  fila(t("Tamaño", "Size"), `${ent.bytes != null ? miles(ent.bytes) + " bytes · " : ""}${ent.ancho} × ${ent.alto} px`);
  fila(t("SHA-256 del archivo", "File SHA-256"), ent.sha256 || "—", true);
  if (x.fechaToma) fila(t("Fecha de la toma", "Date taken"), String(x.fechaToma).replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3") + t(" (EXIF)", " (EXIF)"));
  if (x.hayGPS) fila(t("Coordenadas", "Coordinates"), t("La foto tiene GPS en el EXIF; no se copia a este informe.", "The photo has GPS in its EXIF; it is not copied to this report."));
  const res = { full: t("completa", "full"), "16mp": "16 MP", "12mp": "12 MP", "8mp": "8 MP", "2000": t("lado mayor 2000 px", "long side 2000 px") }[trab.resolucion];
  fila(t("Resolución de trabajo", "Working resolution"), `${aw} × ${ah} px` + (res ? ` · ${res}` : trab.lado_max ? t(` · lote, lado mayor ${trab.lado_max} px`, ` · batch, long side ${trab.lado_max} px`) : ""));
  fila(t("SHA-256 de los píxeles", "Pixel SHA-256"), trab.sha256_pixeles || "—", true);

  // ---- Procedimiento
  seccion(t("Procedimiento", "Procedure"));
  pasos.forEach((p, i) => {
    const d = [`${nombre(p.filtro)}`, `${t("intensidad", "intensity")} ${dec(p.intensidad)}`];
    if (p.opciones && p.opciones.escala) {
      const op = p.opciones;
      d.push(`${t("escala", "scale")} ${dec(op.escala)} %`);
      if (op.doble != null) d.push(t(`doble, objeto al ${Math.round(op.doble * 100)} %`, `double, object at ${Math.round(op.doble * 100)} %`));
      if (op.suave) d.push(t("compresión suave", "soft compression"));
      if (op.clahe) d.push(t("realzado con CLAHE (no métrico)", "enhanced with CLAHE (not metric)"));
      if (op.mezcla) { const al = Math.round((op.alfa == null ? 0.5 : op.alfa) * 100), nm = op.mezcla === "lds" ? "LDS" : "DS-LAB"; d.push(t(`mezclado con ${nm} al ${al} %`, `blended with ${nm} at ${al} %`)); }
    }
    const s = p.seleccion;
    if (!s) d.push(t("toda la imagen", "whole image"));
    else {
      const caja = s.caja_px ? ` (px ${s.caja_px[0]}–${s.caja_px[2]} × ${s.caja_px[1]}–${s.caja_px[3]})` : "";
      d.push((s.tipo === "rect" ? t("zona rectangular", "rectangular area") : s.tipo === "circle" ? t("zona circular", "circular area") : t("zona a mano alzada", "freehand area")) + caja);
    }
    fila(`${t("Paso", "Step")} ${i + 1}`, d.join(" · "));
  });
  (reg.gotero || []).forEach((g, i) => {
    fila(`${t("Gotero", "Eyedropper")} ${i + 1}`, `RGB ${g.r}, ${g.g}, ${g.b} · ${t("tolerancia", "tolerance")} ${g.tolerancia} · ${t("suavizado", "feather")} ${g.suavizado} · ${t("ganancia", "gain")} ${signo(g.ganancia)}`, false, [g.r, g.g, g.b]);
  });
  const aj = reg.ajustes || {};
  fila(t("Contraste y saturación", "Contrast and saturation"), (aj.contraste || aj.saturacion)
    ? `${t("contraste", "contrast")} ${signo(aj.contraste || 0)} · ${t("saturación", "saturation")} ${signo(aj.saturacion || 0)} · ${aj.metodo === "por_pixel" ? t("aplicados por píxel (lote)", "applied per pixel (batch)") : t("aplicados con el filtro del navegador", "applied with the browser filter")}`
    : t("sin ajustes", "none"));
  if (reg.lote && reg.lote.referencia) fila(t("Lote", "Batch"), t(`estadísticas congeladas de ${reg.lote.referencia.archivo}`, `statistics frozen from ${reg.lote.referencia.archivo}`));

  // ---- Escala métrica
  if (esc) {
    seccion(t("Escala métrica", "Metric scale"));
    fila(t("Calibración", "Calibration"), `1 mm = ${dec(numCorto(esc.px_por_mm_trabajo))} px · 1 px = ${dec(numCorto(esc.mm_por_px_trabajo))} mm ${t("(resolución de trabajo)", "(working resolution)")}`);
    const pp = (esc.puntos_px_original || []).map(q => `(${q.map(dec).join(es ? "; " : ", ")})`);
    fila(t("Tramo marcado", "Marked span"), `${dec(esc.distancia_mm)} mm` + (pp.length === 2 ? t(` entre ${pp[0]} y ${pp[1]} px de la foto original`, ` between ${pp[0]} and ${pp[1]} px of the original photo`) : "") + ` · ${dec(numCorto(esc.px_por_mm_original))} px/mm ${t("en la original", "in the original")}`);
    parrafo(t("La escala vale en el plano de la regla. Fuera de él, la perspectiva, el relieve de la roca y la distorsión del objetivo la vuelven aproximada.",
      "The scale holds in the plane of the ruler. Away from it, perspective, rock relief and lens distortion make it approximate."), 7.6, GRIS);
  }

  // ---- Resultado
  seccion(t("Resultado", "Result"));
  fila(t("Archivo", "File"), sal.archivo || "—");
  fila(t("SHA-256 de los píxeles", "Pixel SHA-256"), sal.sha256_pixeles || "—", true);
  if (sal.sha256) fila(t("SHA-256 del archivo", "File SHA-256"), sal.sha256, true);
  fila(t("Hecho con", "Made with"), `OPC – OpuntiaColor ${version} · ${fechaTxt}`);

  parrafo(t("Huellas de los píxeles: SHA-256 de los valores RGB de 8 bits, fila por fila, sin el alfa. Se pueden verificar fuera de OPC.",
    "Pixel fingerprints: SHA-256 of the 8-bit RGB values, row by row, without alpha. They can be checked outside OPC."), 7.6, GRIS);

  // ---- Reproducir y citar, en dos columnas
  const bloque = [
    [t("Cómo reproducirlo", "How to reproduce it"), t(`En OPC ${version} o posterior: cargar la foto original y abrir el registro con «Reproducir un registro». Sirve el .json que bajó con este informe o la propia imagen exportada, que lo lleva adentro. OPC rehace la imagen y comprueba que salga idéntica, píxel a píxel.`,
      `In OPC ${version} or later: load the original photo and open the record with “Replay a record”. Use the .json downloaded with this report, or the exported image itself, which carries it inside. OPC rebuilds the image and checks that it comes out identical, pixel for pixel.`)],
    [t("Cómo citar", "How to cite"), `Villafañez, E. A. (${fecha.getFullYear()}). OPC – OpuntiaColor (${t("versión", "version")} ${version}) [Software]. LATDAA, ${t("Universidad Nacional de Catamarca", "National University of Catamarca")}. https://doi.org/10.5281/zenodo.21796290`],
  ];
  const sepB = 24, colB = (CW - sepB) / 2, tamB = 7.9, lhB = 10.8;
  const lineasB = bloque.map(([, txt]) => partirTexto(txt, "F1", tamB, colB));
  const altoB = Math.max(...lineasB.map(l => l.length)) * lhB;
  asegurar(20 + altoB);
  y += 6;
  bloque.forEach(([tit], k) => {
    const x0 = M + k * (colB + sepB), tt = tit.toUpperCase();
    lz.texto(x0, y, tt, "F2", 7.5, TIERRA, 1.3);
    lz.linea(x0 + anchoTexto(tt, "F2", 7.5) + 1.3 * tt.length + 8, y - 2.6, x0 + colB, y - 2.6, GRIS_CL, 0.6);
    lineasB[k].forEach((l, i) => lz.texto(x0, y + 14 + i * lhB, l, "F1", tamB, TINTA));
  });
  y += 14 + altoB;

  // ---- Pie de cada página
  paginas.forEach((p, i) => {
    p.linea(M, H - 46, W - M, H - 46, GRIS_CL, 0.6);
    p.texto(M, H - 34, t("LATDAA — Laboratorio de Tecnologías Digitales Aplicadas a la Arqueología · Escuela de Arqueología, UNCa",
      "LATDAA — Laboratory of Digital Technologies Applied to Archaeology · School of Archaeology, UNCa"), "F1", 6.8, GRIS);
    const pg = t(`Página ${i + 1} de ${paginas.length}`, `Page ${i + 1} of ${paginas.length}`);
    p.texto(W - M - anchoTexto(pg, "F1", 6.8), H - 34, pg, "F1", 6.8, GRIS);
  });

  const f = new Date(reg.fecha || Date.now()), d2 = (v) => String(v).padStart(2, "0");
  return armarPDF(paginas, imagenes, {
    titulo: `OPC – ${t("Informe de procesamiento", "Processing report")}${sal.archivo ? " – " + sal.archivo : ""}`,
    autor: "OPC – OpuntiaColor (LATDAA, UNCa)",
    productor: `OPC – OpuntiaColor ${version}`,
    fecha: `D:${f.getUTCFullYear()}${d2(f.getUTCMonth() + 1)}${d2(f.getUTCDate())}${d2(f.getUTCHours())}${d2(f.getUTCMinutes())}${d2(f.getUTCSeconds())}Z`,
  });
}

// −1, 0 o 1 según "3.7.3" sea anterior, igual o posterior a "3.8.0"
function compararVersiones(a, b) {
  const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

// Versiones que cambiaron el resultado de algún filtro, según el CHANGELOG.
// Al publicar una versión que cambie resultados hay que agregarla acá: con
// eso, un registro hecho antes avisa que la imagen puede no salir igual.
function cambiosDeResultados() {
  return [
    { version: "3.3.0", filtros: ["crgb", "dslab", "lds"], es: "se corrigió la eigendescomposición", en: "the eigendecomposition was fixed" },
    { version: "3.4.0", filtros: ["lds"], es: "la intensidad de LDS pasó a ser el exponente de blanqueo", en: "LDS intensity became the whitening exponent" },
    { version: "3.5.0", filtros: ["lds"], es: "LDS pasó a una normalización robusta con ganancia común", en: "LDS moved to a robust normalization with a common gain" },
    // Cambió la resolución por defecto, no un filtro: el registro guarda la
    // resolución de trabajo, así que no hace falta avisar
    { version: "3.6.0", filtros: [], es: "la resolución de trabajo por defecto pasó a ser la completa", en: "the default working resolution became full" },
    { version: "3.7.0", filtros: ["red"], es: "el filtro Rojo pasó a ser adaptativo", en: "the Red filter became adaptive" },
  ];
}

// Cambios de resultados entre la versión del registro y la actual (en
// cualquiera de los dos sentidos) que afectan a alguno de los filtros usados
function cambiosEntre(desde, hasta, filtros) {
  const [a, b] = compararVersiones(desde, hasta) <= 0 ? [desde, hasta] : [hasta, desde];
  return cambiosDeResultados().filter(c =>
    compararVersiones(c.version, a) > 0 && compararVersiones(c.version, b) <= 0 && c.filtros.some(f => filtros.includes(f)));
}

// CSV del lote (RFC 4180): una fila por foto
function csvLote(filas) {
  const cols = ["archivo_entrada", "sha256_entrada", "ancho_original", "alto_original", "ancho_trabajo", "alto_trabajo",
    "archivo_salida", "sha256_pixeles_salida", "sha256_salida", "estado"];
  const campo = (v) => { const s = v == null ? "" : String(v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(","), ...filas.map(f => cols.map(c => campo(f[c])).join(","))].join("\r\n") + "\r\n";
}

// SHA-256 en hexadecimal: el del navegador si está, si no el propio
async function huellaSHA256(bytes) {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
      const d = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
      let s = ""; for (let i = 0; i < d.length; i++) s += d[i].toString(16).padStart(2, "0");
      return s;
    }
  } catch (e) {}
  return sha256Hex(bytes);
}

// ============================================================
// THEMES
// ============================================================

const TD = { bg:"#1a1714",text:"#e8e0d4",tm:"#8a7e6e",td:"#6a5e4e",ac:"#c0392b",acBg:"rgba(192,57,43,0.12)",acBd:"rgba(192,57,43,0.35)",cBg:"rgba(232,224,212,0.04)",cBd:"rgba(232,224,212,0.08)",hBd:"rgba(232,224,212,0.08)",ov:"rgba(26,23,20,0.7)",gn:"#6db85d",gnBg:"rgba(109,184,93,0.1)",gnBd:"rgba(109,184,93,0.15)",iBg:"#0e0d0b",fTx:"#5a4e3e",fBd:"rgba(232,224,212,0.06)",bBg:"rgba(232,224,212,0.06)",sT:"rgba(232,224,212,0.15)",tB:"#1a1714" };
const TS = { bg:"#FFFFFF",text:"#000000",tm:"#333333",td:"#555555",ac:"#B71C1C",acBg:"rgba(183,28,28,0.1)",acBd:"rgba(183,28,28,0.4)",cBg:"#F5F5F5",cBd:"#CCCCCC",hBd:"#BBBBBB",ov:"rgba(255,255,255,0.8)",gn:"#2E7D32",gnBg:"rgba(46,125,50,0.1)",gnBd:"rgba(46,125,50,0.3)",iBg:"#EEEEEE",fTx:"#555555",fBd:"#CCCCCC",bBg:"#EEEEEE",sT:"#BBBBBB",tB:"#FFFFFF" };

// ============================================================
// VISOR: ENCUADRE (zoom + desplazamiento)
// ============================================================
// tx/ty van en fracciones del ancho y alto del visor, no en pixeles: asi el
// encuadre sobrevive a que la ventana cambie de tamano sin recalcular nada.
// El recorte impide que la imagen se despegue de los bordes del visor.
const ZOOM_MAX = 16;
function clampView(v) {
  const z = Math.max(1, Math.min(ZOOM_MAX, v.z));
  return { z, tx: Math.max(1 - z, Math.min(0, v.tx)), ty: Math.max(1 - z, Math.min(0, v.ty)) };
}

// ============================================================
// RESOLUCIÓN DE TRABAJO (v3.7.3)
// ============================================================
// «Completa» es la foto tal cual, con el tope de 8192 px de siempre, y
// «2000 px» es la opción reducida que había hasta v3.7.2: las dos dan
// exactamente el mismo tamaño que entonces. Las intermedias limitan los
// megapíxeles y no el lado, para que un panorama alargado no quede angosto.
const RESOLUCIONES = [{ id: "full", lado: 8192 }, { id: "16mp", mp: 16 }, { id: "12mp", mp: 12 }, { id: "8mp", mp: 8 }, { id: "2000", lado: 2000 }];
// Una foto de más de FOTO_GRANDE_MP abre con un cartel que propone bajarla a
// RES_RECOMENDADA. Medido con un panorama de 29 MP (6222 × 4666) en una PC de
// escritorio: el filtro más lento tarda 8,5 s a resolución completa, 4,7 s a
// 16 MP y 3,6 s a 12 MP. 16 MP conserva tres cuartos de cada lado y tarda
// alrededor de la mitad.
const FOTO_GRANDE_MP = 16;
const RES_RECOMENDADA = "16mp";

function tamanoTrabajo(w0, h0, resId) {
  const r = RESOLUCIONES.find(x => x.id === resId) || RESOLUCIONES[0];
  const lado = r.lado || 8192;
  let w = w0, h = h0;
  if (w > lado || h > lado) { const s = lado / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
  if (r.mp && w * h > r.mp * 1e6) { const s = Math.sqrt(r.mp * 1e6 / (w * h)); w = Math.round(w * s); h = Math.round(h * s); }
  return { w, h };
}

// ¿Abre con el cartel? Se mide la foto ya con el tope de 8192 px.
function esFotoGrande(w0, h0) {
  const c = tamanoTrabajo(w0, h0, "full");
  return c.w * c.h > FOTO_GRANDE_MP * 1e6;
}

// Opciones que tienen sentido para una foto: la completa y las que la achican
// de verdad, al menos un 10 % de píxeles respecto de cada opción anterior. En
// una foto de 12 MP, «16 MP» sería la completa y «12 MP» le sacaría un 2 %.
function opcionesResolucion(w0, h0) {
  const out = [];
  for (const r of RESOLUCIONES) {
    const t = tamanoTrabajo(w0, h0, r.id);
    if (!out.some(o => t.w * t.h > o.w * o.h * 0.9)) out.push({ id: r.id, w: t.w, h: t.h });
  }
  return out;
}

// ============================================================
// PRESETS (con categorías)
// ============================================================

const PRESETS = [
  { id:"red", name:"Rojo", nameEn:"Red", desc:"Rojos y ocres / se adapta al color de la roca", descEn:"Reds and ochres / adapts to the rock\u2019s color", icon:"\uD83D\uDD34", fn:enhanceRedPigment },
  { id:"white", name:"Blanco", nameEn:"White", desc:"Pinturas y pigmentos blancos / claros", descEn:"White and light paints / pigments", icon:"\u26AA", fn:enhanceWhitePigment },
  { id:"black", name:"Negro", nameEn:"Black", desc:"Pigmentos oscuros / negros / carbones", descEn:"Dark pigments / blacks / charcoal", icon:"\u26AB", fn:enhanceBlackPigment },
  { id:"bichrome", name:"Bicromo", nameEn:"Bichrome", desc:"Combina realce rojo + blanco", descEn:"Combines red + white enhancement", icon:"\u25D1", fn:enhanceBichrome },
  { id:"crgb", name:"CRGB", nameEn:"CRGB", desc:"Decorrelaci\u00F3n pura RGB / variabilidad espectral", descEn:"Pure RGB decorrelation / spectral variability", icon:"\uD83C\uDF08", fn:crgbEnhance },
  { id:"dslab", name:"DS-LAB", nameEn:"DS-LAB", desc:"Decorrelaci\u00F3n perceptual CIE-LAB / pigmentos sutiles", descEn:"Perceptual CIE-LAB decorrelation / subtle pigments", icon:"\uD83D\uDD35", fn:dsLabEnhance },
  { id:"lds", name:"LDS", nameEn:"LDS", desc:"Decorrelation Stretch RGB / an\u00E1lisis general", descEn:"RGB Decorrelation Stretch / general analysis", icon:"\uD83D\uDFE3", fn:ldsEnhance },
  { id:"petro", name:"Micro-relieve", nameEn:"Micro-relief", desc:"P\u00E1tina + textura + bordes / grabados y surcos", descEn:"Patina + texture + edges / engravings and grooves", icon:"\uD83E\uDEA8", fn:enhancePetroglyph },
  { id:"relief", name:"Relieve", nameEn:"Relief", desc:"Bordes para calcar, o relieve por escala / grabados", descEn:"Edges for tracing, or relief by scale / engravings", icon:"\uD83D\uDDFA", fn:reliefMap },
  { id:"ybk", name:"YBK", nameEn:"YBK", desc:"Crominancia YCbCr / separaci\u00F3n crom\u00E1tica", descEn:"YCbCr chrominance / chromatic separation", icon:"\uD83D\uDFE1", fn:ybkEnhance },
  { id:"clahe", name:"CLAHE", nameEn:"CLAHE", desc:"Ecualizaci\u00F3n adaptativa de histograma / sombras", descEn:"Adaptive histogram equalization / shadows", icon:"\u25D0", fn:claheEnhance },
  { id:"map", name:"Mapa pigmentos", nameEn:"Pigment map", desc:"Falso color por firma cromática / hipótesis, no identificación", descEn:"False color by chromatic signature / a hypothesis, not an identification", icon:"\uD83D\uDDFA\uFE0F", fn:pigmentMapping },
];

const INTENSITY_PRESETS = [
  { label:"Sutil", labelEn:"Subtle", value:0.4 },
  { label:"Suave", labelEn:"Mild", value:1.0 },
  { label:"Medio", labelEn:"Medium", value:1.8 },
  { label:"Fuerte", labelEn:"Strong", value:3.0 },
  { label:"Extremo", labelEn:"Extreme", value:4.5 },
];

// ============================================================
// PROCESADOR DE FONDO (v3.7.2)
// ============================================================
// Con una foto de 29 MP un filtro tarda unos 8 segundos. Corriéndolo en el
// hilo de la página, en ese tiempo no había ni redibujado ni clics: la página
// parecía colgada. Ahora corre en un Web Worker que carga este mismo app.js.
// Un pedido nuevo cancela el que esté en curso (se termina el worker y se
// lanza otro), así que cambiar de filtro o de intensidad nunca hace esperar
// al cálculo anterior.
//
// Si el worker no puede arrancar —por ejemplo, con index.html abierto como
// archivo local, donde el navegador no lo permite— el filtro corre en la
// página como hasta v3.7.1. El resultado es el mismo en los dos caminos.
const PROC_CANCELADO = "cancelado";

// Combina el resultado del filtro con la foto de origen (datos RGBA de n
// píxeles): dentro de la selección va el filtro; afuera, la foto tal cual.
// Sin selección devuelve el resultado sin tocarlo. La usan el worker y el
// cálculo en la página, así que los dos caminos combinan igual.
function aplicarMascara(origen, resultado, mask, n) {
  if (!mask) return resultado;
  const out = new Uint8ClampedArray(origen);
  for (let i = 0; i < n; i++) {
    if (mask[i]) { out[i*4] = resultado[i*4]; out[i*4+1] = resultado[i*4+1]; out[i*4+2] = resultado[i*4+2]; }
    out[i*4+3] = 255;
  }
  return out;
}

function crearProcesador() {
  let worker = null, enCurso = null, localPend = null, n = 0;
  let usable = typeof Worker !== "undefined" && !!APP_SRC;
  // El mismo cálculo, en el hilo de la página. t.origen no se transfiere
  // nunca, así que sigue disponible si el worker falla a mitad de camino.
  const local = (t) => {
    const p = PRESETS.find(x => x.id === t.presetId);
    const store = t.frozen ? { frozen: t.frozen } : {};
    const r = p.fn(new ImageData(new Uint8ClampedArray(t.origen), t.w, t.h), t.intensity, t.mask, store, t.opts);
    return { data: aplicarMascara(t.origen, r.data, t.mask, t.w * t.h), frozen: store.frozen || null, png: null };
  };
  const resolverLocal = (t) => { try { t.resolve(local(t)); } catch (err) { t.reject(err); } };
  const arrancar = () => {
    try { worker = new Worker(APP_SRC); } catch (e) { usable = false; worker = null; return; }
    worker.onmessage = (e) => {
      const t = enCurso;
      if (!t || e.data.id !== t.id) return;
      enCurso = null;
      // Un error dentro del worker se repite en la página, donde queda a la vista
      if (e.data.error) resolverLocal(t);
      else t.resolve({ data: e.data.data, frozen: e.data.frozen, png: e.data.png });
    };
    worker.onerror = (e) => {
      // No se pudo cargar o se cayó: de acá en más, todo en la página
      if (e && e.preventDefault) e.preventDefault();
      usable = false;
      if (worker) { worker.terminate(); worker = null; }
      const t = enCurso; enCurso = null;
      if (t) resolverLocal(t);
    };
  };
  const cancelar = () => {
    if (localPend) { const t = localPend; localPend = null; t.reject(PROC_CANCELADO); }
    if (!enCurso) return;
    const t = enCurso; enCurso = null;
    if (worker) { worker.terminate(); worker = null; }
    t.reject(PROC_CANCELADO);
  };
  // t: { presetId, origen (Uint8ClampedArray RGBA), w, h, intensity, mask, frozen, opts }
  // Devuelve { data: RGBA ya combinado con la selección, frozen, png: Blob o null }
  const correr = (t) => new Promise((resolve, reject) => {
    cancelar();
    const job = { ...t, id: ++n, resolve, reject };
    if (usable && !worker) arrancar();
    if (!usable) {
      localPend = job;
      setTimeout(() => { if (localPend !== job) return; localPend = null; resolverLocal(job); }, 0);
      return;
    }
    enCurso = job;
    // Se transfiere una copia de los píxeles: pasa al worker sin duplicarse
    const copia = new Uint8ClampedArray(t.origen);
    worker.postMessage({ id: job.id, presetId: t.presetId, data: copia, w: t.w, h: t.h,
      intensity: t.intensity, mask: t.mask, frozen: t.frozen, opts: t.opts, png: true }, [copia.buffer]);
  });
  return { correr, cancelar };
}


// ============================================================
// ZIP SIN COMPRIMIR (v3.8.0)
// Para bajar la imagen, el .json y el informe juntos, en una carpeta, cuando
// el navegador no deja elegir dónde guardar. Método «almacenado»: no comprime
// (PNG, JPG y PDF ya vienen comprimidos), así que alcanza con copiar los bytes
// y anotar su CRC-32. entradas: [{nombre, bytes}], con «/» para las carpetas,
// que se agregan solas; los nombres van en UTF-8.
// ============================================================
function zipSinComprimir(entradas, fecha) {
  const te = new TextEncoder(), f = fecha || new Date();
  const hora = (f.getHours() << 11) | (f.getMinutes() << 5) | (f.getSeconds() >> 1);
  const dia = ((Math.max(1980, f.getFullYear()) - 1980) << 9) | ((f.getMonth() + 1) << 5) | f.getDate();
  const carpetas = new Set();
  for (const e of entradas) { const p = e.nombre.split("/"); for (let i = 1; i < p.length; i++) carpetas.add(p.slice(0, i).join("/") + "/"); }
  const todas = [...[...carpetas].map(nombre => ({ nombre, bytes: new Uint8Array(0), carpeta: true })), ...entradas];
  const partes = [], centrales = [];
  let off = 0;
  for (const e of todas) {
    const nom = te.encode(e.nombre), crc = e.carpeta ? 0 : crc32(e.bytes), n = e.bytes.length;
    const lh = new Uint8Array(30 + nom.length), l = new DataView(lh.buffer);
    l.setUint32(0, 0x04034B50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true); l.setUint16(8, 0, true);
    l.setUint16(10, hora, true); l.setUint16(12, dia, true); l.setUint32(14, crc, true); l.setUint32(18, n, true); l.setUint32(22, n, true);
    l.setUint16(26, nom.length, true); l.setUint16(28, 0, true); lh.set(nom, 30);
    const ch = new Uint8Array(46 + nom.length), c = new DataView(ch.buffer);
    c.setUint32(0, 0x02014B50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, hora, true); c.setUint16(14, dia, true); c.setUint32(16, crc, true); c.setUint32(20, n, true); c.setUint32(24, n, true);
    c.setUint16(28, nom.length, true); c.setUint32(38, e.carpeta ? 0x10 : 0, true); c.setUint32(42, off, true); ch.set(nom, 46);
    partes.push(lh, e.bytes); centrales.push(ch);
    off += lh.length + n;
  }
  const tamCentral = centrales.reduce((s, u) => s + u.length, 0);
  const fin = new Uint8Array(22), d = new DataView(fin.buffer);
  d.setUint32(0, 0x06054B50, true); d.setUint16(8, todas.length, true); d.setUint16(10, todas.length, true);
  d.setUint32(12, tamCentral, true); d.setUint32(16, off, true);
  const out = new Uint8Array(off + tamCentral + 22);
  let o = 0;
  for (const u of [...partes, ...centrales, fin]) { out.set(u, o); o += u.length; }
  return out;
}

// ============================================================
// ESCALA MÉTRICA EN EL VISOR (v3.8.0)
// Componentes aparte del principal porque la lupa sigue al puntero: moverla
// redibuja solo esta capa, no todo el panel.
// ============================================================
const ORO_ESCALA = "#e6c35c";
const MONO_ESCALA = "'JetBrains Mono', monospace";

// Largos redondos para la barra de escala, en mm
const LARGOS_BARRA_MM = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

// El largo redondo más grande que entra en maxPx píxeles de pantalla.
// pxPantallaPorMM: cuántos píxeles de pantalla mide un milímetro.
function largoBarra(pxPantallaPorMM, maxPx) {
  if (!(pxPantallaPorMM > 0) || !(maxPx > 0)) return null;
  let mm = LARGOS_BARRA_MM[0];
  for (const L of LARGOS_BARRA_MM) if (L * pxPantallaPorMM <= maxPx) mm = L;
  return { mm, px: mm * pxPantallaPorMM };
}

// 5 → "5 mm", 20 → "2 cm", 1000 → "1 m"
function etiquetaLargo(mm) {
  if (mm >= 1000) return `${+(mm / 1000).toFixed(3)} m`;
  if (mm >= 10) return `${+(mm / 10).toFixed(2)} cm`;
  return `${+mm.toFixed(2)} mm`;
}

function IconoRegla({ color }) {
  return (
    <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden="true" style={{ flexShrink:0 }}>
      <rect x="0.5" y="0.5" width="21" height="11" rx="1.5" fill="none" stroke={color} />
      {[3.5, 6.5, 9.5, 12.5, 15.5, 18.5].map((x, i) => <line key={x} x1={x} y1="0.5" x2={x} y2={i % 2 ? 6.5 : 4} stroke={color} />)}
    </svg>
  );
}

// Puntos, línea de medida y lupa mientras se calibra. Va en píxeles del
// visor, fuera de la capa ampliable: los círculos no se deforman y el texto
// se lee igual con cualquier aumento.
function CapaCalibracion({ contRef, getBounds, view, imageSize, natW, imageSrc, cal, mm, onCancelar }) {
  const [cur, setCur] = useState(null);
  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    const mover = (e) => {
      if (e.pointerType === "touch") { setCur(null); return; }
      const b = getBounds();
      if (b) setCur({ x: e.clientX - b.ox, y: e.clientY - b.oy });
    };
    const salir = () => setCur(null);
    const tecla = (e) => { if (e.key === "Escape") onCancelar(); };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", salir);
    window.addEventListener("keydown", tecla);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", salir);
      window.removeEventListener("keydown", tecla);
    };
  }, [contRef, getBounds, onCancelar]);

  const b = getBounds();
  if (!b) return null;
  // La imagen en pantalla, con el encuadre aplicado
  const L = b.ix * view.z + view.tx * b.cw, Tp = b.iy * view.z + view.ty * b.ch;
  const Wp = b.iw * view.z, Hp = b.ih * view.z;
  const aPant = (p) => ({ x: L + p.x * Wp, y: Tp + p.y * Hp });
  const dentro = !!cur && cur.x >= L && cur.x <= L + Wp && cur.y >= Tp && cur.y <= Tp + Hp;
  const A = cal.p1 ? aPant(cal.p1) : null;
  // Sin el segundo punto, la línea sigue al puntero
  const nB = cal.p2 || (A && dentro ? { x: (cur.x - L) / Wp, y: (cur.y - Tp) / Hp } : null);
  const B = nB ? aPant(nB) : null;
  const tramo = A && nB ? Math.hypot((nB.x - cal.p1.x) * imageSize.w, (nB.y - cal.p1.y) * imageSize.h) : 0;

  const halo = { stroke: "rgba(0,0,0,0.72)", strokeWidth: 3.5, strokeLinecap: "round" };
  const oro = { stroke: ORO_ESCALA, strokeWidth: 1.5, strokeLinecap: "round" };
  const rotulo = { fontFamily: MONO_ESCALA, fontSize: 11, fontWeight: 600, fill: "#fff", stroke: "rgba(0,0,0,0.85)", strokeWidth: 3, style: { paintOrder: "stroke" } };
  const linea = (x1, y1, x2, y2, k, extra) => [
    <line key={k + "h"} x1={x1} y1={y1} x2={x2} y2={y2} {...halo} />,
    <line key={k + "o"} x1={x1} y1={y1} x2={x2} y2={y2} {...oro} {...(extra || {})} />,
  ];
  const marca = (P, letra) => (
    <g key={letra}>
      <circle cx={P.x} cy={P.y} r={7} fill="none" {...halo} />
      <circle cx={P.x} cy={P.y} r={7} fill="rgba(230,195,92,0.14)" {...oro} />
      <circle cx={P.x} cy={P.y} r={1.6} fill={ORO_ESCALA} />
      <text x={P.x + 10} y={P.y - 10} {...rotulo} fontSize={10}>{letra}</text>
    </g>
  );

  let cota = null;
  if (A && B) {
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    if (len > 2) {
      // Perpendicular a la línea; el rótulo va siempre del lado de arriba
      const nx = -dy / len, ny = dx / len, s = ny > 0 ? -1 : 1, t = 8;
      const fijo = !!cal.p2;
      const texto = `${Math.round(tramo)} px${fijo && mm > 0 ? ` = ${mm} mm` : ""}`;
      cota = (
        <g>
          {linea(A.x, A.y, B.x, B.y, "l", fijo ? null : { strokeDasharray: "5 4" })}
          {fijo && linea(A.x + nx * t, A.y + ny * t, A.x - nx * t, A.y - ny * t, "ta")}
          {fijo && linea(B.x + nx * t, B.y + ny * t, B.x - nx * t, B.y - ny * t, "tb")}
          <text x={(A.x + B.x) / 2 + nx * 17 * s} y={(A.y + B.y) / 2 + ny * 17 * s} textAnchor="middle" dominantBaseline="middle" {...rotulo}>{texto}</text>
        </g>
      );
    }
  }

  // Lupa: cuatro aumentos sobre lo que se ve, al costado del puntero para no taparlo
  let lupa = null;
  if (dentro) {
    const R = 64, M = 4, sep = 92;
    let cx = cur.x - sep, cy = cur.y - sep;
    if (cx - R < 4) cx = cur.x + sep;
    if (cy - R < 4) cy = cur.y + sep;
    cx = Math.min(b.cw - R - 4, cx); cy = Math.min(b.ch - R - 4, cy);
    const wM = Wp * M, hM = Hp * M;
    const cruz = [[R, R - 20, R, R - 6], [R, R + 6, R, R + 20], [R - 20, R, R - 6, R], [R + 6, R, R + 20, R]];
    lupa = (
      <div style={{ position:"absolute",left:cx - R,top:cy - R,width:2 * R,height:2 * R,borderRadius:"50%",overflow:"hidden",border:`2px solid ${ORO_ESCALA}`,boxShadow:"0 0 0 1px rgba(0,0,0,0.6), 0 10px 28px rgba(0,0,0,0.55)",background:"#0e0d0b",pointerEvents:"none",zIndex:8 }}>
        <img src={imageSrc} alt="" draggable={false} style={{ position:"absolute",left:R - (cur.x - L) * M,top:R - (cur.y - Tp) * M,width:wM,height:hM,maxWidth:"none",imageRendering:wM > natW ? "pixelated" : "auto" }} />
        <svg width={2 * R} height={2 * R} style={{ position:"absolute",left:0,top:0 }}>
          {cruz.map((c, i) => linea(c[0], c[1], c[2], c[3], "c" + i))}
          <circle cx={R} cy={R} r={1.4} fill={ORO_ESCALA} stroke="rgba(0,0,0,0.7)" strokeWidth={0.8} />
        </svg>
      </div>
    );
  }

  return (<>
    <svg width={b.cw} height={b.ch} style={{ position:"absolute",left:0,top:0,pointerEvents:"none",zIndex:7,overflow:"visible" }}>
      {cota}
      {A && marca(A, "A")}
      {cal.p2 && B && marca(B, "B")}
    </svg>
    {lupa}
  </>);
}

// Barra de escala del visor, como la de un mapa: el largo redondo más grande
// que entra, con el aumento actual. Solo se ve en pantalla; no entra en la
// imagen exportada.
function BarraEscala({ contRef, getBounds, view, ppmm, anchoTrabajo, solar }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const el = contRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setTick(t => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [contRef]);
  const b = getBounds();
  if (!b || !(ppmm > 0) || !anchoTrabajo) return null;
  const bar = largoBarra(ppmm * b.iw * view.z / anchoTrabajo, Math.min(160, b.cw * 0.3));
  if (!bar) return null;
  const tinta = solar ? "#111111" : "#efe7da";
  return (
    <div aria-label={etiquetaLargo(bar.mm)} style={{ position:"absolute",left:10,top:10,zIndex:6,pointerEvents:"none",padding:"7px 10px 5px",borderRadius:7,background:solar ? "rgba(255,255,255,0.9)" : "rgba(18,16,13,0.66)",border:`1px solid ${solar ? "rgba(0,0,0,0.18)" : "rgba(239,231,218,0.16)"}`,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",boxShadow:"0 4px 14px rgba(0,0,0,0.3)" }}>
      <div style={{ display:"flex",width:bar.px,height:5,border:`1px solid ${tinta}` }}>
        {[0, 1, 2, 3].map(i => <div key={i} style={{ flex:1,background:i % 2 ? "transparent" : tinta }} />)}
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",width:bar.px + 2,marginTop:3,fontFamily:MONO_ESCALA,fontSize:9.5,fontWeight:600,color:tinta,lineHeight:1 }}>
        <span>0</span><span>{etiquetaLargo(bar.mm)}</span>
      </div>
    </div>
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

function RockArtEnhancer() {
  const [image, setImage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [processedSrc, setProcessedSrc] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [intensity, setIntensity] = useState(1.5);
  // Valor del deslizador mientras se arrastra (null = no se está arrastrando).
  // La intensidad se aplica recién al soltarlo, con el evento nativo "change":
  // con una foto de 20 MP cada reproceso congela la página varios segundos, y
  // aplicar en cada pausa del arrastre encadenaba media docena (v3.7.1).
  const [intDraft, setIntDraft] = useState(null);
  const intRangeRef = useCallback((el) => {
    if (el) el.addEventListener("change", () => { setIntensity(parseFloat(el.value)); setIntDraft(null); });
  }, []);
  // Escala del Relieve en % del lado mayor (0 = mapa de bordes de v3.6)
  const [reliefScale, setReliefScale] = useState(0);
  // Opciones del Relieve con escala (v3.8.0), todas apagadas por defecto
  const [relDoble, setRelDoble] = useState(false), [relObjeto, setRelObjeto] = useState(50);
  const [relSuave, setRelSuave] = useState(false), [relClahe, setRelClahe] = useState(false);
  const [relMezcla, setRelMezcla] = useState(null), [relAlfa, setRelAlfa] = useState(50);
  const [relMas, setRelMas] = useState(false);   // el desplegable de opciones
  const relOpts = opcionesRelieve(reliefScale, { doble: relDoble ? relObjeto / 100 : null, suave: relSuave, clahe: relClahe, mezcla: relMezcla, alfa: relAlfa / 100 });
  const relClave = JSON.stringify(relOpts);
  const [processing, setProcessing] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState({ z: 1, tx: 0, ty: 0 });
  const [panTool, setPanTool] = useState(false);
  const [panning, setPanning] = useState(false);
  const panRef = useRef({ active:false, id:null, sx:0, sy:0, tx:0, ty:0 });
  const [showInfo, setShowInfo] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [solar, setSolar] = useState(false);
  // Idioma de la interfaz. El español es el original; el inglés se agregó porque
  // colegas de habla inglesa no llegaban a saber para qué servía cada filtro.
  // En la primera visita se toma del navegador; después manda lo que se eligió.
  const [lang, setLang] = useState(() => {
    try { const v = localStorage.getItem("opc_lang"); if (v === "es" || v === "en") return v; } catch (e) {}
    try { return /^es/i.test(navigator.language || "") ? "es" : "en"; } catch (e) {}
    return "es";
  });
  // tr(es, en): el primer argumento es el español, que es la fuente; el segundo
  // es su traducción. Si falta la traducción se muestra el español, así que
  // agregar un texto nuevo nunca deja un hueco en blanco en la interfaz.
  const tr = (es, en) => (lang === "en" && en != null ? en : es);
  const presetLabel = (id) => { const pr = PRESETS.find(x => x.id === id); return pr ? tr(pr.name, pr.nameEn) : null; };
  const pickLang = (v) => { setLang(v); try { localStorage.setItem("opc_lang", v); } catch (e) {} };
  useEffect(() => { try { document.documentElement.lang = lang; } catch (e) {} }, [lang]);

  const [exifData, setExifData] = useState(null);
  // Segmento EXIF crudo (APP1) para reinyectar en el JPG exportado
  const [exifRaw, setExifRaw] = useState(null);
  // Resolución de trabajo: completa por defecto (hasta 8192 px). Una foto de
  // más de FOTO_GRANDE_MP abre con un cartel que propone bajarla un poco
  // (v3.7.3); también se elige desde el panel. La elección persiste mientras
  // dure la sesión, y el panel queda marcado cuando no es la completa, para
  // que no pase inadvertida.
  const [resId, setResId] = useState("full");
  const [preguntaRes, setPreguntaRes] = useState(false);   // cartel de foto grande
  // «16 MP · 4619 × 3464»; la completa lleva además sus megapíxeles
  const etiquetaRes = (id, t) => {
    const r = RESOLUCIONES.find(x => x.id === id);
    const nombre = id === "full" ? tr("Completa", "Full") : r.mp ? `${r.mp} MP` : `${r.lado} px`;
    return `${nombre} \u00B7 ${t.w} \u00D7 ${t.h}` + (id === "full" ? ` \u00B7 ${Math.round(t.w * t.h / 1e6)} MP` : "");
  };
  // En el desplegable del panel, sin medidas: «Completa (29 MP)», «16 MP»
  const etiquetaResCorta = (id, t) => {
    const r = RESOLUCIONES.find(x => x.id === id);
    return id === "full" ? `${tr("Completa", "Full")} (${Math.round(t.w * t.h / 1e6)} MP)` : r.mp ? `${r.mp} MP` : `${r.lado} px`;
  };
  // NUEVO: modo acumular (stacking)
  const [stackMode, setStackMode] = useState(false);
  // NUEVO: ajustes post-procesamiento
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  // NUEVO: formato de exportación
  const [exportFmt, setExportFmt] = useState("png"); // png|jpg|tiff
  // Informe en PDF junto a cada descarga (v3.8.0); se recuerda entre visitas
  const [conInforme, setConInforme] = useState(() => { try { return localStorage.getItem("opc_informe") !== "0"; } catch (e) { return true; } });
  const cambiarInforme = () => { const v = !conInforme; setConInforme(v); setAvisoGuardado(null); try { localStorage.setItem("opc_informe", v ? "1" : "0"); } catch (e) {} };
  // El registro aparte, en .json (el de adentro de la imagen va siempre)
  const [conJSON, setConJSON] = useState(() => { try { return localStorage.getItem("opc_json") !== "0"; } catch (e) { return true; } });
  const cambiarJSON = () => { const v = !conJSON; setConJSON(v); setAvisoGuardado(null); try { localStorage.setItem("opc_json", v ? "1" : "0"); } catch (e) {} };
  // Con el .json o el informe, todo baja junto: un .zip con una carpeta adentro
  const [avisoGuardado, setAvisoGuardado] = useState(null);
  const avisoTimerRef = useRef(null);
  // NUEVO: herramientas de selección — solo 2 estados React
  // Gotero cromático: color muestreado sobre el resultado + parámetros
  const [picking, setPicking] = useState(false);
  const [pickColor, setPickColor] = useState(null);   // {r,g,b}
  const [pickTol, setPickTol] = useState(20);         // radio en el plano Cb-Cr
  const [pickFeather, setPickFeather] = useState(50); // % de transición
  const [pickGain, setPickGain] = useState(60);       // −100 atenuar … +100 realzar
  const [pickSteps, setPickSteps] = useState([]);     // ajustes ya fijados, en orden
  const [pickSrc, setPickSrc] = useState(null);       // vista previa con el gotero
  const [pickCoverage, setPickCoverage] = useState(0);
  const processedDataRef = useRef(null);              // resultado del filtro, sin gotero
  // Procesador de fondo (worker) y número del último pedido: un resultado que
  // llega con un número viejo se descarta
  const procRef = useRef(null);
  if (!procRef.current) procRef.current = crearProcesador();
  const jobRef = useRef(0);
  const pickBaseRef = useRef(null);                   // + ajustes fijados: de acá se muestrea

  const [selTool, setSelTool] = useState("none"); // none|rect|circle|free
  const [selData, setSelData] = useState(null); // {type,x1,y1,x2,y2} or {type,points:[]}
  // Escala métrica (v3.8.0): la calibración vigente {p1, p2, mm} y, mientras
  // se marca, los puntos tocados {p1?, p2?}; mmDraft es lo que se escribe
  const [escalaCal, setEscalaCal] = useState(null);
  const [calibrando, setCalibrando] = useState(null);
  const [mmDraft, setMmDraft] = useState("");
  const mmInputRef = useRef(null);
  const [barraVisible, setBarraVisible] = useState(true);   // barra de escala sobre la imagen
  const drawRef = useRef({ active: false, tool: "", start: null, pts: [] });
  // NUEVO v3.2: pipeline registrado para procesado por lote (fotogrametría)
  // Cada paso: { presetId, intensity, frozen } — frozen son las estadísticas
  // capturadas de la foto de referencia (matriz congelada, como DStretch)
  const pipelineRef = useRef([]);
  const [showBatch, setShowBatch] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchFmt, setBatchFmt] = useState("jpg"); // jpg|png|tiff
  const [batchRes, setBatchRes] = useState(8192);  // 8192|4000|2000
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done:0, total:0, current:"", errors:[] });
  const batchInputRef = useRef(null);
  const batchCancelRef = useRef(false);
  // Registro de sesión (v3.8.0). entradaRef: nombre, tamaño y huella (una
  // promesa) del archivo cargado; huellasEntradaRef: huella de sus píxeles a
  // cada resolución de trabajo, para no recalcularla en cada descarga.
  const entradaRef = useRef(null);
  const huellasEntradaRef = useRef({});
  const registroInputRef = useRef(null);
  const [registroInfo, setRegistroInfo] = useState(null);   // resultado de reproducir un registro
  // Después de reproducir un registro, la intensidad y la escala quedan en los
  // valores del registro; esto evita que sus efectos reprocesen la imagen
  // que se acaba de rehacer (con varios pasos, la reemplazarían por uno solo).
  const omitirAutoRef = useRef(null);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const compareRef = useRef(null);
  const T = solar ? TS : TD;

  // Calcular el área real de la imagen dentro del contenedor (objectFit contain)
  const getImageBounds = useCallback(() => {
    if (!compareRef.current || !imageSize.w || !imageSize.h) return null;
    const el = compareRef.current;
    const rect = el.getBoundingClientRect();
    // Caja de contenido, no el rectángulo externo: las capas absolutas de
    // adentro se posicionan contra ella y el visor tiene un borde de 1 px.
    // Sin descontarlo, el punto que se toca y el que se procesa se separan, y
    // con el visor ampliado esa diferencia se multiplica por el aumento.
    const cw = el.clientWidth, ch = el.clientHeight;
    const ox = rect.left + (rect.width - cw) / 2, oy = rect.top + (rect.height - ch) / 2;
    const imgAspect = imageSize.w / imageSize.h;
    const cntAspect = cw / ch;
    let iw, ih, ix, iy;
    if (imgAspect > cntAspect) {
      // imagen más ancha que contenedor → barras arriba/abajo
      iw = cw; ih = cw / imgAspect;
      ix = 0; iy = (ch - ih) / 2;
    } else {
      // imagen más alta que contenedor → barras a los lados
      ih = ch; iw = ch * imgAspect;
      ix = (cw - iw) / 2; iy = 0;
    }
    return { ix, iy, iw, ih, cw, ch, ox, oy };
  }, [imageSize]);

  // Convertir coordenadas de pantalla a proporción de imagen (0-1)
  const clientToImageNorm = useCallback((clientX, clientY) => {
    const bounds = getImageBounds();
    if (!bounds) return null;
    const { ix, iy, iw, ih, cw, ch, ox, oy } = bounds;
    // Deshacer el encuadre antes de mapear: el gotero y la selección trabajan
    // sobre la imagen, no sobre lo que se ve en pantalla.
    const lx = (clientX - ox - view.tx * cw) / view.z - ix;
    const ly = (clientY - oy - view.ty * ch) / view.z - iy;
    return { x: Math.max(0, Math.min(1, lx / iw)), y: Math.max(0, Math.min(1, ly / ih)) };
  }, [getImageBounds, view]);
  // Amplia o reduce dejando fijo el punto (fx,fy) del visor, en fracciones de
  // su ancho y alto: con la rueda ese punto es el cursor; con los botones, el centro.
  const zoomAt = useCallback((factor, fx, fy) => {
    setView(v => {
      const z = Math.max(1, Math.min(ZOOM_MAX, v.z * factor));
      const k = z / v.z;
      return clampView({ z, tx: fx - k*(fx - v.tx), ty: fy - k*(fy - v.ty) });
    });
  }, []);
  const resetView = useCallback(() => setView({ z:1, tx:0, ty:0 }), []);

  // La rueda del mouse amplia sobre el cursor. El listener se registra a mano y
  // con passive:false porque React declara "wheel" como pasivo y ahi
  // preventDefault no llega a frenar el desplazamiento de la pagina.
  useEffect(() => {
    const el = compareRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const b = getImageBounds(); if (!b) return;
      zoomAt(e.deltaY < 0 ? 1.18 : 1/1.18, (e.clientX-b.ox)/b.cw, (e.clientY-b.oy)/b.ch);
    };
    el.addEventListener("wheel", onWheel, { passive:false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [imageSrc, zoomAt, getImageBounds]);

  // Mano: arrastrar mueve el encuadre. Tambien responde al boton del medio,
  // sin necesidad de activar la herramienta.
  const startPan = (e) => {
    const el = compareRef.current; if (!el) return;
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch(ex){}
    panRef.current = { active:true, id:e.pointerId, sx:e.clientX, sy:e.clientY, tx:view.tx, ty:view.ty };
    setPanning(true);
  };
  const movePan = (e) => {
    const p = panRef.current; if (!p.active) return;   // antes de medir: esto corre en cada movimiento del puntero
    const b = getImageBounds(); if (!b) return;
    setView(v => clampView({ z:v.z, tx: p.tx + (e.clientX-p.sx)/b.cw, ty: p.ty + (e.clientY-p.sy)/b.ch }));
  };
  const endPan = () => {
    if (!panRef.current.active) return;
    try { if(compareRef.current) compareRef.current.releasePointerCapture(panRef.current.id); } catch(ex){}
    panRef.current.active = false; setPanning(false);
  };

  const generateMask = useCallback((sel, w, h) => {
    if (!sel) return null;
    const mask = new Uint8Array(w * h);
    if (sel.type === "rect") {
      const x1 = Math.round(Math.min(sel.x1, sel.x2) * w), x2 = Math.round(Math.max(sel.x1, sel.x2) * w);
      const y1 = Math.round(Math.min(sel.y1, sel.y2) * h), y2 = Math.round(Math.max(sel.y1, sel.y2) * h);
      for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) if (x>=0&&x<w&&y>=0&&y<h) mask[y*w+x] = 1;
    } else if (sel.type === "circle") {
      const cx = (sel.x1 + sel.x2) / 2 * w, cy = (sel.y1 + sel.y2) / 2 * h;
      const rx = Math.abs(sel.x2 - sel.x1) / 2 * w, ry = Math.abs(sel.y2 - sel.y1) / 2 * h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1) mask[y*w+x] = 1;
      }
    } else if (sel.type === "free" && sel.points && sel.points.length > 2) {
      // Rasterizar el polígono con canvas (mucho más rápido que
      // point-in-polygon por píxel con cientos de vértices)
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(sel.points[0].x * w, sel.points[0].y * h);
      for (let i = 1; i < sel.points.length; i++) ctx.lineTo(sel.points[i].x * w, sel.points[i].y * h);
      ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill();
      const d = ctx.getImageData(0, 0, w, h).data;
      for (let i = 0; i < w*h; i++) if (d[i*4+3] > 127) mask[i] = 1;
    }
    return mask;
  }, []);

  // CSS filter para contraste y saturación en tiempo real
  const postFilter = (contrast === 0 && saturation === 0) ? "none"
    : `contrast(${1 + contrast/100}) saturate(${1 + saturation/100})`;

  const viewTransform = `translate(${view.tx*100}%,${view.ty*100}%) scale(${view.z})`;
  // El deslizador de comparacion vive en coordenadas de pantalla: la linea queda
  // clavada en sliderPos% del visor aunque la imagen este ampliada o corrida, asi
  // que el corte de la procesada se traduce al sistema de la capa ampliada.
  const clipPct = Math.max(0, Math.min(100, (sliderPos - view.tx*100) / view.z));
  // Pasado cierto aumento se muestran los pixeles reales: el suavizado del
  // navegador inventa detalle y en un panel rupestre eso se confunde con textura.
  const zoomPx = view.z >= 3 ? "pixelated" : "auto";

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFileName(file.name); setExifData(null); setExifRaw(null); setRegistroInfo(null);
    setEscalaCal(null); setCalibrando(null); setMmDraft("");
    entradaRef.current = null; huellasEntradaRef.current = {};
    const er = new FileReader();
    er.onload = (e) => {
      // Huella del archivo tal cual, para el registro de cada exportación
      entradaRef.current = { archivo: file.name, bytes: file.size, sha256: huellaSHA256(new Uint8Array(e.target.result)), file };
      try { const p = parseExifData(e.target.result); if(p) setExifData(p); const seg = extractExifSegment(e.target.result); if(seg) setExifRaw(seg); } catch(err){}
    };
    er.readAsArrayBuffer(file);
    const dr = new FileReader();
    dr.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Si la resolución elegida antes no tiene sentido para esta foto (no
        // la achica, o casi nada), se vuelve a la completa, que es lo que el
        // menú del panel va a mostrar
        const rid = opcionesResolucion(img.naturalWidth, img.naturalHeight).some(o => o.id === resId) ? resId : "full";
        setResId(rid);
        setPreguntaRes(esFotoGrande(img.naturalWidth, img.naturalHeight));
        setImageSize(tamanoTrabajo(img.naturalWidth, img.naturalHeight, rid)); setImage(img); setImageSrc(e.target.result); cancelarProceso(); setProcessedSrc(null); setActivePreset(null); setStackMode(false); setSelData(null); setSelTool("none"); setContrast(0); setSaturation(0); setPickColor(null); setPickSteps([]); setPicking(false); setPickSrc(null); processedDataRef.current=null; pickBaseRef.current=null; drawRef.current={active:false,tool:"",start:null,pts:[]}; pipelineRef.current=[]; setView({z:1,tx:0,ty:0}); setPanTool(false);
      };
      img.src = e.target.result;
    };
    dr.readAsDataURL(file);
  }, [resId]);

  const setWorkingRes = (nv) => {
    setPreguntaRes(false);
    if (nv === resId) return;
    setResId(nv);
    if (image) {
      setImageSize(tamanoTrabajo(image.naturalWidth, image.naturalHeight, nv));
      cancelarProceso(); setProcessedSrc(null); setActivePreset(null); setSelData(null); setSelTool("none");
      drawRef.current={active:false,tool:"",start:null,pts:[]}; pipelineRef.current=[];
    }
  };

  // processImage: soporta stacking y máscara de selección. El filtro corre en
  // el procesador de fondo (v3.7.2): la página sigue respondiendo y un pedido
  // nuevo —otro filtro, otra intensidad— cancela el que estaba en curso.
  const processImage = useCallback((preset, int) => {
    if (!image) return;
    const job = ++jobRef.current;
    procRef.current.cancelar();
    omitirAutoRef.current = null;
    setProcessing(true); setActivePreset(preset.id); setRegistroInfo(null);
    const apilar = stackMode && !!processedSrc;
    // setTimeout directo (no requestAnimationFrame): rAF se pausa si la
    // pestaña pierde visibilidad y el procesamiento quedaba colgado
    setTimeout(async () => {
      if (job !== jobRef.current) return;
      try {
        const cv = document.createElement("canvas"), ctx = cv.getContext("2d"), {w,h} = imageSize;
        cv.width=w; cv.height=h;

        const mask = generateMask(selData, w, h);
        // Parámetros propios de un filtro; viajan también al pipeline del lote
        const opts = preset.id === "relief" ? relOpts : null;

        // Si stackMode y hay resultado previo, usar ese como fuente
        let fuente = image;
        if (apilar) {
          fuente = await new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = processedSrc; });
          if (job !== jobRef.current) return;
        }
        ctx.drawImage(fuente,0,0,w,h);
        const sourceData = ctx.getImageData(0,0,w,h);
        // La máscara también se pasa al filtro: las estadísticas se calculan
        // sobre la zona seleccionada (decorrelación local, como DStretch)
        const r = await procRef.current.correr({ presetId: preset.id, origen: sourceData.data, w, h, intensity: int, mask, frozen: null, opts });
        if (job !== jobRef.current) return;   // llegó otro pedido mientras tanto
        // Ya viene combinado con la selección (aplicarMascara)
        const final = new ImageData(r.data, w, h);
        processedDataRef.current = final;   // fuente del gotero: el filtro sin ajustes post
        if (r.png) setProcessedSrc(URL.createObjectURL(r.png));
        else { ctx.putImageData(final,0,0); setProcessedSrc(cv.toDataURL("image/png")); }
        // La selección va con cada paso para el registro: en el modo Acumular
        // cada filtro puede haberse aplicado sobre una zona distinta
        const paso = { presetId: preset.id, intensity: int, frozen: r.frozen, opts, sel: selData || null };
        // Acumulado → se suma al pipeline del lote; aplicación fresca → arranca de cero
        if (apilar) pipelineRef.current.push(paso); else pipelineRef.current = [paso];
      } catch(e) { if (e === PROC_CANCELADO) return; console.error(e); }
      if (job === jobRef.current) setProcessing(false);
    }, 50);
  }, [image, imageSize, stackMode, processedSrc, selData, generateMask, relClave]);

  // Descarta el cálculo en curso: al cambiar de foto, de resolución o de
  // selección, un resultado que llegue tarde ya no corresponde a lo que se ve
  const cancelarProceso = () => { jobRef.current++; procRef.current.cancelar(); setProcessing(false); };

  // El PNG del worker llega como Blob: cada resultado reemplazado se libera
  // (unos 75 MB con 29 MP). Con demora, por si una descarga o el modo
  // Acumular todavía lo están leyendo.
  useEffect(() => {
    const u = processedSrc;
    return () => { if (u && u.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(u), 30000); };
  }, [processedSrc]);

  useEffect(() => {
    // En modo acumular NO se reaplica automáticamente al mover la intensidad:
    // cada reaplicación tomaría el resultado previo como fuente y el filtro
    // se acumularía sin control. El usuario reaplica con el botón del filtro.
    if (stackMode) return;
    const g = omitirAutoRef.current;
    if (g && g.intensity === intensity && g.clave === relClave) return;   // recién reproducido
    if (activePreset && image) { const p = PRESETS.find(x=>x.id===activePreset); if(p){ const t=setTimeout(()=>processImage(p,intensity),250); return ()=>clearTimeout(t); }}
  }, [intensity]);

  // Lo mismo con la escala y las opciones del Relieve, que solo afectan a ese filtro
  useEffect(() => {
    if (stackMode || activePreset !== "relief" || !image) return;
    const g = omitirAutoRef.current;
    if (g && g.intensity === intensity && g.clave === relClave) return;
    const p = PRESETS.find(x => x.id === "relief");
    const t = setTimeout(() => processImage(p, intensity), 100);
    return () => clearTimeout(t);
  }, [relClave]);

  const handleSliderMove = useCallback((cx) => { const b=getImageBounds(); if(!b) return; setSliderPos(Math.max(0,Math.min(100,((cx-b.ox)/b.cw)*100))); }, [getImageBounds]);
  const handlePointerDown = (e) => { setDragging(true); handleSliderMove(e.clientX); };
  useEffect(() => { if(!dragging) return; const m=(e)=>handleSliderMove(e.clientX), u=()=>setDragging(false); window.addEventListener("pointermove",m); window.addEventListener("pointerup",u); return ()=>{window.removeEventListener("pointermove",m);window.removeEventListener("pointerup",u);}; }, [dragging,handleSliderMove]);

  // TIFF sin comprimir (RGB 8-bit); el codificador está en tiffRGB
  const encodeTIFF = (canvas, descripcion, pix) => {
    const w = canvas.width, h = canvas.height;
    const data = (pix || canvas.getContext("2d").getImageData(0, 0, w, h)).data;
    return new Blob([tiffRGB(data, w, h, descripcion)], { type: "image/tiff" });
  };

  // Mete el registro dentro de la imagen codificada, según el formato
  const conRegistro = async (blob, ext, texto) => {
    if (!blob || !texto || ext === "tif") return blob;
    try {
      const u8 = new Uint8Array(await blob.arrayBuffer());
      if (ext === "png") return new Blob([pngConRegistro(u8, texto)], { type: "image/png" });
      if (ext === "jpg") return new Blob([jpegConRegistro(u8, texto)], { type: "image/jpeg" });
    } catch (err) { console.error("Registro:", err); }
    return blob;
  };

  // Píxeles de la foto a la resolución de trabajo, tomados igual que en
  // processImage, y su huella (una por tamaño, se calcula una sola vez)
  const leerEntrada = (w, h) => {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d"); ctx.drawImage(image, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h); cv.width = 0; cv.height = 0;
    return d;
  };
  const huellaEntrada = (w, h) => {
    const k = `${w}x${h}`, c = huellasEntradaRef.current;
    if (!c[k]) c[k] = huellaSHA256(pixelesRGB(leerEntrada(w, h).data));
    return c[k];
  };

  // Contraste y saturación de la descarga suelta: el filtro del navegador,
  // como hasta v3.7.3. La reproducción de un registro pasa por acá también,
  // así que rehace exactamente lo que se exportó (en el mismo navegador).
  const ajustesNavegador = (fuente, w, h, c, s) => {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    if (c !== 0 || s !== 0) ctx.filter = `contrast(${1 + c/100}) saturate(${1 + s/100})`;
    ctx.drawImage(fuente, 0, 0);
    return cv;
  };

  // Miniatura en JPEG para el informe: lado mayor de hasta 1400 px, sobre
  // blanco, porque el JPEG no tiene transparencia
  const miniaturaJPEG = async (fuente, w, h) => {
    const s = Math.min(1, 1400 / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(fuente, 0, 0, c.width, c.height);
    const b = await new Promise(r => c.toBlob(r, "image/jpeg", 0.88));
    return b ? { bytes: new Uint8Array(await b.arrayBuffer()), ancho: c.width, alto: c.height, canales: 3 } : null;
  };
  // El logo de OPC ya es un JPEG: va al informe tal cual
  const logoJPEG = () => {
    try {
      const bin = atob(OPC_LOGO.slice(OPC_LOGO.indexOf(",") + 1)), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const tm = tamanoJPEG(bytes);
      return tm ? { bytes, ...tm } : null;
    } catch (e) { return null; }
  };

  const bajarArchivo = (blob, nombre) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nombre;
    a.style.display = "none"; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  };

  // Ajustes del gotero que entran en la imagen: los fijados y el que está en curso
  const goteroActual = () => [...pickSteps, ...((pickColor && pickGain) ? [{ ...pickColor, tol:pickTol, feather:pickFeather, gain:pickGain }] : [])];

  // Varios archivos juntos: un .zip con el nombre de la exportación, que baja
  // donde baja todo y trae adentro una carpeta con ese mismo nombre. Una página
  // web no puede crear carpetas en Descargas (el navegador solo le deja bajar
  // archivos sueltos, y cambia la «/» de un nombre por «_»), así que la
  // carpeta viaja dentro del .zip. Windows lo abre como una carpeta más.
  const bajarJuntos = async (base, archivos) => {
    const entradas = await Promise.all(archivos.map(async a => ({ nombre: `${base}/${a.nombre}`, bytes: new Uint8Array(await a.blob.arrayBuffer()) })));
    bajarArchivo(new Blob([zipSinComprimir(entradas, new Date())], { type: "application/zip" }), `${base}.zip`);
    return { zip: `${base}.zip`, cuantos: archivos.length };
  };

  const handleDownload = async () => {
    if (!processedSrc) return;
    const extras = conJSON || conInforme;
    setAvisoGuardado(null);
    try {
      const tmpImg = await new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = pickSrc || processedSrc; });
      const cv = ajustesNavegador(tmpImg, tmpImg.naturalWidth, tmpImg.naturalHeight, contrast, saturation);
      // Nombre reproducible: filtro + intensidad + ajustes post aplicados
      const gPasos = goteroActual();
      const gt = gPasos.length ? "_gotero" + gPasos.map(a => `_g${a.gain>0?"+":""}${a.gain}t${a.tol}`).join("") : "";
      // La escala del Relieve va al lado de la intensidad; con 0 (bordes) se
      // omite, así el nombre sale igual que en v3.6 para el mismo resultado
      // y sus opciones, si hay alguna prendida (v3.8.0)
      const pasoRel = [...pipelineRef.current].reverse().find(p => p.presetId === "relief");
      const esc = activePreset === "relief" ? sufijoRelieve(pasoRel ? pasoRel.opts : relOpts) : "";
      const params = `_i${intensity.toFixed(1)}${esc}${gt}${contrast!==0?`_c${contrast}`:""}${saturation!==0?`_s${saturation}`:""}`;
      const base = `${(fileName||"opc").replace(/\.[^.]+$/,"")}_OPC_${activePreset}${params}`;
      const ext = exportFmt === "tiff" ? "tif" : exportFmt;
      const pix = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height);
      // Registro: si algo falla al armarlo, la imagen se descarga igual
      let reg = null, texto = null;
      try {
        const ent = entradaRef.current, { w, h } = imageSize;
        reg = armarRegistro({
          version: OPC_VERSION, fecha: new Date().toISOString(),
          entrada: { archivo: fileName, bytes: ent ? ent.bytes : null, sha256: ent ? await ent.sha256 : null, ancho: image.naturalWidth, alto: image.naturalHeight },
          trabajo: { resolucion: resId, ancho: w, alto: h, sha256_pixeles: await huellaEntrada(w, h) },
          escala: escalaCal ? escalaARegistro(escalaCal, { ancho: image.naturalWidth, alto: image.naturalHeight }, { ancho: w, alto: h }) : null,
          pasos: pipelineRef.current, gotero: gPasos,
          contraste: contrast, saturacion: saturation, metodoAjustes: "filtro_css",
          salida: { archivo: `${base}.${ext}`, formato: ext, sha256_pixeles: await huellaSHA256(pixelesRGB(pix.data)) },
        });
        texto = JSON.stringify(reg, null, 2);
      } catch (err) { console.error("Registro:", err); }
      let blob;
      if (exportFmt === "tiff") {
        blob = encodeTIFF(cv, texto, pix);
      } else if (exportFmt === "jpg") {
        blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.92));
        // Reinyectar el EXIF original (GPS/fecha) en el JPG exportado
        if (blob && exifRaw) {
          try {
            const buf = new Uint8Array(await blob.arrayBuffer());
            if (buf[0] === 0xFF && buf[1] === 0xD8) blob = new Blob([buf.slice(0, 2), exifRaw, buf.slice(2)], { type: "image/jpeg" });
          } catch (err) {}
        }
      } else {
        blob = await new Promise(r => cv.toBlob(r, "image/png"));
      }
      if (!blob) return;
      // El registro va siempre adentro de la imagen
      blob = await conRegistro(blob, ext, texto);
      const archivos = [{ nombre: `${base}.${ext}`, blob }];
      if (extras && reg) {
        // Afuera lleva además la huella del archivo ya armado (adentro no
        // puede ir: cambiaría el archivo que describe)
        const sha = await huellaSHA256(new Uint8Array(await blob.arrayBuffer()));
        const lado = { ...reg, salida: { ...reg.salida, sha256: sha } };
        if (conJSON) archivos.push({ nombre: `${base}.json`, blob: new Blob([JSON.stringify(lado, null, 2)], { type: "application/json" }) });
        if (conInforme) {
          try {
            const pdf = informePDF(lado, {
              lang, nombreFiltro: (id) => presetLabel(id),
              original: await miniaturaJPEG(image, image.naturalWidth, image.naturalHeight),
              resultado: await miniaturaJPEG(cv, cv.width, cv.height),
              logo: logoJPEG(),
              fechaToma: exifData && exifData.dateTime, hayGPS: !!(exifData && exifData.gps),
            });
            archivos.push({ nombre: `${base}.pdf`, blob: new Blob([pdf], { type: "application/pdf" }) });
          } catch (err) { console.error("Informe PDF:", err); }
        }
      }
      // Solo la imagen: una descarga común, como siempre. Con más archivos,
      // todo junto, en una carpeta dentro de un .zip.
      if (archivos.length === 1) { bajarArchivo(blob, archivos[0].nombre); return; }
      const dest = await bajarJuntos(base, archivos);
      setAvisoGuardado(dest);
      clearTimeout(avisoTimerRef.current);
      avisoTimerRef.current = setTimeout(() => setAvisoGuardado(null), 9000);
    } catch (e) { console.error("Descarga:", e); }
  };

  // ============================================================
  // REPRODUCIR UN REGISTRO (v3.8.0)
  // Con la foto original cargada, rehace la imagen a partir de su registro
  // y comprueba, paso a paso, que salga igual: el archivo de entrada, sus
  // píxeles a la resolución de trabajo y los píxeles del resultado.
  // ============================================================
  const abrirRegistro = async (file) => {
    if (!file) return;
    let rec = null;
    try { rec = leerRegistro(new Uint8Array(await file.arrayBuffer())); } catch (err) { rec = null; }
    if (!rec) {
      setRegistroInfo({ ok: false, titulo: { es: "Sin registro", en: "No record" },
        items: [{ ok: false, es: `${file.name} no contiene un registro de OPC. Sirve el .json que se descarga junto a cada imagen, o una imagen exportada con OPC v3.8.0 o posterior.`,
          en: `${file.name} contains no OPC record. Use the .json downloaded with each image, or an image exported with OPC v3.8.0 or later.` }] });
      return;
    }
    reproducirRegistro(rec);
  };

  const reproducirRegistro = async (rec) => {
    if (!image) return;
    const job = ++jobRef.current;
    procRef.current.cancelar();
    setProcessing(true); setRegistroInfo(null);
    const items = [];
    const nota = (ok, es, en) => items.push({ ok, es, en });
    const terminar = (titulo) => {
      setRegistroInfo({ ok: items.every(i => i.ok !== false), titulo, items });
      setProcessing(false);
    };
    try {
      const pasos = pasosDesdeRegistro(rec), lote = !!rec.lote;
      const desconocidos = pasos.filter(p => !PRESETS.some(x => x.id === p.presetId)).map(p => p.presetId);
      if (!pasos.length || desconocidos.length) {
        nota(false, `El registro usa filtros que esta versión no tiene: ${desconocidos.join(", ") || "ninguno"}.`, `The record uses filters this version does not have: ${desconocidos.join(", ") || "none"}.`);
        return terminar({ es: "No se pudo reproducir", en: "Could not replay" });
      }
      // 1. Versión de OPC
      const vr = rec.opc && rec.opc.version;
      if (vr === OPC_VERSION) nota(true, `Hecho con esta misma versión (v${vr}).`, `Made with this same version (v${vr}).`);
      // Un registro más nuevo puede venir de una versión que cambió algún
      // filtro, y esta no tiene cómo saberlo
      else if (compararVersiones(vr, OPC_VERSION) > 0) nota(false, `El registro es de una versión más nueva (v${vr}); esta es v${OPC_VERSION} y no sabe si entre medio cambió algún filtro.`, `The record comes from a newer version (v${vr}); this is v${OPC_VERSION} and cannot tell whether any filter changed in between.`);
      else {
        const cambios = cambiosEntre(vr, OPC_VERSION, pasos.map(p => p.presetId));
        if (cambios.length) nota(false, `Entre v${vr} y v${OPC_VERSION} cambió el resultado de filtros que usa: ${cambios.map(c => `v${c.version}, ${c.es}`).join("; ")}. La imagen puede no salir igual.`,
          `Between v${vr} and v${OPC_VERSION} the result of filters it uses changed: ${cambios.map(c => `v${c.version}, ${c.en}`).join("; ")}. The image may not come out the same.`);
        else nota(true, `Hecho con v${vr}. Entre medio no hubo cambios de resultados en estos filtros.`, `Made with v${vr}. No result changes in these filters since then.`);
      }
      // 2. La foto
      const ent = entradaRef.current, re = rec.entrada || {};
      const sha = ent ? await ent.sha256 : null;
      if (job !== jobRef.current) return;
      if (re.sha256 && sha) {
        if (re.sha256 === sha) nota(true, `Es la misma foto (${re.archivo}): el archivo coincide byte a byte.`, `It is the same photo (${re.archivo}): the file matches byte for byte.`);
        else nota(false, `La foto cargada no es la del registro (${re.archivo}): el archivo es distinto.`, `The loaded photo is not the one in the record (${re.archivo}): the file differs.`);
      }
      // 3. Tamaño de trabajo: en el lote, el lado máximo; si no, la resolución
      let w = image.naturalWidth, h = image.naturalHeight;
      if (lote) {
        const L = (rec.trabajo && rec.trabajo.lado_max) || 8192;
        if (w > L || h > L) { const s = L / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      } else ({ w, h } = tamanoTrabajo(w, h, (rec.trabajo && rec.trabajo.resolucion) || "full"));
      if (rec.trabajo && rec.trabajo.ancho && (rec.trabajo.ancho !== w || rec.trabajo.alto !== h))
        nota(false, `El tamaño de trabajo no coincide: el registro dice ${rec.trabajo.ancho} × ${rec.trabajo.alto} y sale ${w} × ${h}.`, `The working size does not match: the record says ${rec.trabajo.ancho} × ${rec.trabajo.alto} and this gives ${w} × ${h}.`);
      // 4. Píxeles de entrada. El lote lee cada foto con createImageBitmap y la
      // vista con un <img>, y Chrome no decodifica igual un JPG por los dos
      // caminos: difieren en un nivel en alrededor del 0,5 % de los valores.
      // Cada registro se rehace leyendo la foto como la leyó quien lo hizo.
      let src;
      if (lote && ent && ent.file) {
        const bmp = await createImageBitmap(ent.file);
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d"); ctx.drawImage(bmp, 0, 0, w, h); bmp.close();
        src = ctx.getImageData(0, 0, w, h); cv.width = 0; cv.height = 0;
      } else src = leerEntrada(w, h);
      const shaPix = await huellaSHA256(pixelesRGB(src.data));
      if (!lote) huellasEntradaRef.current[`${w}x${h}`] = Promise.resolve(shaPix);
      if (job !== jobRef.current) return;
      if (rec.trabajo && rec.trabajo.sha256_pixeles) {
        if (rec.trabajo.sha256_pixeles === shaPix) nota(true, `Los píxeles de entrada a ${w} × ${h} coinciden.`, `The input pixels at ${w} × ${h} match.`);
        else nota(false, `Los píxeles de entrada a ${w} × ${h} no coinciden. Si el archivo es el mismo, la diferencia viene del navegador al leer la foto${(w !== image.naturalWidth || h !== image.naturalHeight) ? " o al reducirla" : ""}.`,
          `The input pixels at ${w} × ${h} do not match. If the file is the same, the difference comes from the browser reading the photo${(w !== image.naturalWidth || h !== image.naturalHeight) ? " or scaling it down" : ""}.`);
      }
      // 5. Los filtros, en orden. Fuera del lote se recalculan desde cero, con
      // la selección de cada paso, como se hicieron; en el lote van con las
      // estadísticas congeladas de la referencia y sobre la foto entera.
      let actual = src.data, png = null;
      const nuevos = [];
      for (const p of pasos) {
        const mask = lote ? null : generateMask(p.sel, w, h);
        const r = await procRef.current.correr({ presetId: p.presetId, origen: actual, w, h, intensity: p.intensity, mask, frozen: lote ? p.frozen : null, opts: p.opts });
        if (job !== jobRef.current) return;
        actual = r.data; png = r.png;
        nuevos.push({ ...p, frozen: r.frozen || p.frozen });
      }
      const resultado = new ImageData(actual, w, h);
      // 6. Gotero y ajustes, por el mismo camino que la exportación
      const gotero = goteroDesdeRegistro(rec), aj = rec.ajustes || {};
      const c = aj.contraste || 0, s = aj.saturacion || 0;
      let final = new ImageData(new Uint8ClampedArray(actual), w, h);
      applyPickChain(final, gotero, null);
      if (aj.metodo === "por_pixel") applyPostAdjust(final, c, s);
      else if (c || s) {
        const tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h;
        tmp.getContext("2d").putImageData(final, 0, 0);
        final = ajustesNavegador(tmp, w, h, c, s).getContext("2d").getImageData(0, 0, w, h);
      }
      // 7. El resultado
      if (rec.salida && rec.salida.sha256_pixeles) {
        const shaOut = await huellaSHA256(pixelesRGB(final.data));
        if (job !== jobRef.current) return;
        if (shaOut === rec.salida.sha256_pixeles) nota(true, `La imagen rehecha es idéntica, píxel a píxel, a ${rec.salida.archivo}.`, `The replayed image is identical, pixel for pixel, to ${rec.salida.archivo}.`);
        else nota(false, `La imagen rehecha no es idéntica a ${rec.salida.archivo}.`, `The replayed image is not identical to ${rec.salida.archivo}.`);
      }
      // 8. La interfaz queda como al exportar
      const ultimo = pasos[pasos.length - 1];
      const relieve = [...pasos].reverse().find(p => p.presetId === "relief");
      const escala = relieve ? ((relieve.opts && relieve.opts.escala) || 0) : reliefScale;
      // Las opciones del Relieve vuelven como estaban; sin Relieve, quedan las de ahora
      const ro = relieve ? (relieve.opts || {}) : null;
      const rel = ro
        ? { doble: ro.doble != null, objeto: ro.doble != null ? Math.round(ro.doble * 100) : relObjeto, suave: !!ro.suave, clahe: !!ro.clahe,
            mezcla: ro.mezcla || null, alfa: ro.mezcla ? Math.round((ro.alfa == null ? 0.5 : ro.alfa) * 100) : relAlfa }
        : { doble: relDoble, objeto: relObjeto, suave: relSuave, clahe: relClahe, mezcla: relMezcla, alfa: relAlfa };
      const clave = JSON.stringify(opcionesRelieve(escala, { doble: rel.doble ? rel.objeto / 100 : null, suave: rel.suave, clahe: rel.clahe, mezcla: rel.mezcla, alfa: rel.alfa / 100 }));
      omitirAutoRef.current = { intensity: ultimo.intensity, clave };
      if (!lote && rec.trabajo && rec.trabajo.resolucion) setResId(rec.trabajo.resolucion);
      setImageSize({ w, h });
      processedDataRef.current = resultado;
      if (png) setProcessedSrc(URL.createObjectURL(png));
      else { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").putImageData(resultado, 0, 0); setProcessedSrc(cv.toDataURL("image/png")); }
      pipelineRef.current = nuevos;
      setActivePreset(ultimo.presetId); setIntensity(ultimo.intensity); setIntDraft(null); setReliefScale(escala);
      setRelDoble(rel.doble); setRelObjeto(rel.objeto); setRelSuave(rel.suave); setRelClahe(rel.clahe); setRelMezcla(rel.mezcla); setRelAlfa(rel.alfa);
      if (rel.doble || rel.suave || rel.clahe || rel.mezcla) setRelMas(true);
      setStackMode(pasos.length > 1);
      setSelData(lote ? null : (ultimo.sel || null)); setSelTool("none"); drawRef.current = { active:false, tool:"", start:null, pts:[] };
      setPickSteps(gotero); setPickColor(null); setPicking(false);
      setContrast(c); setSaturation(s);
      // La escala métrica, si se había calibrado (el lote no la registra)
      const escRec = escalaDesdeRegistro(rec.escala);
      setEscalaCal(escRec); setCalibrando(null);
      if (escRec) {
        const p = numCorto(pxPorMM(escRec, w, h));
        nota(true, `Escala métrica: 1 mm = ${p} px a la resolución de trabajo, calibrada sobre ${escRec.mm} mm.`, `Metric scale: 1 mm = ${p} px at the working resolution, calibrated over ${escRec.mm} mm.`);
      }
      terminar(items.every(i => i.ok !== false) ? { es: "Registro reproducido", en: "Record replayed" } : { es: "Registro reproducido, con diferencias", en: "Record replayed, with differences" });
    } catch (err) {
      if (err === PROC_CANCELADO) return;
      console.error(err);
      nota(false, `Error al reproducir: ${(err && err.message) || err}`, `Error while replaying: ${(err && err.message) || err}`);
      terminar({ es: "No se pudo reproducir", en: "Could not replay" });
    }
  };

  // ============================================================
  // PROCESADO POR LOTE (fotogrametría)
  // Aplica el pipeline registrado (filtros + intensidades + estadísticas
  // CONGELADAS de la foto de referencia) a N fotos y las guarda con el
  // mismo nombre de archivo, conservando el EXIF de cada una.
  // ============================================================
  const runBatch = async () => {
    const files = batchFiles, pipeline = pipelineRef.current;
    if (!files.length || !pipeline.length || batchRunning) return;
    // Carpeta destino vía File System Access API (Chrome/Edge).
    // Si no está disponible, cada foto se descarga individualmente.
    let dirHandle = null;
    if (window.showDirectoryPicker) {
      try { dirHandle = await window.showDirectoryPicker({ mode: "readwrite" }); }
      catch (e) { return; } // usuario canceló
    }
    setBatchRunning(true); batchCancelRef.current = false;
    setBatchProgress({ done:0, total:files.length, current:"", errors:[] });
    const errors = [];
    const guardar = async (blob, nombre) => {
      if (dirHandle) {
        const fh = await dirHandle.getFileHandle(nombre, { create: true });
        const ws = await fh.createWritable();
        await ws.write(blob); await ws.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = nombre; a.style.display = "none";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
    };
    // Registro (v3.8.0): lo común a todas las fotos. La selección de cada paso
    // es la de la foto de referencia: sirvió para calcular las estadísticas,
    // que en el lote se aplican congeladas a cada foto entera.
    const ent = entradaRef.current;
    const gPasos = goteroActual();
    const lote = { referencia: { archivo: fileName, sha256: ent ? await ent.sha256 : null, ancho_trabajo: imageSize.w, alto_trabajo: imageSize.h },
      lado_max: batchRes, formato: batchFmt, estadisticas_congeladas: true };
    const comun = { version: OPC_VERSION, pasos: pipeline, gotero: gPasos, contraste: contrast, saturacion: saturation,
      metodoAjustes: "por_pixel", tamSeleccion: { ancho: imageSize.w, alto: imageSize.h } };
    const filas = [];
    // Un ÚNICO canvas reutilizado en todo el lote: crear uno por foto
    // acumulaba backing stores sin liberar y agotaba la memoria
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d");
    for (let fi = 0; fi < files.length; fi++) {
      if (batchCancelRef.current) break;
      const file = files[fi];
      setBatchProgress(p => ({ ...p, current: file.name }));
      // Ceder el hilo para que la UI actualice el progreso
      await new Promise(r => setTimeout(r, 30));
      const fila = { archivo_entrada: file.name };
      try {
        const original = new Uint8Array(await file.arrayBuffer());
        const shaEntrada = huellaSHA256(original);
        // EXIF crudo de ESTA foto (cada una conserva su propio GPS/fecha)
        let exifSeg = null;
        if (batchFmt === "jpg") {
          try { exifSeg = extractExifSegment(original.buffer); } catch (e) {}
        }
        const bmp = await createImageBitmap(file);
        const w0 = bmp.width, h0 = bmp.height;
        let w = w0, h = h0;
        if (w > batchRes || h > batchRes) { const s = batchRes / Math.max(w, h); w = Math.round(w*s); h = Math.round(h*s); }
        cv.width = w; cv.height = h; // redimensionar también limpia el canvas
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        let id = ctx.getImageData(0, 0, w, h);
        const shaPixEntrada = huellaSHA256(pixelesRGB(id.data));
        // Aplicar cada paso del pipeline con sus estadísticas congeladas
        // (sin máscara: en el lote el realce cubre la imagen completa)
        for (const step of pipeline) {
          const preset = PRESETS.find(p => p.id === step.presetId);
          if (!preset) continue;
          id = preset.fn(id, step.intensity, null, step.frozen ? { frozen: step.frozen } : null, step.opts);
          await new Promise(r => setTimeout(r, 0));
        }
        // El gotero va antes de los ajustes post, igual que en la vista previa.
        // Los ajustes post van por píxel (applyPostAdjust): con ctx.filter, las
        // fotos grandes caen al render por software. Ojo: no dan exactamente lo
        // mismo que el filtro del navegador de la descarga suelta; casi siempre
        // un nivel de diferencia, más con contraste y saturación juntos.
        applyPickChain(id, pickSteps, (pickColor && pickGain) ? { ...pickColor, tol:pickTol, feather:pickFeather, gain:pickGain } : null);
        applyPostAdjust(id, contrast, saturation);
        ctx.putImageData(id, 0, 0);
        const shaPixSalida = await huellaSHA256(pixelesRGB(id.data));
        // Codificar según formato
        const base = file.name.replace(/\.[^.]+$/, "");
        const ext = batchFmt === "tiff" ? "tif" : batchFmt;
        // MISMO nombre que el original (workflow de reemplazo de texturas):
        // guardar siempre en una carpeta DISTINTA a la de los originales
        const outName = `${base}.${ext}`;
        const reg = armarRegistro({ ...comun, fecha: new Date().toISOString(),
          entrada: { archivo: file.name, bytes: file.size, sha256: await shaEntrada, ancho: w0, alto: h0 },
          trabajo: { lado_max: batchRes, ancho: w, alto: h, sha256_pixeles: await shaPixEntrada },
          salida: { archivo: outName, formato: ext, sha256_pixeles: shaPixSalida }, lote });
        const texto = JSON.stringify(reg, null, 2);
        let blob;
        if (batchFmt === "tiff") {
          blob = encodeTIFF(cv, texto, id);
        } else if (batchFmt === "png") {
          blob = await new Promise(r => cv.toBlob(r, "image/png"));
        } else {
          blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.95));
          if (blob && exifSeg) {
            try {
              const u8 = new Uint8Array(await blob.arrayBuffer());
              if (u8[0] === 0xFF && u8[1] === 0xD8) blob = new Blob([u8.slice(0, 2), exifSeg, u8.slice(2)], { type: "image/jpeg" });
            } catch (e) {}
          }
        }
        id = null;
        if (!blob) throw new Error(tr("No se pudo codificar la imagen","Could not encode the image"));
        blob = await conRegistro(blob, ext, texto);
        await guardar(blob, outName);
        Object.assign(fila, { sha256_entrada: reg.entrada.sha256, ancho_original: w0, alto_original: h0, ancho_trabajo: w, alto_trabajo: h,
          archivo_salida: outName, sha256_pixeles_salida: shaPixSalida, sha256_salida: await huellaSHA256(new Uint8Array(await blob.arrayBuffer())), estado: "ok" });
      } catch (err) { console.error("Lote:", file.name, err); errors.push(file.name); fila.estado = "error"; }
      filas.push(fila);
      setBatchProgress(p => ({ ...p, done: fi + 1, errors: [...errors] }));
    }
    // Liberar el backing store del canvas de trabajo
    cv.width = 0; cv.height = 0;
    // El lote deja además un .csv con una fila por foto y un .json con la
    // configuración común, con nombre de fecha y hora para no pisar otro lote
    if (filas.length) {
      try {
        const t = new Date(), dd = (n) => String(n).padStart(2, "0");
        const sello = `${t.getFullYear()}-${dd(t.getMonth()+1)}-${dd(t.getDate())}_${dd(t.getHours())}${dd(t.getMinutes())}${dd(t.getSeconds())}`;
        await guardar(new Blob([csvLote(filas)], { type: "text/csv" }), `OPC_lote_${sello}.csv`);
        const regLote = armarRegistro({ ...comun, fecha: t.toISOString(),
          entrada: ent ? { archivo: fileName, bytes: ent.bytes, sha256: await ent.sha256, ancho: image.naturalWidth, alto: image.naturalHeight } : null,
          trabajo: { lado_max: batchRes }, salida: null,
          lote: { ...lote, fotos: filas.length, procesadas: filas.filter(f => f.estado === "ok").length, csv: `OPC_lote_${sello}.csv` } });
        await guardar(new Blob([JSON.stringify(regLote, null, 2)], { type: "application/json" }), `OPC_lote_${sello}.json`);
      } catch (err) { console.error("Registro del lote:", err); }
    }
    setBatchRunning(false);
  };

  const handleDrop = (e) => { e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) handleFile(f); };
  // --- Gotero cromático ---------------------------------------------------
  // Muestra el color de un punto del RESULTADO del filtro (no de la vista con
  // ajustes post): promedia un entorno de 5×5 para que el grano de la roca o un
  // píxel de ruido no definan la familia de color.
  // Se muestrea sobre la imagen ACUMULADA (filtro + ajustes ya fijados), que es
  // la que el usuario está viendo: si ya atenuó el verde, el color que toca
  // ahora es el verde atenuado, no el original.
  const handlePick = (e) => {
    const pt = clientToImageNorm(e.clientX, e.clientY);
    const pd = pickBaseRef.current || processedDataRef.current;
    if (!pt || !pd) return;
    const x = Math.max(0, Math.min(pd.width-1, Math.round(pt.x*pd.width)));
    const y = Math.max(0, Math.min(pd.height-1, Math.round(pt.y*pd.height)));
    let r=0,g=0,b=0,c=0;
    for (let dy=-2; dy<=2; dy++) for (let dx=-2; dx<=2; dx++) {
      const xx=x+dx, yy=y+dy;
      if (xx<0||yy<0||xx>=pd.width||yy>=pd.height) continue;
      const i=(yy*pd.width+xx)*4; r+=pd.data[i]; g+=pd.data[i+1]; b+=pd.data[i+2]; c++;
    }
    let muestra = { r: Math.round(r/c), g: Math.round(g/c), b: Math.round(b/c) };
    // Si había un ajuste en curso sin fijar, se fija antes de tomar el color
    // nuevo: es el flujo natural —trabajo un color, paso al siguiente—.
    if (pickColor && pickGain) {
      const enCurso = { ...pickColor, tol:pickTol, feather:pickFeather, gain:pickGain };
      setPickSteps(prev => [...prev, enCurso]);
      // La base de muestreo se recalcula con un retardo corto, así que todavía
      // no incluye este ajuste. En vez de esperarla, se le aplica al color
      // muestreado: el resultado es exactamente el mismo y no depende del
      // tiempo que pase entre fijar un ajuste y tocar el color siguiente.
      const px = new ImageData(new Uint8ClampedArray([muestra.r, muestra.g, muestra.b, 255]), 1, 1);
      chromaTarget(px, enCurso, enCurso.tol, enCurso.feather, enCurso.gain);
      muestra = { r: px.data[0], g: px.data[1], b: px.data[2] };
    }
    setPickColor(muestra);
    setPicking(false);
  };

  // Fijar el ajuste en curso como una capa más y dejar el gotero libre
  const fixPick = () => {
    if (!pickColor || !pickGain) return;
    setPickSteps(prev => [...prev, { ...pickColor, tol:pickTol, feather:pickFeather, gain:pickGain }]);
    setPickColor(null);
  };

  // Quitar un ajuste fijado. Como la vista se recalcula desde el resultado del
  // filtro, se revierte solo ese ajuste y los demás quedan como estaban.
  const removePickStep = (idx) => setPickSteps(prev => prev.filter((_, i) => i !== idx));

  const clearPick = () => { setPickColor(null); setPickSteps([]); setPicking(false); setPickSrc(null); setPickCoverage(0); };

  // La vista previa del gotero se recalcula sobre el resultado del filtro cada
  // vez que cambia la muestra o un parámetro. El retardo corto evita rehacer la
  // imagen entera en cada paso del deslizador.
  useEffect(() => {
    const pd = processedDataRef.current;
    const enCurso = (pickColor && pickGain) ? { ...pickColor, tol:pickTol, feather:pickFeather, gain:pickGain } : null;
    if (!processedSrc || !pd || (!pickSteps.length && !enCurso)) {
      pickBaseRef.current = null; setPickSrc(null); setPickCoverage(0); return;
    }
    const t = setTimeout(() => {
      try {
        const cv = document.createElement("canvas");
        cv.width = pd.width; cv.height = pd.height;
        // 1. resultado del filtro + ajustes fijados → base de muestreo
        const base = new ImageData(new Uint8ClampedArray(pd.data), pd.width, pd.height);
        applyPickChain(base, pickSteps, null);
        pickBaseRef.current = base;
        // 2. + el ajuste en curso → lo que se muestra
        const vista = enCurso
          ? new ImageData(new Uint8ClampedArray(base.data), pd.width, pd.height)
          : base;
        const { coverage } = applyPickChain(vista, null, enCurso);
        cv.getContext("2d").putImageData(vista, 0, 0);
        setPickSrc(cv.toDataURL("image/png")); setPickCoverage(coverage);
      } catch (err) { console.error(err); }
    }, 120);
    return () => clearTimeout(t);
  }, [processedSrc, pickSteps, pickColor, pickTol, pickFeather, pickGain]);

  const handleReset = () => { cancelarProceso();setImage(null);setImageSrc(null);setProcessedSrc(null);setActivePreset(null);setExifData(null);setExifRaw(null);setFileName("");setStackMode(false);setContrast(0);setSaturation(0);setPickColor(null);setPickSteps([]);setPicking(false);setPickSrc(null);processedDataRef.current=null;pickBaseRef.current=null;setSelTool("none");setSelData(null);drawRef.current={active:false,tool:"",start:null,pts:[]};pipelineRef.current=[];setShowBatch(false);setBatchFiles([]);setView({z:1,tx:0,ty:0});setPanTool(false);entradaRef.current=null;huellasEntradaRef.current={};omitirAutoRef.current=null;setRegistroInfo(null);setEscalaCal(null);setCalibrando(null);setMmDraft("");setAvisoGuardado(null);if(fileInputRef.current)fileInputRef.current.value=""; };

  // --- Herramientas de selección ---
  const clearSelection = () => { cancelarProceso(); setSelData(null); setSelTool("none"); setProcessedSrc(null); drawRef.current={active:false,tool:"",start:null,pts:[]}; pipelineRef.current=[]; };

  // Un unico reparto del pointerdown del visor: la mano tiene prioridad
  // mientras esta activa; si no, gotero, seleccion y deslizador como antes.
  const handleViewerDown = (e) => {
    if (panTool || e.button === 1) return startPan(e);
    if (calibrando) return handleCalDown(e);
    if (picking) return handlePick(e);
    if (selTool !== "none") return handleSelDown(e);
    if (processedSrc) return handlePointerDown(e);
  };

  // Escala métrica (v3.8.0). Primer toque: un extremo; segundo: el otro; un
  // tercero vuelve a empezar. Con los dos puntos el panel pide los milímetros.
  const handleCalDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const pt = clientToImageNorm(e.clientX, e.clientY);
    if (!pt) return;
    setCalibrando(c => (!c || !c.p1 || c.p2) ? { p1: pt } : { p1: c.p1, p2: pt });
  };
  const empezarCalibracion = () => {
    setPicking(false); setSelTool("none"); setPanTool(false);
    drawRef.current = { active:false, tool:"", start:null, pts:[] };
    setMmDraft(escalaCal ? String(escalaCal.mm) : "");
    setCalibrando({});
  };
  // Con los dos puntos, el foco va al campo de los mm con el valor anterior
  // seleccionado, así lo que se escribe lo reemplaza
  const conDosPuntos = !!(calibrando && calibrando.p2);
  useEffect(() => {
    if (conDosPuntos && mmInputRef.current) { mmInputRef.current.focus(); mmInputRef.current.select(); }
  }, [calibrando]);
  const cancelarCalibracion = useCallback(() => setCalibrando(null), []);
  const pasoCal = !calibrando ? 0 : calibrando.p2 ? 3 : calibrando.p1 ? 2 : 1;
  const tramoCal = pasoCal === 3 ? Math.hypot((calibrando.p2.x - calibrando.p1.x) * imageSize.w, (calibrando.p2.y - calibrando.p1.y) * imageSize.h) : 0;
  const calListo = !!(calibrando && calibrando.p2 && pxPorMM({ p1: calibrando.p1, p2: calibrando.p2, mm: leerMM(mmDraft) }, imageSize.w, imageSize.h));
  const confirmarCalibracion = () => {
    if (!calListo) return;
    setEscalaCal({ p1: calibrando.p1, p2: calibrando.p2, mm: leerMM(mmDraft) });
    setCalibrando(null);
  };
  // Píxeles por milímetro a la resolución de trabajo, y la escala del Relieve
  // en mm para el texto del panel
  const ppmm = escalaCal ? pxPorMM(escalaCal, imageSize.w, imageSize.h) : 0;
  const pxRelieve = Math.max(2, Math.round(Math.max(imageSize.w, imageSize.h) * reliefScale / 100));
  const mmRelieve = ppmm && reliefScale ? ` ≈ ${numCorto(pxRelieve / ppmm)} mm` : "";

  const handleSelDown = (e) => {
    if (selTool === "none") return;
    e.preventDefault(); e.stopPropagation();
    const pt = clientToImageNorm(e.clientX, e.clientY);
    if (!pt) return;
    try { if(compareRef.current) compareRef.current.setPointerCapture(e.pointerId); } catch(ex){}
    drawRef.current = { active: true, tool: selTool, start: pt, pts: [pt] };
    setSelData(null);
  };

  const handleSelMoveEvt = (e) => {
    const dr = drawRef.current;
    if (!dr.active) return;
    const pt = clientToImageNorm(e.clientX, e.clientY);
    if (!pt) return;
    if (dr.tool === "rect" || dr.tool === "circle") {
      setSelData({ type: dr.tool, x1: dr.start.x, y1: dr.start.y, x2: pt.x, y2: pt.y });
    } else if (dr.tool === "free") {
      dr.pts.push(pt);
      if (dr.pts.length % 3 === 0) {
        setSelData({ type: "free", points: [...dr.pts] });
      }
    }
  };

  const handleSelUpEvt = (e) => {
    const dr = drawRef.current;
    if (!dr.active) return;
    try { if(compareRef.current) compareRef.current.releasePointerCapture(e.pointerId); } catch(ex){}
    dr.active = false;
    if (dr.tool === "free" && dr.pts.length > 2) {
      setSelData({ type: "free", points: [...dr.pts] });
    }
    setSelTool("none");
  };

  // Convertir coords imagen-norm a coords contenedor-% para el SVG overlay
  const imgToSvg = useCallback((nx, ny) => {
    const bounds = getImageBounds();
    if (!bounds) return { x: nx * 100, y: ny * 100 };
    const { ix, iy, iw, ih, cw, ch } = bounds;
    return { x: (ix + nx * iw) / cw * 100, y: (iy + ny * ih) / ch * 100 };
  }, [getImageBounds]);
  const imgToSvgW = useCallback((nw, nh) => {
    const bounds = getImageBounds();
    if (!bounds) return { w: nw * 100, h: nh * 100 };
    return { w: nw * bounds.iw / bounds.cw * 100, h: nh * bounds.ih / bounds.ch * 100 };
  }, [getImageBounds]);

  const mono = "'JetBrains Mono', monospace";
  const zoomBtn = { minWidth:30,height:28,padding:0,display:"flex",alignItems:"center",justifyContent:"center",background:T.bBg,border:`1px solid ${T.cBd}`,borderRadius:6,color:T.tm,fontSize:14,lineHeight:1,cursor:"pointer",transition:"all 0.2s" };

  return (
    <div style={{ fontFamily:"'Crimson Pro','Georgia',serif", background:T.bg, color:T.text, minHeight:"100vh", position:"relative", overflow:"hidden", transition:"background 0.3s,color 0.3s" }}>
      {!solar && <div style={{ position:"fixed",inset:0,opacity:0.04,pointerEvents:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />}

      {/* HEADER */}
      <header style={{ padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,borderBottom:`1px solid ${T.hBd}`,position:"relative",zIndex:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div>
            <h1 style={{ margin:0,fontSize:18,fontWeight:700,color:T.text,display:"flex",alignItems:"baseline",gap:6 }}>
              <span style={{ color:T.gn,fontFamily:mono,fontSize:11,fontWeight:500,background:T.gnBg,padding:"1px 6px",borderRadius:4,border:`1px solid ${T.gnBd}` }}>OPC</span>
              Opuntia<span style={{ color:T.ac,fontWeight:700 }}>Color</span>
              <span style={{ fontSize:9,color:T.tm,fontFamily:mono }}>v3.8.0</span>
            </h1>
          </div>
        </div>
        <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
          <button onClick={()=>pickLang(lang==="es"?"en":"es")} title={lang==="es"?"Switch the interface to English":"Cambiar la interfaz al español"} style={{ background:T.bBg,border:`1px solid ${T.cBd}`,color:T.tm,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontFamily:mono,fontWeight:600 }}>
            {"🌐"} {lang==="es" ? "English" : "Español"}
          </button>
          <button onClick={()=>setSolar(!solar)} title={tr("Modo solar: alto contraste para trabajar al sol en el campo","Solar mode: high contrast for fieldwork in direct sunlight")} style={{ background:solar?"#000":"#FFD600",border:`1px solid ${solar?"#333":"#FFA000"}`,color:solar?"#FFD600":"#000",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontFamily:mono,fontWeight:600 }}>
            {solar ? "\u263E Normal" : "\u2600 Solar"}
          </button>
          <button onClick={()=>setShowInfo(!showInfo)} style={{ background:showInfo?T.acBg:T.bBg,border:`1px solid ${showInfo?T.acBd:T.cBd}`,color:showInfo?T.ac:T.tm,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontFamily:mono }}>
            {showInfo ? "\u2715 " + tr("Cerrar","Close") : "\u24D8 Info"}
          </button>
        </div>
      </header>

      {/* INFO PANEL */}
      {showInfo && (
        <div style={{ margin:"0 20px",padding:20,background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:10,fontSize:13,lineHeight:1.7,position:"relative",zIndex:10 }}>
          <h3 style={{ margin:"0 0 10px",color:T.ac,fontSize:15 }}>OPC v3.8.0 &mdash; {tr("Novedades","What\u2019s new")}</h3>
          {lang === "es" ? (<>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Registro de sesi&oacute;n (v3.8.0)</strong> &mdash; Cada imagen que se descarga lleva <strong style={{color:T.text}}>adentro un registro</strong> con todo lo necesario para rehacerla: versi&oacute;n de OPC, foto de entrada con su huella SHA-256, resoluci&oacute;n de trabajo, cadena de filtros con sus par&aacute;metros, zona seleccionada, gotero con el color muestreado, ajustes y, si se calibr&oacute;, la escala m&eacute;trica. Con <code>+JSON</code>, el mismo registro baja aparte como <code>.json</code>; el lote deja adem&aacute;s un <code>.csv</code> con una fila por foto. Con <strong style={{color:T.text}}>Reproducir un registro</strong>, cargando la foto original y el registro (o la propia imagen exportada), OPC rehace la imagen y comprueba que salga <strong style={{color:T.text}}>igual p&iacute;xel a p&iacute;xel</strong>; si la versi&oacute;n es otra y entre medio cambi&oacute; alg&uacute;n filtro usado, avisa. Con <strong style={{color:T.text}}>Calibrar con la regla</strong> se marcan dos puntos sobre la escala de la foto, con una lupa, y se elige o se escribe cu&aacute;nto mide el tramo: el registro guarda cu&aacute;ntos p&iacute;xeles mide un mil&iacute;metro, el Relieve muestra su escala tambi&eacute;n en mm y el visor dibuja una barra de escala. Con <code>+PDF</code> baja adem&aacute;s un <strong style={{color:T.text}}>informe en PDF</strong> para leer, imprimir o adjuntar a una publicaci&oacute;n: las dos im&aacute;genes, el procedimiento, la escala y las huellas. Con <code>+JSON</code> o <code>+PDF</code>, todo baja junto en un <code>.zip</code> con el nombre de la imagen, que trae adentro <strong style={{color:T.text}}>una carpeta</strong> con la imagen y los dem&aacute;s archivos. Apagados los dos, baja solo la imagen. En el Relieve con escala, <strong style={{color:T.text}}>M&aacute;s opciones</strong> agrega el Relieve doble (objeto y textura), la compresi&oacute;n suave, el realce con CLAHE y la mezcla con DS-LAB o LDS; apagadas, el Relieve da lo mismo que antes. <strong style={{color:T.text}}>Ning&uacute;n resultado cambia.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Fotos grandes: se elige la resoluci&oacute;n al abrirlas (v3.7.3)</strong> &mdash; Una foto de m&aacute;s de 16 MP abre con un cartel que propone trabajarla a <strong style={{color:T.text}}>16 MP</strong>: conserva tres cuartos de cada lado y cada filtro tarda alrededor de la mitad. Tambi&eacute;n se puede elegir 12 MP o la completa. En el panel, la resoluci&oacute;n de trabajo pasa a ser un men&uacute; con m&aacute;s escalones (completa, 16, 12 y 8 MP, 2000 px). A resoluci&oacute;n completa y en 2000 px <strong style={{color:T.text}}>nada cambia</strong>: dan el mismo tama&ntilde;o que antes.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>La p&aacute;gina ya no se congela mientras procesa (v3.7.2)</strong> &mdash; Los filtros corren en un <strong style={{color:T.text}}>hilo aparte</strong> (Web Worker). Con una foto de 29 MP el Rojo sigue tardando unos 8 segundos, pero mientras tanto la p&aacute;gina responde, y si cambi&aacute;s de filtro o de intensidad, el c&aacute;lculo anterior se cancela y arranca el nuevo. Antes la p&aacute;gina quedaba congelada todo ese tiempo y no tomaba los clics. <strong style={{color:T.text}}>Ning&uacute;n resultado cambia.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Mover la intensidad ya no cuelga la p&aacute;gina (v3.7.1)</strong> &mdash; La intensidad se aplica al <strong style={{color:T.text}}>soltar el deslizador</strong>: antes se reprocesaba la foto en cada pausa del arrastre y, con una de 20 MP o m&aacute;s, la p&aacute;gina quedaba congelada medio minuto o se ca&iacute;a. Adem&aacute;s, la conversi&oacute;n a LAB tarda un tercio menos y Bicromo y el Mapa de pigmentos usan menos de un tercio de la memoria. <strong style={{color:T.text}}>Ning&uacute;n resultado cambia</strong>: la salida es id&eacute;ntica a la de v3.7.0, byte a byte.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Rojo adaptativo (v3.7.0)</strong> &mdash; Hasta v3.6.0 el filtro Rojo aplicaba una transformaci&oacute;n fija: multiplicaba el rojo de cada p&iacute;xel sin mirar la foto. En una roca rojiza &mdash;una arenisca con manchas de hierro, por ejemplo&mdash; enrojec&iacute;a la roca y el pigmento por igual, y los trazos no se separaban. Ahora <strong style={{color:T.text}}>calcula el color de la roca a partir de la propia foto</strong> (o de la zona seleccionada), lo lleva a gris y amplifica lo que se aparta de &eacute;l, con prioridad para lo que es m&aacute;s rojo que la roca. La textura y el relieve no se tocan. <strong style={{color:T.text}}>Cambia el resultado del filtro Rojo</strong> &mdash; para comparar con material anterior hay que reprocesarlo.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Relieve con escala (v3.7.0)</strong> &mdash; Con el filtro Relieve activo aparece un control de <strong style={{color:T.text}}>escala</strong>. En <strong style={{color:T.text}}>Bordes</strong> es el mapa de siempre, id&eacute;ntico a v3.6.0, &uacute;til para calcar pinturas. Las dem&aacute;s opciones, pensadas para <strong style={{color:T.text}}>grabados</strong>, borran lo m&aacute;s chico que la escala elegida &mdash;en % del lado mayor, hasta 1 %&mdash; y restan el fondo: se van el grano de la roca y la iluminaci&oacute;n despareja, y lo picoteado se lee como zona m&aacute;s clara u oscura que su entorno. La escala queda en el nombre del archivo (<code>_e0.25</code>). Trabaja sobre el brillo, no sobre la altura: con luz rasante eso es relieve; con luz difusa, p&aacute;tina y picado.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Mapa de pigmentos: hip&oacute;tesis, no identificaci&oacute;n (v3.7.0)</strong> &mdash; El mapa clasifica por color, no por composici&oacute;n. El ocre y las manchas de &oacute;xido de hierro de la roca caen en la misma zona de color y una foto RGB no puede separarlos. Ahora lo dice la descripci&oacute;n del filtro, y con el mapa activo aparece c&oacute;mo controlarlo. <strong style={{color:T.text}}>No cambia ning&uacute;n resultado.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Se trabaja a resoluci&oacute;n completa (v3.6.0)</strong> &mdash; Hasta v3.5.0 cada foto se abr&iacute;a reducida a 2000 px y la resoluci&oacute;n completa hab&iacute;a que pedirla a mano: era f&aacute;cil analizar y exportar en baja resoluci&oacute;n sin darse cuenta. Ahora se abre con <strong style={{color:T.text}}>la resoluci&oacute;n real de la foto</strong> (hasta 8192 px), y el control de resoluci&oacute;n subi&oacute; <strong style={{color:T.text}}>arriba de todo en el panel, antes de la lista de filtros</strong>: muestra las dos opciones juntas &mdash;completa o 2000 px&mdash; y debajo el tama&ntilde;o en p&iacute;xeles que se va a procesar. Mientras se trabaja reducido, el recuadro y esa cifra quedan en rojo. <strong style={{color:T.text}}>Cambia el resultado por defecto</strong> &mdash; Micro-relieve, Relieve y CLAHE dependen de la escala, as&iacute; que lo procesado con v3.5.0 en el modo por defecto no es comparable sin reprocesar.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Interfaz biling&uuml;e (v3.6.0)</strong> &mdash; Toda la interfaz est&aacute; en <strong style={{color:T.text}}>espa&ntilde;ol e ingl&eacute;s</strong>: filtros, controles, ayudas y este panel. El bot&oacute;n de la esquina superior cambia de idioma en cualquier momento y la elecci&oacute;n queda guardada; en la primera visita se toma el idioma del navegador. <strong style={{color:T.text}}>No cambia ning&uacute;n resultado</strong>: el nombre del archivo exportado se arma con el identificador interno del filtro, as&iacute; que sale id&eacute;ntico en los dos idiomas.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>LDS deja de virar a violeta (v3.5.0)</strong> &mdash; La normalizaci&oacute;n tomaba el m&iacute;nimo y el m&aacute;ximo absolutos de cada canal por separado. Con una tarjeta de color, una mano o un brillo en el encuadre, esos p&iacute;xeles fijaban el rango y aplastaban toda la roca; y estirar cada canal por su lado romp&iacute;a la relaci&oacute;n de tonos. Ahora el rango sale de las <strong style={{color:T.text}}>vallas de Tukey</strong> y la ganancia es <strong style={{color:T.text}}>com&uacute;n a los tres canales</strong>: la roca conserva su color real. <strong style={{color:T.text}}>Cambia el resultado de LDS</strong> &mdash; para comparar con material anterior hay que reprocesarlo.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Gotero crom&aacute;tico (v3.5.0)</strong> &mdash; Despu&eacute;s de aplicar un filtro, se toca un color del resultado y se lo <strong style={{color:T.text}}>realza o se lo aten&uacute;a</strong> sin tocar el resto de la escena. Sirve para bajar el verde o el violeta que tapan el panel y para subir el color en el que se lee el motivo. Cada ajuste se <strong style={{color:T.text}}>fija</strong> y el gotero queda libre para el color siguiente, que se muestrea ya sobre el resultado acumulado; los ajustes se listan numerados y <strong style={{color:T.text}}>cualquiera se puede quitar de a uno</strong>, porque la imagen se recalcula entera desde el resultado del filtro. Act&uacute;a solo sobre la crominancia: la luminancia, y con ella el relieve y la textura, quedan intactos. <strong style={{color:T.text}}>La m&aacute;scara describe el color que produjo el filtro, no la composici&oacute;n del pigmento.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>La intensidad ya funciona en LDS (v3.4.0)</strong> &mdash; Hasta v3.3.0 el control no ten&iacute;a ning&uacute;n efecto en LDS: el factor se cancelaba con la normalizaci&oacute;n posterior. Ahora la intensidad es el <strong style={{color:T.text}}>exponente de blanqueo</strong>: por debajo de 1.5 la decorrelaci&oacute;n es parcial y la roca conserva m&aacute;s su color real &mdash; &uacute;til para <strong style={{color:T.text}}>verificar si un motivo sigue estando</strong> con menos realce&mdash;; por encima, se amplifican de m&aacute;s las componentes menores. <strong style={{color:T.text}}>El valor por defecto (1.5) da exactamente el mismo resultado que v3.3.0</strong>, as&iacute; que no hay nada que reprocesar.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Correcci&oacute;n importante (v3.3.0)</strong> &mdash; Se corrigi&oacute; un error en la eigendescomposici&oacute;n que hac&iacute;a que los eigenvalores fueran incorrectos. <strong style={{color:T.text}}>Los resultados de CRGB, DS-LAB y LDS cambian respecto de las versiones 3.0 a 3.2</strong>: las im&aacute;genes procesadas con versiones anteriores deben reprocesarse para poder compararlas.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}>12 filtros para pinturas, grabados y an&aacute;lisis t&eacute;cnico. Funciona 100% offline: procesamiento local sin conexi&oacute;n.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Procesado por lote (fotogrametr&iacute;a)</strong> &mdash; Ajust&aacute; el filtro en una foto de referencia y aplicalo autom&aacute;ticamente a todo el lote fotogram&eacute;trico. Las estad&iacute;sticas (matriz de decorrelaci&oacute;n) se congelan de la referencia: colores id&eacute;nticos en todas las fotos, textura coherente en el modelo 3D. Cada foto conserva su nombre y su EXIF/GPS.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Estad&iacute;sticas por zona</strong> &mdash; Con una selecci&oacute;n activa, la decorrelaci&oacute;n (CRGB, DS-LAB, LDS, YBK) se calcula con los datos de esa zona: mejor separaci&oacute;n de pigmentos locales, como en DStretch.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Resultados reproducibles</strong> &mdash; Componentes principales ordenados por varianza: el mismo panel da los mismos colores en fotos distintas.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>CLAHE real</strong> &mdash; Ecualizaci&oacute;n adaptativa de histograma con l&iacute;mite de contraste (Zuiderveld 1994).</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Mucho m&aacute;s r&aacute;pido</strong> &mdash; Micro-relieve optimizado con imagen integral. Se trabaja a resoluci&oacute;n completa por defecto.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Exportaci&oacute;n con metadatos</strong> &mdash; El nombre del archivo registra filtro e intensidad; el JPG conserva el EXIF/GPS original. TIFF v&aacute;lido seg&uacute;n spec 6.0.</p>
          <p style={{ margin:"0 0 8px",color:T.tm,fontSize:11.5 }}><strong style={{color:T.text}}>Reconocimiento</strong> &mdash; El decorrelation stretch (Gillespie et al. 1986) fue popularizado en arte rupestre por <strong style={{color:T.text}}>DStretch</strong> (J. Harman). OPC es una implementaci&oacute;n independiente de c&oacute;digo abierto, escrita desde cero a partir de la bibliograf&iacute;a publicada, sin c&oacute;digo derivado. Los nombres CRGB, LDS e YBK siguen la nomenclatura de espacios de color difundida por DStretch para facilitar la comparaci&oacute;n entre herramientas.</p>
          </>) : (<>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Session record (v3.8.0)</strong> &mdash; Every downloaded image carries <strong style={{color:T.text}}>a record inside</strong> with everything needed to rebuild it: OPC version, input photo with its SHA-256 fingerprint, working resolution, filter chain with its parameters, selected area, eyedropper with the sampled color, adjustments and, if calibrated, the metric scale. With <code>+JSON</code>, the same record is also saved as a separate <code>.json</code>; a batch also leaves a <code>.csv</code> with one row per photo. With <strong style={{color:T.text}}>Replay a record</strong>, loading the original photo and the record (or the exported image itself), OPC rebuilds the image and checks that it comes out <strong style={{color:T.text}}>identical pixel for pixel</strong>; if the version differs and a filter it uses changed in between, it warns. With <strong style={{color:T.text}}>Calibrate with the ruler</strong> you mark two points on the photo&rsquo;s scale, with a loupe, and pick or type the length of the span: the record keeps how many pixels a millimetre measures, the Relief shows its scale in mm too, and the viewer draws a scale bar. With <code>+PDF</code> a <strong style={{color:T.text}}>PDF report</strong> to read, print or attach to a publication is downloaded too: both images, the procedure, the scale and the fingerprints. With <code>+JSON</code> or <code>+PDF</code>, everything is downloaded together in a <code>.zip</code> named after the image, with <strong style={{color:T.text}}>a folder</strong> inside holding the image and the other files. With both off, only the image is downloaded. In the Relief with a scale, <strong style={{color:T.text}}>More options</strong> adds the double Relief (object and texture), soft compression, CLAHE enhancement and blending with DS-LAB or LDS; with them off, the Relief gives the same as before. <strong style={{color:T.text}}>No result changes.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Large photos: pick the resolution when opening them (v3.7.3)</strong> &mdash; A photo over 16 MP opens with a notice that suggests working at <strong style={{color:T.text}}>16 MP</strong>: it keeps three quarters of each side and each filter takes about half the time. 12 MP or full resolution can also be chosen. In the panel, the working resolution becomes a menu with more steps (full, 16, 12 and 8 MP, 2000 px). At full resolution and at 2000 px <strong style={{color:T.text}}>nothing changes</strong>: they give the same size as before.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>The page no longer freezes while processing (v3.7.2)</strong> &mdash; Filters run in a <strong style={{color:T.text}}>separate thread</strong> (Web Worker). With a 29 MP photo the Red filter still takes about 8 seconds, but the page keeps responding meanwhile, and if you switch filter or intensity, the previous computation is cancelled and the new one starts. Before, the page stayed frozen the whole time and ignored clicks. <strong style={{color:T.text}}>No result changes.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Moving the intensity no longer hangs the page (v3.7.1)</strong> &mdash; Intensity is applied when you <strong style={{color:T.text}}>release the slider</strong>: before, the photo was reprocessed at every pause while dragging and, with a 20 MP photo or larger, the page froze for half a minute or crashed. LAB conversion also takes a third less time, and Bichrome and the Pigment map use less than a third of the memory. <strong style={{color:T.text}}>No result changes</strong>: the output is identical to v3.7.0, byte for byte.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Adaptive Red (v3.7.0)</strong> &mdash; Up to v3.6.0 the Red filter applied a fixed transformation: it multiplied the redness of every pixel without looking at the photo. On a reddish rock &mdash; a sandstone with iron staining, for instance &mdash; it reddened rock and pigment alike, and the strokes did not separate. It now <strong style={{color:T.text}}>works out the rock&rsquo;s color from the photo itself</strong> (or from the selected area), takes it to gray and amplifies whatever departs from it, giving priority to what is redder than the rock. Texture and relief are left untouched. <strong style={{color:T.text}}>The Red filter&rsquo;s results change</strong> &mdash; to compare with earlier material you have to reprocess it.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Relief with a scale (v3.7.0)</strong> &mdash; With the Relief filter active, a <strong style={{color:T.text}}>scale</strong> control appears. On <strong style={{color:T.text}}>Edges</strong> it is the usual map, identical to v3.6.0, useful for tracing paintings. The other options, meant for <strong style={{color:T.text}}>engravings</strong>, erase whatever is smaller than the chosen scale &mdash; as a % of the long side, up to 1 % &mdash; and subtract the background: the rock&rsquo;s grain and uneven lighting drop out, and pecked areas read as lighter or darker than their surroundings. The scale goes into the file name (<code>_e0.25</code>). It works on brightness, not on height: under raking light that is relief; under diffuse light, patina and pecking.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Pigment map: a hypothesis, not an identification (v3.7.0)</strong> &mdash; The map classifies by color, not by composition. Ochre and the rock&rsquo;s iron-oxide staining fall in the same color region and an RGB photo cannot separate them. The filter description now says so, and with the map active the panel shows how to check it. <strong style={{color:T.text}}>No result changes.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Full resolution by default (v3.6.0)</strong> &mdash; Up to v3.5.0 every photo opened scaled down to 2000 px and full resolution had to be requested by hand: it was easy to analyze and export at low resolution without noticing. It now opens at <strong style={{color:T.text}}>the real resolution of the photo</strong> (up to 8192 px), and the resolution control moved <strong style={{color:T.text}}>to the very top of the panel, above the filter list</strong>: it shows both options side by side &mdash; full or 2000 px &mdash; with the pixel size that will actually be processed below them. While you work at reduced size, the box and that figure stay red. <strong style={{color:T.text}}>The default result changes</strong> &mdash; Micro-relief, Relief and CLAHE depend on scale, so anything processed with v3.5.0 in the default mode is not comparable without reprocessing.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Bilingual interface (v3.6.0)</strong> &mdash; The whole interface is available in <strong style={{color:T.text}}>Spanish and English</strong>: filters, controls, tooltips and this panel. The button in the top corner switches language at any time and the choice is remembered; on a first visit the browser language is used. <strong style={{color:T.text}}>No result changes</strong>: the exported file name is built from the filter’s internal identifier, so it comes out identical in both languages.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>LDS no longer drifts to violet (v3.5.0)</strong> &mdash; Normalization took the absolute minimum and maximum of each channel separately. With a color card, a hand or a specular highlight in the frame, those pixels set the range and flattened the whole rock surface; and stretching each channel on its own broke the relationship between tones. The range now comes from <strong style={{color:T.text}}>Tukey fences</strong> and the gain is <strong style={{color:T.text}}>common to all three channels</strong>: the rock keeps its real color. <strong style={{color:T.text}}>LDS results change</strong> &mdash; to compare with earlier material you have to reprocess it.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Chromatic eyedropper (v3.5.0)</strong> &mdash; After applying a filter, you tap a color in the result and <strong style={{color:T.text}}>boost it or reduce it</strong> without touching the rest of the scene. It brings down the green or the violet that cover the panel, and brings up the color in which the motif reads. Each adjustment is <strong style={{color:T.text}}>fixed</strong> and the eyedropper is freed for the next color, which is sampled on the accumulated result; the adjustments are listed and numbered, and <strong style={{color:T.text}}>any one of them can be removed on its own</strong>, because the image is recomputed in full from the filter output. It acts on chrominance only: luminance, and with it relief and texture, are left intact. <strong style={{color:T.text}}>The mask describes the color the filter produced, not the composition of the pigment.</strong></p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Intensity now works in LDS (v3.4.0)</strong> &mdash; Up to v3.3.0 the control had no effect at all in LDS: the factor was cancelled out by the normalization that followed. Intensity is now the <strong style={{color:T.text}}>whitening exponent</strong>: below 1.5 the decorrelation is partial and the rock keeps more of its real color &mdash; useful to <strong style={{color:T.text}}>check whether a motif is still there</strong> with less enhancement &mdash;; above it, the minor components are amplified too much. <strong style={{color:T.text}}>The default value (1.5) gives exactly the same result as v3.3.0</strong>, so there is nothing to reprocess.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.ac}}>Important fix (v3.3.0)</strong> &mdash; A bug in the eigendecomposition that made the eigenvalues incorrect was fixed. <strong style={{color:T.text}}>CRGB, DS-LAB and LDS results change with respect to versions 3.0 to 3.2</strong>: images processed with earlier versions must be reprocessed before they can be compared.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}>12 filters for paintings, engravings and technical analysis. Works 100% offline: local processing, no connection needed.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Batch processing (photogrammetry)</strong> &mdash; Tune the filter on a reference photo and apply it automatically to the whole photogrammetric set. The statistics (the decorrelation matrix) are frozen from the reference: identical colors across every photo, coherent texture in the 3D model. Each photo keeps its name and its EXIF/GPS.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Per-area statistics</strong> &mdash; With a selection active, the decorrelation (CRGB, DS-LAB, LDS, YBK) is computed from the data inside that area: better separation of local pigments, as in DStretch.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Reproducible results</strong> &mdash; Principal components ordered by variance: the same panel gives the same colors across different photos.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Real CLAHE</strong> &mdash; Contrast Limited Adaptive Histogram Equalization (Zuiderveld 1994).</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Much faster</strong> &mdash; Micro-relief optimized with an integral image. Full resolution is the default working size.</p>
          <p style={{ margin:"0 0 8px",color:T.tm }}><strong style={{color:T.text}}>Export with metadata</strong> &mdash; The file name records filter and intensity; the JPG keeps the original EXIF/GPS. TIFF valid per spec 6.0.</p>
          <p style={{ margin:"0 0 8px",color:T.tm,fontSize:11.5 }}><strong style={{color:T.text}}>Acknowledgement</strong> &mdash; Decorrelation stretch (Gillespie et al. 1986) was popularized in rock art by <strong style={{color:T.text}}>DStretch</strong> (J. Harman). OPC is an independent open-source implementation, written from scratch from the published literature, with no derived code. The names CRGB, LDS and YBK follow the color-space nomenclature spread by DStretch, to make comparison between tools easier.</p>
          </>)}
          <p style={{ margin:0,color:T.tm,fontSize:11.5 }}><strong style={{color:T.text}}>Dr. Emilio A. Villafa&ntilde;ez</strong> &middot; <strong style={{color:T.text}}>LATDAA</strong> &middot; <strong style={{color:T.text}}>Fund. F&eacute;lix de Azara</strong> &middot; <strong style={{color:T.text}}>Universidad Nacional de Catamarca (UNCA), Argentina</strong></p>
        </div>
      )}

      {/* MAIN */}
      <main style={{ padding:"16px 20px",position:"relative",zIndex:5 }}>
        {/* Upload */}
        {!image && (
          <div onDrop={handleDrop} onDragOver={e=>e.preventDefault()} onClick={()=>fileInputRef.current?.click()} style={{ maxWidth:680,margin:"50px auto",borderRadius:14,padding:"50px 36px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",cursor:"pointer",background:solar?"#e8e5e2":"#373334",border:solar?"2px dashed #999":"none",transition:"all 0.3s" }}>
            <img src={OPC_LOGO} alt="OPC Logo" style={{ width:140,height:140,marginBottom:16,opacity:0.95 }} />
            <p style={{ fontSize:19,fontWeight:600,margin:"0 0 6px",color:solar?"#000":"#e8e0d4" }}>{tr("Arrastr\u00E1 tu foto aqu\u00ED","Drop your photo here")}</p>
            <p style={{ fontSize:13,color:solar?"#555":"#8a7e6e",margin:0 }}>{tr("o hac\u00E9 clic para seleccionar \u00B7 JPG, PNG, WebP","or click to browse \u00B7 JPG, PNG, WebP")}</p>
            <p style={{ fontSize:10,color:solar?"#777":"#6a5e4e",margin:"14px 0 0",fontFamily:mono }}>{tr("Procesamiento 100% local, sin conexi\u00F3n \u00B7 RAW: convertir antes a JPG/PNG","100% local processing, works offline \u00B7 RAW: convert to JPG/PNG first")}</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{handleFile(e.target.files?.[0]);e.target.value="";}} />

        {/* EDITOR */}
        {image && (
          <div style={{ display:"flex",gap:18,flexWrap:"wrap" }}>
            {/* LEFT PANEL */}
            <div style={{ width:220,flexShrink:0,display:"flex",flexDirection:"column",gap:4,maxHeight:"85vh",overflowY:"auto" }}>

              {/* Actions — siempre visibles arriba */}
              <div style={{ display:"flex",flexDirection:"column",gap:4,marginBottom:4 }}>
                <div style={{ display:"flex",gap:4 }}>
                  {processedSrc && <button onClick={handleDownload} title={tr("Descarga la imagen con su registro adentro: versión, foto, resolución, filtros, zona, gotero, ajustes y escala. Con +JSON o +PDF, además, el registro aparte y un informe, todo junto en un .zip con una carpeta adentro","Downloads the image with its record inside: version, photo, resolution, filters, area, eyedropper, adjustments and scale. With +JSON or +PDF, also the record as a separate file and a report, all together in a .zip with a folder inside")} style={{ flex:1,padding:"8px 8px",background:`linear-gradient(135deg,${T.ac},${solar?"#7f1d1d":"#8e2118"})`,border:"none",borderRadius:8,color:"#fff",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'Crimson Pro',serif" }}>{"\u2B07"} {tr("Descargar","Download")}</button>}
                  <button onClick={handleReset} style={{ flex:1,padding:"8px 8px",background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:8,color:T.tm,fontSize:11,cursor:"pointer",fontFamily:"'Crimson Pro',serif" }}>{"\u21BB"} {tr("Nueva imagen","New image")}</button>
                </div>
                {processedSrc && (
                  <div style={{ display:"flex",gap:2 }}>
                    {["png","jpg","tiff"].map(fmt => (
                      <button key={fmt} onClick={()=>setExportFmt(fmt==="tiff"?"tiff":fmt)} style={{ flex:1,padding:"4px 2px",fontSize:9,fontFamily:mono,fontWeight:exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?700:400,background:exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?T.acBg:T.bBg,border:`1px solid ${exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?T.acBd:T.cBd}`,borderRadius:4,cursor:"pointer",color:exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?T.ac:T.tm,textTransform:"uppercase" }}>{fmt}</button>
                    ))}
                    <button onClick={cambiarJSON} aria-pressed={conJSON} title={tr("El registro aparte, en .json, para abrirlo con otros programas. Aunque esté apagado, el registro va adentro de la imagen y se puede reproducir igual","The record as a separate .json, to open with other programs. Even when off, the record is inside the image and can still be replayed")} style={{ flex:1,marginLeft:4,padding:"4px 2px",fontSize:9,fontFamily:mono,fontWeight:conJSON?700:400,background:conJSON?T.gnBg:T.bBg,border:`1px solid ${conJSON?T.gn:T.cBd}`,borderRadius:4,cursor:"pointer",color:conJSON?T.gn:T.td }}>{conJSON ? "+JSON" : "JSON"}</button>
                    <button onClick={cambiarInforme} aria-pressed={conInforme} title={tr("Informe en PDF para leer, imprimir o adjuntar: las dos imágenes, el procedimiento, la escala y las huellas. Baja junto con la imagen y el .json","PDF report to read, print or attach: both images, the procedure, the scale and the fingerprints. Downloaded with the image and the .json")} style={{ flex:1,padding:"4px 2px",fontSize:9,fontFamily:mono,fontWeight:conInforme?700:400,background:conInforme?T.gnBg:T.bBg,border:`1px solid ${conInforme?T.gn:T.cBd}`,borderRadius:4,cursor:"pointer",color:conInforme?T.gn:T.td }}>{conInforme ? "+PDF" : "PDF"}</button>
                  </div>
                )}
                {processedSrc && (conJSON || conInforme) && (
                  <div role="status" style={{ fontSize:8,fontFamily:mono,color:avisoGuardado?T.gn:T.td,lineHeight:1.45,padding:"1px 2px 2px" }}>
                    {avisoGuardado
                      ? `✓ ${tr(`Bajó ${avisoGuardado.zip}: adentro, una carpeta con los ${avisoGuardado.cuantos} archivos`, `Downloaded ${avisoGuardado.zip}: inside, a folder with the ${avisoGuardado.cuantos} files`)}`
                      : (() => {
                          const p = [tr("la imagen","the image"), conJSON && tr("el .json","the .json"), conInforme && tr("el informe","the report")].filter(Boolean);
                          return <>{"📦"} {tr("Baja un .zip con una carpeta adentro:","Downloads a .zip with a folder inside:")} {p.slice(0, -1).join(", ")}{tr(" y "," and ")}{p[p.length - 1]}</>;
                        })()}
                  </div>
                )}
                {processedSrc && (
                  <button onClick={()=>{setShowBatch(true);setBatchFiles([]);setBatchProgress({done:0,total:0,current:"",errors:[]});}} style={{ padding:"7px 8px",background:T.gnBg,border:`1px solid ${T.gnBd}`,borderRadius:8,color:T.gn,fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'Crimson Pro',serif" }}>{"▦"} {tr("Procesar lote (fotogrametr\u00EDa)","Batch processing (photogrammetry)")}</button>
                )}
                {/* Reproducir un registro (v3.8.0): con la foto original cargada */}
                <button onClick={()=>registroInputRef.current?.click()} disabled={processing} title={tr("Rehace una imagen a partir de su registro y comprueba que salga igual. Sirve el .json que se descarga junto a cada imagen, o la propia imagen exportada por OPC. Antes hay que cargar la foto original.","Rebuilds an image from its record and checks that it comes out the same. Use the .json downloaded with each image, or the image exported by OPC itself. Load the original photo first.")} style={{ padding:"5px 8px",background:"none",border:`1px dashed ${T.cBd}`,borderRadius:8,color:T.tm,fontSize:10.5,cursor:processing?"default":"pointer",fontFamily:"'Crimson Pro',serif",opacity:processing?0.5:1 }}>{"\u21BA"} {tr("Reproducir un registro\u2026","Replay a record\u2026")}</button>
                <input ref={registroInputRef} type="file" accept=".json,.png,.jpg,.jpeg,.tif,.tiff,application/json" style={{display:"none"}} onChange={e=>{abrirRegistro(e.target.files?.[0]);e.target.value="";}} />
                {registroInfo && (
                  <div role="status" style={{ padding:"7px 9px",background:registroInfo.ok?T.gnBg:T.acBg,border:`1px solid ${registroInfo.ok?T.gnBd:T.acBd}`,borderRadius:8,fontFamily:mono,fontSize:9.5,lineHeight:1.5,color:T.tm }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:6,marginBottom:3 }}>
                      <strong style={{ color:registroInfo.ok?T.gn:T.ac,fontSize:10.5 }}>{tr(registroInfo.titulo.es, registroInfo.titulo.en)}</strong>
                      <button onClick={()=>setRegistroInfo(null)} title={tr("Cerrar","Close")} style={{ background:"none",border:"none",color:T.tm,cursor:"pointer",fontSize:11,padding:0 }}>{"\u2715"}</button>
                    </div>
                    {registroInfo.items.map((it, i) => (
                      <div key={i} style={{ color:it.ok===false?T.ac:T.tm,marginTop:2 }}>{it.ok===false?"\u26A0":"\u2713"} {tr(it.es, it.en)}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolución de trabajo. Va arriba, antes de los filtros, porque es
                  una decisión que se toma ANTES de procesar y porque al fondo del
                  panel pasaba inadvertida: se terminaba analizando en baja sin
                  querer. Las dos opciones se muestran juntas para que se vea que
                  hay una elección y cuál está activa. */}
              {image && Math.max(image.naturalWidth,image.naturalHeight) > 2000 && (() => {
                const grande = esFotoGrande(image.naturalWidth, image.naturalHeight);
                return (
                <div style={{ marginBottom:4,padding:"8px 10px",background:T.cBg,border:`1px solid ${resId==="full"?T.cBd:T.acBd}`,borderRadius:8 }}>
                  <div style={{ fontSize:8.5,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4 }}>{tr("Resoluci\u00F3n de trabajo","Working resolution")}</div>
                  <select value={resId} onChange={e=>setWorkingRes(e.target.value)} title={tr("Menos p\u00EDxeles: cada filtro tarda menos, pero se procesa menos detalle","Fewer pixels: each filter takes less time, but less detail is processed")}
                    style={{ width:"100%",padding:"5px 6px",fontSize:9.5,fontFamily:mono,background:T.bBg,color:resId==="full"?T.text:T.ac,fontWeight:resId==="full"?400:700,border:`1px solid ${resId==="full"?T.cBd:T.acBd}`,borderRadius:5,cursor:"pointer" }}>
                    {opcionesResolucion(image.naturalWidth, image.naturalHeight).map(o => (
                      <option key={o.id} value={o.id}>{etiquetaResCorta(o.id, o)}{grande && o.id===RES_RECOMENDADA ? ` \u00B7 ${tr("recomendada","recommended")}` : ""}</option>
                    ))}
                  </select>
                  <div style={{ fontSize:8,fontFamily:mono,color:resId==="full"?T.td:T.ac,marginTop:4,lineHeight:1.4 }}>
                    {imageSize.w} &times; {imageSize.h} px {resId!=="full"
                      ? tr(`\u00B7 reducida de ${image.naturalWidth}\u00D7${image.naturalHeight}`,`\u00B7 reduced from ${image.naturalWidth}\u00D7${image.naturalHeight}`)
                      : Math.max(image.naturalWidth,image.naturalHeight) > 8192
                        ? tr(`\u00B7 tope de 8192 px (orig. ${image.naturalWidth}\u00D7${image.naturalHeight})`,`\u00B7 capped at 8192 px (orig. ${image.naturalWidth}\u00D7${image.naturalHeight})`)
                        : tr("\u00B7 la resoluci\u00F3n real de la foto","\u00B7 the photo\u2019s real resolution")}
                  </div>
                </div>
                );
              })()}

              {/* Filtros */}
              <div style={{ fontSize:8.5,fontFamily:mono,color:T.ac,letterSpacing:"1.5px",textTransform:"uppercase",margin:"4px 0 3px 4px",fontWeight:600 }}>{tr("Filtros","Filters")}</div>
              {PRESETS.map(p => (
                <button key={p.id} onClick={()=>processImage(p,intensity)} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 10px",width:"100%",background:activePreset===p.id?T.acBg:T.cBg,border:`1px solid ${activePreset===p.id?T.acBd:T.cBd}`,borderRadius:7,cursor:"pointer",transition:"all 0.2s",textAlign:"left",color:T.text,marginBottom:2 }}>
                  <span style={{fontSize:14,width:22,textAlign:"center"}}>{p.icon}</span>
                  <div><div style={{fontSize:11,fontWeight:600}}>{tr(p.name,p.nameEn)}</div><div style={{fontSize:8.5,color:T.tm,fontFamily:mono,lineHeight:1.3}}>{tr(p.desc,p.descEn)}</div></div>
                </button>
              ))}

              {/* Stacking toggle */}
              <button onClick={()=>setStackMode(!stackMode)} style={{ margin:"6px 0 2px",padding:"7px 10px",background:stackMode?"rgba(109,184,93,0.15)":T.cBg,border:`1px solid ${stackMode?"rgba(109,184,93,0.4)":T.cBd}`,borderRadius:7,cursor:"pointer",fontSize:10,fontFamily:mono,color:stackMode?T.gn:T.tm,fontWeight:stackMode?600:400,textAlign:"left" }}>
                {stackMode ? "\uD83D\uDD17 " + tr("Acumular: ON","Stacking: ON") : "\uD83D\uDD17 " + tr("Acumular: OFF","Stacking: OFF")}{stackMode && <span style={{fontSize:8,display:"block",fontWeight:400,marginTop:1}}>{tr("Aplica sobre resultado previo","Applies on top of the previous result")}</span>}
              </button>

              {/* Herramientas de selección */}
              <div style={{ marginTop:6,padding:"8px 10px",background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:8 }}>
                <div style={{ fontSize:8.5,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:5 }}>{tr("Selecci\u00F3n","Selection")}</div>
                <div style={{ display:"flex",gap:3 }}>
                  {[
                    { id:"rect", icon:"\u25A1", tip:"Rect\u00E1ngulo", tipEn:"Rectangle" },
                    { id:"circle", icon:"\u25CB", tip:"C\u00EDrculo", tipEn:"Circle" },
                    { id:"free", icon:"\u270E", tip:"Mano alzada", tipEn:"Freehand" },
                  ].map(t => (
                    <button key={t.id} onClick={()=>{cancelarProceso();setSelData(null);setProcessedSrc(null);setPanTool(false);setCalibrando(null);setSelTool(selTool===t.id?"none":t.id);drawRef.current={active:false,tool:"",start:null,pts:[]};pipelineRef.current=[];}} title={tr(t.tip,t.tipEn)} style={{ flex:1,padding:"5px 4px",fontSize:13,background:selTool===t.id?T.acBg:T.bBg,border:`1px solid ${selTool===t.id?T.acBd:T.cBd}`,borderRadius:5,cursor:"pointer",color:selTool===t.id?T.ac:T.tm,fontWeight:selTool===t.id?700:400,transition:"all 0.2s" }}>{t.icon}</button>
                  ))}
                  {selData && <button onClick={clearSelection} title={tr("Limpiar selecci\u00F3n","Clear selection")} style={{ flex:1,padding:"5px 4px",fontSize:10,background:T.bBg,border:`1px solid ${T.cBd}`,borderRadius:5,cursor:"pointer",color:T.tm,fontFamily:mono }}>{"\u2715"}</button>}
                </div>
                <div style={{ fontSize:8,fontFamily:mono,color:T.td,marginTop:4,lineHeight:1.4 }}>
                  {selTool !== "none" ? `${tr("Dibuj\u00E1 sobre la imagen","Draw on the image")} \u2192 ${selTool==="rect"?tr("rect\u00E1ngulo","rectangle"):selTool==="circle"?tr("c\u00EDrculo","circle"):tr("forma libre","freehand")}`
                    : selData ? tr("\u2713 Zona seleccionada \u2014 el filtro se aplica solo ah\u00ED","\u2713 Area selected \u2014 the filter is applied only there")
                    : tr("Sin selecci\u00F3n \u2014 filtro en toda la imagen","No selection \u2014 filter applied to the whole image")}
                </div>
              </div>

              {/* Escala métrica (v3.8.0). No toca el procesamiento: queda en el
                  registro, pasa a mm la escala del Relieve y dibuja una barra
                  de escala sobre la imagen. Se calibra una vez por foto y vale
                  a cualquier resolución de trabajo. */}
              {(() => {
                const serif = "'Crimson Pro',serif";
                const rotulo = { fontSize:8.5,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase" };
                const enlace = { background:"none",border:"none",padding:0,fontFamily:mono,fontSize:9,color:T.tm,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:2 };
                const chico = { flex:1,padding:"5px 4px",fontSize:9.5,fontFamily:mono,background:T.bBg,border:`1px solid ${T.cBd}`,borderRadius:5,color:T.tm,cursor:"pointer" };
                const pasos = [tr("Inicio","Start"), tr("Final","End"), tr("Medida","Length")];
                const mmEscrito = leerMM(mmDraft);
                return (
                <div style={{ marginTop:6,padding:"9px 10px 10px",background:T.cBg,border:`1px solid ${calibrando?T.acBd:T.cBd}`,borderRadius:8 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                    <span style={rotulo}>{tr("Escala métrica","Metric scale")}</span>
                    {calibrando ? <button onClick={cancelarCalibracion} style={enlace}>{tr("Cancelar","Cancel")}</button>
                      : escalaCal ? <span style={{ fontSize:8.5,fontFamily:mono,color:T.gn }}>{"✓"} {tr("calibrada","calibrated")}</span> : null}
                  </div>

                  {/* Sin escala */}
                  {!calibrando && !escalaCal && (<>
                    <button onClick={empezarCalibracion} style={{ width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",background:T.bBg,border:`1px solid ${T.cBd}`,borderRadius:7,cursor:"pointer",color:T.text,fontFamily:serif,fontSize:12.5,textAlign:"left" }}>
                      <IconoRegla color={solar ? "#8a6a00" : ORO_ESCALA} />
                      <span>{tr("Calibrar con la regla","Calibrate with the ruler")}</span>
                    </button>
                    <div style={{ fontFamily:serif,fontSize:11,color:T.tm,marginTop:6,lineHeight:1.35 }}>
                      {tr("Si la foto tiene una escala, marcá un tramo y escribí cuánto mide. Queda en el registro.","If the photo shows a scale, mark a span and type its length. It is saved in the record.")}
                    </div>
                  </>)}

                  {/* Calibrando: tres pasos */}
                  {calibrando && (<>
                    <div style={{ display:"flex",alignItems:"center" }}>
                      {pasos.map((et, i) => {
                        const n = i + 1, hecho = pasoCal > n, activo = pasoCal === n;
                        return (
                          <React.Fragment key={n}>
                            {i > 0 && <div style={{ flex:1,minWidth:6,height:1,margin:"0 5px",background:pasoCal >= n ? T.acBd : T.cBd }} />}
                            <span style={{ display:"flex",alignItems:"center",gap:4 }}>
                              <span style={{ width:16,height:16,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8.5,fontFamily:mono,fontWeight:700,background:activo?T.ac:hecho?T.acBg:"transparent",color:activo?"#fff":hecho?T.ac:T.td,border:`1px solid ${activo||hecho?T.acBd:T.cBd}` }}>{hecho ? "✓" : n}</span>
                              <span style={{ fontSize:8.5,fontFamily:mono,color:activo?T.text:T.td }}>{et}</span>
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    {pasoCal < 3 ? (<>
                      <div style={{ fontFamily:serif,fontSize:12.5,color:T.text,lineHeight:1.35,marginTop:9 }}>
                        {pasoCal === 1 ? tr("Tocá el comienzo del tramo, por ejemplo el 0 de la regla.","Tap the start of the span, for example the ruler’s 0.")
                          : tr("Ahora tocá el final. Cuanto más largo el tramo, más precisa la escala.","Now tap the end. The longer the span, the more precise the scale.")}
                      </div>
                      <div style={{ fontFamily:mono,fontSize:8.5,color:T.td,marginTop:6,lineHeight:1.5 }}>
                        {tr("La lupa sigue al puntero · rueda: zoom · Esc: cancelar","The loupe follows the pointer · wheel: zoom · Esc: cancel")}
                      </div>
                    </>) : (<>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:9 }}>
                        <span style={{ fontFamily:serif,fontSize:12.5,color:T.text }}>{tr("¿Cuánto mide el tramo?","How long is the span?")}</span>
                        <span style={{ fontFamily:mono,fontSize:8.5,color:T.td }}>{Math.round(tramoCal)} px</span>
                      </div>
                      <div style={{ display:"flex",gap:3,marginTop:7 }}>
                        {[[10,"1 cm"],[50,"5 cm"],[100,"10 cm"],[500,"50 cm"],[1000,"1 m"]].map(([v, et]) => (
                          <button key={v} type="button" onClick={()=>{setMmDraft(String(v));if(mmInputRef.current)mmInputRef.current.focus();}} style={{ flex:1,padding:"4px 0",fontSize:9,fontFamily:mono,background:mmEscrito===v?T.acBg:T.bBg,border:`1px solid ${mmEscrito===v?T.acBd:T.cBd}`,borderRadius:5,color:mmEscrito===v?T.ac:T.tm,cursor:"pointer",whiteSpace:"nowrap" }}>{et}</button>
                        ))}
                      </div>
                      <form onSubmit={e=>{e.preventDefault();confirmarCalibracion();}} style={{ display:"flex",gap:4,marginTop:5 }}>
                        <label style={{ flex:1,minWidth:0,display:"flex",alignItems:"center",gap:4,padding:"0 8px",background:T.bBg,border:`1px solid ${T.acBd}`,borderRadius:6,cursor:"text" }}>
                          <input ref={mmInputRef} inputMode="decimal" value={mmDraft} onChange={e=>setMmDraft(e.target.value)} placeholder={tr("otra","other")} aria-label={tr("Milímetros entre los dos puntos","Millimetres between the two points")}
                            style={{ width:0,flex:1,padding:"6px 0",fontSize:12,fontFamily:mono,background:"transparent",color:T.text,border:"none",outline:"none" }} />
                          <span style={{ fontSize:9.5,fontFamily:mono,color:T.tm }}>mm</span>
                        </label>
                        <button type="submit" disabled={!calListo} style={{ padding:"0 12px",fontSize:12,fontFamily:serif,fontWeight:600,background:calListo?T.ac:T.bBg,border:`1px solid ${calListo?T.ac:T.cBd}`,borderRadius:6,color:calListo?"#fff":T.td,cursor:calListo?"pointer":"default" }}>{tr("Listo","Done")}</button>
                      </form>
                      <div style={{ fontFamily:mono,fontSize:8.5,color:T.tm,marginTop:5,minHeight:12 }}>
                        {calListo ? `= ${numCorto(tramoCal / mmEscrito)} px/mm` : tr("Tocá la imagen para volver a marcar","Tap the image to mark again")}
                      </div>
                    </>)}
                  </>)}

                  {/* Calibrada */}
                  {!calibrando && escalaCal && (<>
                    <div style={{ display:"flex",alignItems:"baseline",gap:6 }}>
                      <span style={{ fontFamily:serif,fontSize:26,fontWeight:600,color:T.text,lineHeight:1 }}>{numCorto(ppmm)}</span>
                      <span style={{ fontFamily:mono,fontSize:9.5,color:T.tm }}>{tr("px por mm","px per mm")}</span>
                    </div>
                    <div style={{ fontFamily:mono,fontSize:9,color:T.tm,marginTop:5 }}>1 px = {numCorto(1 / ppmm)} mm</div>
                    <div style={{ fontFamily:mono,fontSize:8.5,color:T.td,marginTop:2 }}>{tr(`tramo de ${escalaCal.mm} mm · a ${imageSize.w}×${imageSize.h}`,`${escalaCal.mm} mm span · at ${imageSize.w}×${imageSize.h}`)}</div>
                    <button role="switch" aria-checked={barraVisible} onClick={()=>setBarraVisible(!barraVisible)} style={{ display:"flex",alignItems:"center",gap:7,width:"100%",marginTop:9,padding:"8px 0 0",background:"none",border:"none",borderTop:`1px solid ${T.cBd}`,cursor:"pointer",fontFamily:mono,fontSize:9,color:T.tm,textAlign:"left" }}>
                      <span style={{ position:"relative",width:24,height:13,borderRadius:7,flexShrink:0,boxSizing:"border-box",background:barraVisible?T.ac:T.bBg,border:`1px solid ${barraVisible?T.ac:T.cBd}`,transition:"background .15s" }}>
                        <span style={{ position:"absolute",top:1,left:barraVisible?12:1,width:9,height:9,borderRadius:"50%",background:barraVisible?"#fff":T.tm,transition:"left .15s" }} />
                      </span>
                      {tr("Barra de escala en la imagen","Scale bar on the image")}
                    </button>
                    <div style={{ display:"flex",gap:4,marginTop:8 }}>
                      <button onClick={empezarCalibracion} style={chico}>{tr("Recalibrar","Recalibrate")}</button>
                      <button onClick={()=>setEscalaCal(null)} style={chico}>{tr("Quitar","Remove")}</button>
                    </div>
                  </>)}
                </div>
                );
              })()}

              {/* Intensity */}
              <div style={{ marginTop:6,padding:"10px 12px",background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:8 }}>
                <div style={{ fontSize:9,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4 }}>{tr("Intensidad","Intensity")}: {(intDraft ?? intensity).toFixed(1)}</div>
                <input ref={intRangeRef} type="range" min="0.2" max="5.0" step="0.1" value={intDraft ?? intensity} onChange={e=>setIntDraft(parseFloat(e.target.value))} style={{ width:"100%",accentColor:T.ac }} />
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:7.5,color:T.td,fontFamily:mono,marginBottom:6 }}><span>0.2</span><span>5.0</span></div>
                {/* Preset buttons */}
                <div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>
                  {INTENSITY_PRESETS.map(ip => (
                    <button key={ip.label} onClick={()=>{setIntDraft(null);setIntensity(ip.value);}} style={{ flex:1,minWidth:36,padding:"4px 2px",fontSize:8.5,fontFamily:mono,fontWeight:Math.abs(intensity-ip.value)<0.2?700:400,background:Math.abs(intensity-ip.value)<0.2?T.acBg:T.cBg,border:`1px solid ${Math.abs(intensity-ip.value)<0.2?T.acBd:T.cBd}`,borderRadius:5,cursor:"pointer",color:Math.abs(intensity-ip.value)<0.2?T.ac:T.tm }}>{tr(ip.label,ip.labelEn)}</button>
                  ))}
                </div>
                {/* Escala del Relieve: solo aparece con ese filtro activo */}
                {activePreset === "relief" && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:9,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4 }}>{tr("Escala","Scale")}: {reliefScale ? `${reliefScale}%` : tr("bordes","edges")}</div>
                    <div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>
                      {RELIEF_ESCALAS.map(e => (
                        <button key={e} onClick={()=>setReliefScale(e)} style={{ flex:1,minWidth:30,padding:"4px 2px",fontSize:8.5,fontFamily:mono,fontWeight:reliefScale===e?700:400,background:reliefScale===e?T.acBg:T.cBg,border:`1px solid ${reliefScale===e?T.acBd:T.cBd}`,borderRadius:5,cursor:"pointer",color:reliefScale===e?T.ac:T.tm }}>{e ? e : tr("Bordes","Edges")}</button>
                      ))}
                    </div>
                    <div style={{ fontSize:8,fontFamily:mono,color:T.td,marginTop:4,lineHeight:1.4 }}>
                      {reliefScale
                        ? tr(`Borra lo que mide menos de ~${Math.max(2, Math.round(Math.max(imageSize.w, imageSize.h) * reliefScale / 100))} px${mmRelieve} (${reliefScale}% del lado mayor) y resta el fondo: se van el grano y la iluminación despareja. Si el motivo se empasta, bajá la escala.`,
                             `Erases what measures less than ~${Math.max(2, Math.round(Math.max(imageSize.w, imageSize.h) * reliefScale / 100))} px${mmRelieve} (${reliefScale}% of the long side) and subtracts the background: grain and uneven lighting drop out. If the motif blurs, lower the scale.`)
                        : tr("Mapa de bordes de v3.6: todo detalle por igual, para calcar. Para grabados, probá una escala.","v3.6 edge map: every detail alike, for tracing. For engravings, try a scale.")}
                    </div>
                    {/* Más opciones del Relieve con escala (v3.8.0), en un desplegable.
                        Apagadas, el Relieve da byte a byte lo mismo que en v3.7. */}
                    {reliefScale > 0 && (() => {
                      const activas = [relDoble, relSuave, relClahe, !!relMezcla].filter(Boolean).length;
                      const fila = { display:"flex",alignItems:"center",gap:6,width:"100%",padding:"5px 0",background:"none",border:"none",cursor:"pointer",fontFamily:mono,fontSize:9,color:T.tm,textAlign:"left" };
                      const llave = (on) => (
                        <span style={{ position:"relative",width:22,height:12,borderRadius:6,flexShrink:0,boxSizing:"border-box",background:on?T.ac:T.bBg,border:`1px solid ${on?T.ac:T.cBd}`,transition:"background .15s" }}>
                          <span style={{ position:"absolute",top:1,left:on?11:1,width:8,height:8,borderRadius:"50%",background:on?"#fff":T.tm,transition:"left .15s" }} />
                        </span>
                      );
                      const chips = (vals, actual, fijar, etiqueta) => (
                        <div style={{ display:"flex",gap:3,margin:"1px 0 5px 28px" }}>
                          {vals.map(v => (
                            <button key={String(v)} onClick={()=>fijar(v)} style={{ flex:1,padding:"3px 2px",fontSize:8.5,fontFamily:mono,fontWeight:actual===v?700:400,background:actual===v?T.acBg:T.cBg,border:`1px solid ${actual===v?T.acBd:T.cBd}`,borderRadius:5,cursor:"pointer",color:actual===v?T.ac:T.tm }}>{etiqueta(v)}</button>
                          ))}
                        </div>
                      );
                      const nota = (txt, color) => <div style={{ margin:"0 0 5px 28px",fontSize:8,fontFamily:mono,color:color||T.td,lineHeight:1.4 }}>{txt}</div>;
                      const mmObjeto = ppmm ? `, ~${numCorto(pxRelieve * RELIEF_OBJETO / ppmm)} mm` : "";
                      return (
                        <div style={{ marginTop:8,borderTop:`1px solid ${T.cBd}`,paddingTop:4 }}>
                          <button onClick={()=>setRelMas(!relMas)} aria-expanded={relMas} style={{ ...fila,fontSize:8.5,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase" }}>
                            <span style={{ display:"inline-block",width:10,transform:relMas?"rotate(90deg)":"none",transition:"transform .15s" }}>{"▸"}</span>
                            {tr("Más opciones","More options")}
                            {activas > 0 && <span style={{ color:T.ac,letterSpacing:0,textTransform:"none" }}>{`· ${activas} ${tr(activas === 1 ? "activa" : "activas", "on")}`}</span>}
                          </button>
                          {relMas && (<>
                            <button role="switch" aria-checked={relDoble} onClick={()=>setRelDoble(!relDoble)} style={fila}>{llave(relDoble)}{tr("Doble: objeto y textura","Double: object and texture")}</button>
                            {relDoble && (<>
                              {nota(tr(`Suma esta escala (la textura) y otra ${RELIEF_OBJETO} veces mayor (el objeto${mmObjeto}). Peso del objeto:`, `Adds this scale (texture) and one ${RELIEF_OBJETO} times larger (object${mmObjeto}). Object weight:`))}
                              {chips([25, 50, 75], relObjeto, setRelObjeto, v => `${v} %`)}
                            </>)}
                            <button role="switch" aria-checked={relSuave} onClick={()=>setRelSuave(!relSuave)} style={fila}>{llave(relSuave)}{tr("Compresión suave","Soft compression")}</button>
                            {relSuave && nota(tr("Los extremos no se queman: se comprimen y conservan detalle.","Extremes are not burnt out: they are compressed and keep detail."))}
                            <button role="switch" aria-checked={relClahe} onClick={()=>setRelClahe(!relClahe)} style={fila}>{llave(relClahe)}{tr("Realzar con CLAHE","Enhance with CLAHE")}</button>
                            {relClahe && nota(`⚠ ${tr("Realza, pero ya no es una medida: CLAHE estira el contraste distinto en cada zona.","Enhances, but it is no longer a measurement: CLAHE stretches contrast differently in each area.")}`, T.ac)}
                            <div style={{ ...fila,cursor:"default",paddingBottom:3 }}><span style={{ width:22,flexShrink:0,textAlign:"center",fontSize:10 }}>{"◑"}</span>{tr("Mezclar con color","Blend with color")}</div>
                            {chips([null, "dslab", "lds"], relMezcla, setRelMezcla, v => v === null ? tr("no","no") : v === "lds" ? "LDS" : "DS-LAB")}
                            {relMezcla && (<>
                              {nota(tr("El relieve, como luz y sombra sobre los colores del filtro. Cuánto relieve:","The relief, as light and shade over the filter’s colors. How much relief:"))}
                              {chips([25, 50, 75], relAlfa, setRelAlfa, v => `${v} %`)}
                            </>)}
                          </>)}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* Mapa de pigmentos: el límite de lo que muestra, a la vista */}
                {activePreset === "map" && (
                  <div style={{ fontSize:8,fontFamily:mono,color:T.td,marginTop:8,lineHeight:1.5 }}>
                    {tr("Clasifica por color, no por composición: el ocre y las manchas de óxido de hierro de la roca caen en la misma zona, y una foto RGB no puede separarlos. Usalo como hipótesis y miralo contra un control: si una zona de roca sin pintura también sale roja, ese rojo no distingue pigmento de soporte.",
                        "It classifies by color, not by composition: ochre and the rock’s iron-oxide staining fall in the same region, and an RGB photo cannot separate them. Use it as a hypothesis and check it against a control: if an unpainted area of rock also comes out red, that red does not tell pigment from substrate.")}
                  </div>
                )}
              </div>

              {/* Contraste y Saturación — post-procesamiento */}
              <div style={{ marginTop:4,padding:"10px 12px",background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                  <span style={{ fontSize:9,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase" }}>{tr("Ajustes post","Post adjustments")}</span>
                  {(contrast !== 0 || saturation !== 0) && <button onClick={()=>{setContrast(0);setSaturation(0);}} style={{ fontSize:8,fontFamily:mono,background:"none",border:`1px solid ${T.cBd}`,borderRadius:4,padding:"1px 6px",color:T.tm,cursor:"pointer" }}>Reset</button>}
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:8.5,fontFamily:mono,color:T.tm,marginBottom:2 }}><span>{tr("Contraste","Contrast")}</span><span style={{color:contrast!==0?T.ac:T.td}}>{contrast > 0 ? "+" : ""}{contrast}</span></div>
                  <input type="range" min="-80" max="80" step="5" value={contrast} onChange={e=>setContrast(parseInt(e.target.value))} style={{ width:"100%",accentColor:T.ac }} />
                </div>
                <div>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:8.5,fontFamily:mono,color:T.tm,marginBottom:2 }}><span>{tr("Saturaci\u00F3n","Saturation")}</span><span style={{color:saturation!==0?T.ac:T.td}}>{saturation > 0 ? "+" : ""}{saturation}</span></div>
                  <input type="range" min="-100" max="100" step="5" value={saturation} onChange={e=>setSaturation(parseInt(e.target.value))} style={{ width:"100%",accentColor:T.ac }} />
                </div>
              </div>

              {/* Gotero crom\u00E1tico \u2014 ajustes de color acumulables y reversibles */}
              {processedSrc && (
              <div style={{ marginTop:4,padding:"10px 12px",background:T.cBg,border:`1px solid ${(pickSteps.length||(pickColor&&pickGain))?T.acBd:T.cBd}`,borderRadius:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                  <span style={{ fontSize:9,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase" }}>{tr("Gotero crom\u00E1tico","Chromatic eyedropper")}</span>
                  {(pickColor || pickSteps.length > 0) && <button onClick={clearPick} title={tr("Descarta todos los ajustes del gotero","Discards every eyedropper adjustment")} style={{ fontSize:8,fontFamily:mono,background:"none",border:`1px solid ${T.cBd}`,borderRadius:4,padding:"1px 6px",color:T.tm,cursor:"pointer" }}>{tr("Limpiar","Clear")}</button>}
                </div>

                {/* Ajustes ya fijados: se pueden quitar de a uno */}
                {pickSteps.length > 0 && (
                  <div style={{ marginBottom:8,display:"flex",flexDirection:"column",gap:3 }}>
                    {pickSteps.map((a,i) => (
                      <div key={i} style={{ display:"flex",alignItems:"center",gap:6,padding:"3px 5px",background:T.bBg,border:`1px solid ${T.cBd}`,borderRadius:5 }}>
                        <span style={{ fontSize:8,fontFamily:mono,color:T.td,width:12 }}>{i+1}</span>
                        <div style={{ width:16,height:16,flexShrink:0,borderRadius:3,border:`1px solid ${T.hBd}`,background:`rgb(${a.r},${a.g},${a.b})` }} />
                        <span style={{ flex:1,fontSize:8.5,fontFamily:mono,color:T.tm }}>{a.gain > 0 ? tr("realza +","boost +") : tr("aten\u00FAa ","reduce ")}{a.gain} &middot; tol {a.tol}</span>
                        <button onClick={()=>removePickStep(i)} title={tr("Quitar este ajuste","Remove this adjustment")} style={{ fontSize:10,lineHeight:1,background:"none",border:"none",color:T.td,cursor:"pointer",padding:"0 2px" }}>{"\u2715"}</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:pickColor?8:0 }}>
                  <button onClick={()=>{setPicking(!picking);setPanTool(false);setCalibrando(null);}} title={tr("Toc\u00E1 sobre la imagen el color que quer\u00E9s trabajar","Tap on the image the color you want to work on")}
                    style={{ flex:1,padding:"6px 8px",fontSize:10,fontFamily:mono,background:picking?T.acBg:T.bBg,border:`1px solid ${picking?T.acBd:T.cBd}`,borderRadius:5,color:picking?T.ac:T.tm,cursor:"pointer",fontWeight:picking?700:400 }}>
                    {picking ? tr("Toc\u00E1 la imagen\u2026","Tap the image\u2026") : "\uD83D\uDD0D " + (pickSteps.length || pickColor ? tr("Otro color","Another color") : tr("Muestrear color","Sample a color"))}
                  </button>
                  {pickColor && <div title={`rgb(${pickColor.r}, ${pickColor.g}, ${pickColor.b})`} style={{ width:28,height:28,flexShrink:0,borderRadius:5,border:`1px solid ${T.hBd}`,background:`rgb(${pickColor.r},${pickColor.g},${pickColor.b})` }} />}
                </div>

                {pickColor && (<>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:8.5,fontFamily:mono,color:T.tm,marginBottom:2 }}><span>{pickGain < 0 ? tr("Atenuar","Reduce") : tr("Realzar","Boost")}</span><span style={{color:pickGain!==0?T.ac:T.td}}>{pickGain > 0 ? "+" : ""}{pickGain}</span></div>
                    <input type="range" min="-100" max="100" step="5" value={pickGain} onChange={e=>setPickGain(parseInt(e.target.value))} style={{ width:"100%",accentColor:T.ac }} />
                  </div>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:8.5,fontFamily:mono,color:T.tm,marginBottom:2 }}><span>{tr("Tolerancia","Tolerance")}</span><span style={{color:T.td}}>{pickTol}</span></div>
                    <input type="range" min="5" max="60" step="1" value={pickTol} onChange={e=>setPickTol(parseInt(e.target.value))} style={{ width:"100%",accentColor:T.ac }} />
                  </div>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:8.5,fontFamily:mono,color:T.tm,marginBottom:2 }}><span>{tr("Suavizado","Feather")}</span><span style={{color:T.td}}>{pickFeather}%</span></div>
                    <input type="range" min="0" max="150" step="5" value={pickFeather} onChange={e=>setPickFeather(parseInt(e.target.value))} style={{ width:"100%",accentColor:T.ac }} />
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={fixPick} disabled={!pickGain} title={tr("Deja este ajuste aplicado y libera el gotero para el color siguiente","Keeps this adjustment and frees the eyedropper for the next color")}
                      style={{ flex:1,padding:"6px 8px",fontSize:10,fontFamily:mono,background:pickGain?T.acBg:T.bBg,border:`1px solid ${pickGain?T.acBd:T.cBd}`,borderRadius:5,color:pickGain?T.ac:T.td,cursor:pickGain?"pointer":"default",fontWeight:600 }}>
                      {"\u2713"} {tr("Fijar ajuste","Fix adjustment")}
                    </button>
                    <button onClick={()=>setPickColor(null)} title={tr("Descarta el ajuste en curso","Discards the adjustment in progress")} style={{ padding:"6px 8px",fontSize:9,fontFamily:mono,background:T.bBg,border:`1px solid ${T.cBd}`,borderRadius:5,color:T.tm,cursor:"pointer" }}>{tr("Descartar","Discard")}</button>
                  </div>
                  <p style={{ margin:"7px 0 0",fontSize:8.5,fontFamily:mono,color:T.td,lineHeight:1.5 }}>
                    {tr("Alcanza el","Covers")} <span style={{color:T.tm}}>{(pickCoverage*100).toFixed(1)}%</span> {tr("de la imagen \u00B7 act\u00FAa sobre el color, no sobre el pigmento","of the image \u00B7 it acts on the color, not on the pigment")}
                  </p>
                </>)}

                {!pickColor && pickSteps.length > 0 && (
                  <p style={{ margin:"7px 0 0",fontSize:8.5,fontFamily:mono,color:T.td,lineHeight:1.5 }}>
                    {tr(`${pickSteps.length} ajuste${pickSteps.length>1?"s":""} aplicado${pickSteps.length>1?"s":""} \u00B7 se pueden quitar de a uno sin perder los dem\u00E1s`,`${pickSteps.length} adjustment${pickSteps.length>1?"s":""} applied \u00B7 they can be removed one at a time without losing the others`)}
                  </p>
                )}
              </div>)}

              {/* File info */}
              <div style={{ marginTop:6,padding:"8px 12px",background:solar?"#f5f5f5":"rgba(232,224,212,0.02)",borderRadius:6,fontSize:9,fontFamily:mono,color:T.td,lineHeight:1.6 }}>
                <div style={{ wordBreak:"break-all",marginBottom:1,fontWeight:600,color:T.tm }}>{fileName}</div>
                <div>{imageSize.w} &times; {imageSize.h} px{image && (image.naturalWidth!==imageSize.w||image.naturalHeight!==imageSize.h) ? ` (orig. ${image.naturalWidth}×${image.naturalHeight})` : ""}</div>
              </div>

              {/* EXIF/GPS */}
              {exifData ? (
                <div style={{ padding:"8px 12px",background:solar?"#E8F5E9":"rgba(109,184,93,0.06)",border:`1px solid ${solar?"#A5D6A7":"rgba(109,184,93,0.15)"}`,borderRadius:6,fontSize:9,fontFamily:mono,color:T.tm,lineHeight:1.7 }}>
                  <div style={{ fontWeight:600,color:T.gn,marginBottom:3,fontSize:10 }}>{"\uD83D\uDCCD"} {tr("Datos EXIF / GPS","EXIF / GPS data")}</div>
                  {exifData.dateTime && <div>{"\uD83D\uDCC5"} {exifData.dateTime}</div>}
                  {exifData.gps ? (<>
                    <div>Lat: {formatGPSCoord(exifData.gps.latitude, true)}</div>
                    <div>Lon: {formatGPSCoord(exifData.gps.longitude, false)}</div>
                    <div style={{fontSize:8,color:T.td,marginTop:1}}>({exifData.gps.latitude.toFixed(6)}, {exifData.gps.longitude.toFixed(6)})</div>
                    {exifData.gps.altitude!=null && <div>Alt: {exifData.gps.altitude.toFixed(1)} m</div>}
                  </>) : (!exifData.dateTime && <div style={{fontStyle:"italic"}}>{tr("Sin GPS/fecha","No GPS/date")}</div>)}
                </div>
              ) : image && (
                <div style={{ padding:"6px 12px",borderRadius:6,fontSize:9,fontFamily:mono,color:T.td,fontStyle:"italic",background:solar?"#f5f5f5":"rgba(232,224,212,0.02)" }}>{"\uD83D\uDCCD"} {tr("Sin datos EXIF","No EXIF data")}</div>
              )}
            </div>

            {/* RIGHT: Image viewer */}
            <div style={{ flex:1,minWidth:0 }}>
              <div ref={compareRef} style={{ position:"relative",width:"100%",aspectRatio:`${imageSize.w}/${imageSize.h}`,maxHeight:"75vh",borderRadius:10,overflow:"hidden",border:`1px solid ${selTool!=="none"?T.acBd:T.cBd}`,cursor:panTool?(panning?"grabbing":"grab"):(picking||calibrando||selTool!=="none")?"crosshair":processedSrc?"col-resize":"default",userSelect:"none",background:T.iBg,transition:"border 0.2s",touchAction:"none" }}
                onMouseDown={e=>{ if(e.button===1) e.preventDefault(); }}
                onPointerDown={handleViewerDown}
                onPointerMove={e=>{movePan(e);handleSelMoveEvt(e);}}
                onPointerUp={e=>{endPan();handleSelUpEvt(e);}}
                onPointerCancel={endPan}>
                {/* Capa ampliable. El deslizador, las etiquetas y los controles quedan afuera, en coordenadas de pantalla. */}
                <div style={{ position:"absolute",inset:0,transformOrigin:"0 0",transform:viewTransform,willChange:"transform" }}>
                  <img src={imageSrc} alt="Original" draggable={false} style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"contain",pointerEvents:"none",imageRendering:zoomPx }} />
                  {processedSrc && <img src={pickSrc || processedSrc} alt={tr("Procesada","Processed")} draggable={false} style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"contain",clipPath:`inset(0 ${100-clipPct}% 0 0)`,filter:postFilter,pointerEvents:"none",imageRendering:zoomPx }} />}
                </div>
                {processedSrc && selTool==="none" && (<>
                  <div style={{ position:"absolute",top:0,bottom:0,left:`${sliderPos}%`,width:2,background:"rgba(255,255,255,0.7)",transform:"translateX(-1px)",pointerEvents:"none" }} />
                  <div style={{ position:"absolute",top:"50%",left:`${sliderPos}%`,transform:"translate(-50%,-50%)",width:32,height:32,borderRadius:"50%",background:solar?"rgba(255,255,255,0.9)":"rgba(30,28,24,0.85)",border:"2px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",color:solar?"#000":"#fff",fontSize:13,pointerEvents:"none" }}>{"\u27FA"}</div>
                </>)}
                {/* SVG overlay para selección */}
                {selData && (() => {
                  const s1 = imgToSvg(Math.min(selData.x1||0,selData.x2||0), Math.min(selData.y1||0,selData.y2||0));
                  const s2 = imgToSvg(Math.max(selData.x1||0,selData.x2||0), Math.max(selData.y1||0,selData.y2||0));
                  const sw = s2.x - s1.x, sh = s2.y - s1.y;
                  const scx = (s1.x+s2.x)/2, scy = (s1.y+s2.y)/2, srx = sw/2, sry = sh/2;
                  const fpts = selData.points ? selData.points.map(p => imgToSvg(p.x, p.y)) : [];
                  return (
                  <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:5,transformOrigin:"0 0",transform:viewTransform }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <mask id="sm">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        {selData.type==="rect" && <rect x={s1.x} y={s1.y} width={sw} height={sh} fill="black" />}
                        {selData.type==="circle" && <ellipse cx={scx} cy={scy} rx={srx} ry={sry} fill="black" />}
                        {selData.type==="free" && fpts.length>2 && <polygon points={fpts.map(p=>`${p.x},${p.y}`).join(" ")} fill="black" />}
                      </mask>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#sm)" />
                    {selData.type==="rect" && <rect x={s1.x} y={s1.y} width={sw} height={sh} fill="none" stroke="rgba(192,57,43,0.8)" strokeWidth={0.3/view.z} strokeDasharray={1/view.z} />}
                    {selData.type==="circle" && <ellipse cx={scx} cy={scy} rx={srx} ry={sry} fill="none" stroke="rgba(192,57,43,0.8)" strokeWidth={0.3/view.z} strokeDasharray={1/view.z} />}
                    {selData.type==="free" && fpts.length>2 && <polygon points={fpts.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(192,57,43,0.8)" strokeWidth={0.3/view.z} strokeDasharray={1/view.z} />}
                  </svg>
                  );
                })()}
                {/* Escala métrica: puntos, línea de medida y lupa mientras se calibra; después, la barra de escala */}
                {calibrando && <CapaCalibracion contRef={compareRef} getBounds={getImageBounds} view={view} imageSize={imageSize} natW={image ? image.naturalWidth : 0} imageSrc={imageSrc} cal={calibrando} mm={leerMM(mmDraft)} onCancelar={cancelarCalibracion} />}
                {!calibrando && escalaCal && barraVisible && <BarraEscala contRef={compareRef} getBounds={getImageBounds} view={view} ppmm={ppmm} anchoTrabajo={imageSize.w} solar={solar} />}
                {processedSrc && (<>
                  <div style={{ position:"absolute",bottom:10,left:10,padding:"3px 8px",borderRadius:5,background:solar?"rgba(183,28,28,0.85)":"rgba(192,57,43,0.65)",fontSize:10,fontFamily:mono,color:"#fff" }}>{presetLabel(activePreset)?.toUpperCase()||tr("PROCESADA","PROCESSED")}{stackMode && " \u26A1"}{selData && " \u2702"}</div>
                  <div style={{ position:"absolute",bottom:10,right:10,padding:"3px 8px",borderRadius:5,background:"rgba(0,0,0,0.65)",fontSize:10,fontFamily:mono,color:"#aaa" }}>ORIGINAL</div>
                </>)}
                {/* Encuadre: mano, alejar, lupa (ajustar a la ventana), acercar */}
                <div onPointerDown={e=>e.stopPropagation()} style={{ position:"absolute",top:10,right:10,zIndex:6,display:"flex",gap:3,padding:3,borderRadius:9,background:solar?"rgba(255,255,255,0.92)":"rgba(26,23,20,0.85)",border:`1px solid ${T.cBd}` }}>
                  <button onClick={()=>{setPanTool(!panTool);setPicking(false);}} title={tr("Mover \u2014 arrastr\u00E1 la imagen para correr el encuadre","Pan \u2014 drag the image to move the frame")} style={{ ...zoomBtn,background:panTool?T.acBg:T.bBg,border:`1px solid ${panTool?T.acBd:T.cBd}`,color:panTool?T.ac:T.tm,fontWeight:panTool?700:400 }}>{"\u270B"}</button>
                  <button onClick={()=>zoomAt(1/1.5,0.5,0.5)} disabled={view.z<=1} title={tr("Alejar","Zoom out")} style={{ ...zoomBtn,opacity:view.z<=1?0.35:1,cursor:view.z<=1?"default":"pointer" }}>{"\u2212"}</button>
                  <button onClick={resetView} title={tr("Ajustar a la ventana","Fit to window")} style={{ ...zoomBtn,padding:"0 8px",fontSize:9.5,fontFamily:mono,gap:4,color:view.z>1?T.ac:T.tm }}>{"\uD83D\uDD0D"} {Math.round(view.z*100)}%</button>
                  <button onClick={()=>zoomAt(1.5,0.5,0.5)} disabled={view.z>=ZOOM_MAX} title={tr("Acercar","Zoom in")} style={{ ...zoomBtn,opacity:view.z>=ZOOM_MAX?0.35:1,cursor:view.z>=ZOOM_MAX?"default":"pointer",fontSize:15 }}>{"+"}</button>
                </div>
                {picking && <div style={{ position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",padding:"4px 12px",borderRadius:6,background:"rgba(192,57,43,0.85)",fontSize:10,fontFamily:mono,color:"#fff",pointerEvents:"none" }}>{"\uD83D\uDD0D"} {tr("Toc\u00E1 el color que quer\u00E9s realzar o atenuar","Tap the color you want to boost or reduce")}</div>}
                {calibrando && <div style={{ position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",zIndex:7,display:"flex",alignItems:"center",gap:8,padding:"5px 12px 5px 6px",borderRadius:20,background:solar?"rgba(255,255,255,0.95)":"rgba(26,23,20,0.9)",border:`1px solid ${T.acBd}`,boxShadow:"0 4px 16px rgba(0,0,0,0.35)",pointerEvents:"none",whiteSpace:"nowrap" }}><span style={{ width:18,height:18,borderRadius:"50%",background:T.ac,color:"#fff",fontSize:9,fontFamily:mono,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center" }}>{pasoCal}</span><span style={{ fontFamily:"'Crimson Pro',serif",fontSize:13,color:T.text }}>{pasoCal===1?tr("Tocá el comienzo del tramo","Tap the start of the span"):pasoCal===2?tr("Tocá el final del tramo","Tap the end of the span"):tr("Escribí la medida en el panel","Type the length in the panel")}</span><span style={{ fontFamily:mono,fontSize:8.5,color:T.td,border:`1px solid ${T.cBd}`,borderRadius:4,padding:"1px 4px" }}>Esc</span></div>}
                {selTool!=="none" && <div style={{ position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",padding:"4px 12px",borderRadius:6,background:"rgba(192,57,43,0.85)",fontSize:10,fontFamily:mono,color:"#fff",pointerEvents:"none" }}>{tr("Dibuj\u00E1 la zona","Draw the area")} &middot; {selTool==="rect"?tr("\u25A1 Rect\u00E1ngulo","\u25A1 Rectangle"):selTool==="circle"?tr("\u25CB C\u00EDrculo","\u25CB Circle"):tr("\u270E Mano alzada","\u270E Freehand")}</div>}
                {processing && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:T.ov }}><div style={{ padding:"14px 20px",borderRadius:10,background:solar?"rgba(255,255,255,0.95)":"rgba(26,23,20,0.9)",border:`1px solid ${T.acBd}`,color:T.ac,fontSize:13,fontFamily:mono,animation:"pulse 1.5s ease-in-out infinite" }}>{tr("Procesando p\u00EDxeles...","Processing pixels...")}</div></div>}
                {!processedSrc && !processing && selTool==="none" && !calibrando && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:solar?"rgba(255,255,255,0.3)":"rgba(26,23,20,0.3)",pointerEvents:"none" }}><div style={{ padding:"14px 20px",borderRadius:10,background:solar?"rgba(255,255,255,0.9)":"rgba(26,23,20,0.8)",border:`1px solid ${T.cBd}`,color:T.tm,fontSize:13,textAlign:"center" }}>{"\u2190"} {tr("Seleccion\u00E1 un filtro","Choose a filter")}</div></div>}
              </div>
              <p style={{ textAlign:"center",fontSize:10,color:T.td,marginTop:6,fontFamily:mono }}>{processedSrc ? tr("Arrastr\u00E1 el deslizador \u00B7 ","Drag the slider \u00B7 ") : ""}{tr("Rueda del mouse: zoom","Mouse wheel: zoom")}{"\u00A0"}&middot; {"\u270B"} {tr("mano: mover","hand: pan")}{view.z > 1 ? " \u00B7 " + Math.round(view.z*100) + "%" : ""}{stackMode && tr(" \u00B7 \u26A1 Modo acumular activo"," \u00B7 \u26A1 Stacking mode on")}{selData && tr(" \u00B7 \u2702 Selecci\u00F3n activa"," \u00B7 \u2702 Selection active")}</p>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: PROCESADO POR LOTE */}
      <input ref={batchInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{setBatchFiles(Array.from(e.target.files||[]));e.target.value="";}} />
      {showBatch && (
        <div style={{ position:"fixed",inset:0,zIndex:100,background:T.ov,backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",background:T.bg,border:`1px solid ${T.acBd}`,borderRadius:12,padding:"18px 20px",boxShadow:"0 12px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
              <h3 style={{ margin:0,fontSize:15,color:T.ac }}>{"▦"} {tr("Procesado por lote","Batch processing")}</h3>
              {!batchRunning && <button onClick={()=>setShowBatch(false)} style={{ background:"none",border:"none",color:T.tm,fontSize:16,cursor:"pointer" }}>{"✕"}</button>}
            </div>

            {/* Pipeline registrado */}
            <div style={{ padding:"8px 10px",background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:8,marginBottom:10 }}>
              <div style={{ fontSize:8.5,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4 }}>{tr("Pipeline a aplicar","Pipeline to apply")}</div>
              {pipelineRef.current.map((step,i) => {
                const p = PRESETS.find(x=>x.id===step.presetId);
                return (
                  <div key={i} style={{ fontSize:10.5,fontFamily:mono,color:T.text,lineHeight:1.7 }}>
                    {i+1}. {p?.icon} {tr(p?.name,p?.nameEn)} &middot; {tr("intensidad","intensity")} {step.intensity.toFixed(1)}
                    {step.opts && step.opts.escala > 0 && <> &middot; {tr("escala","scale")} {step.opts.escala}%</>}
                    {step.frozen && <span style={{ color:T.gn,fontSize:8.5 }}> &middot; {"❄"} {tr("matriz congelada","frozen matrix")}</span>}
                  </div>
                );
              })}
              {(contrast!==0||saturation!==0) && <div style={{ fontSize:9.5,fontFamily:mono,color:T.tm,marginTop:2 }}>+ {tr("Ajustes post","Post adjustments")}: {contrast!==0?`${tr("contraste","contrast")} ${contrast>0?"+":""}${contrast}`:""}{contrast!==0&&saturation!==0?" · ":""}{saturation!==0?`${tr("saturación","saturation")} ${saturation>0?"+":""}${saturation}`:""}</div>}
              <div style={{ fontSize:8.5,fontFamily:mono,color:T.td,marginTop:5,lineHeight:1.5 }}>{"❄"} {tr("= estad\u00EDsticas de la foto de referencia aplicadas id\u00E9nticas a todo el lote","= reference-photo statistics applied identically to the whole batch")} {"→"} {tr("colores consistentes entre fotos (textura coherente en el modelo 3D)","consistent colors across photos (coherent texture in the 3D model)")}</div>
            </div>

            {/* Selección de fotos */}
            <button disabled={batchRunning} onClick={()=>batchInputRef.current?.click()} style={{ width:"100%",padding:"9px 10px",background:T.cBg,border:`1px dashed ${T.cBd}`,borderRadius:8,color:T.text,fontSize:12,cursor:batchRunning?"default":"pointer",fontFamily:"'Crimson Pro',serif",marginBottom:8,opacity:batchRunning?0.5:1 }}>
              {batchFiles.length ? `✓ ${batchFiles.length} ${tr("fotos seleccionadas","photos selected")}` : "📂 " + tr("Elegir las fotos del lote…","Choose the photos for the batch…")}
            </button>

            {/* Formato y resolución */}
            <div style={{ display:"flex",gap:8,marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:8.5,fontFamily:mono,color:T.td,letterSpacing:"1px",textTransform:"uppercase",marginBottom:3 }}>{tr("Formato","Format")}</div>
                <div style={{ display:"flex",gap:2 }}>
                  {["jpg","png","tiff"].map(fmt => (
                    <button key={fmt} disabled={batchRunning} onClick={()=>setBatchFmt(fmt)} style={{ flex:1,padding:"4px 2px",fontSize:9,fontFamily:mono,fontWeight:batchFmt===fmt?700:400,background:batchFmt===fmt?T.acBg:T.bBg,border:`1px solid ${batchFmt===fmt?T.acBd:T.cBd}`,borderRadius:4,cursor:"pointer",color:batchFmt===fmt?T.ac:T.tm,textTransform:"uppercase" }}>{fmt}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:8.5,fontFamily:mono,color:T.td,letterSpacing:"1px",textTransform:"uppercase",marginBottom:3 }}>{tr("Resoluci\u00F3n m\u00E1x.","Max. resolution")}</div>
                <div style={{ display:"flex",gap:2 }}>
                  {[{v:8192,l:"Full"},{v:4000,l:"4000"},{v:2000,l:"2000"}].map(r => (
                    <button key={r.v} disabled={batchRunning} onClick={()=>setBatchRes(r.v)} style={{ flex:1,padding:"4px 2px",fontSize:9,fontFamily:mono,fontWeight:batchRes===r.v?700:400,background:batchRes===r.v?T.acBg:T.bBg,border:`1px solid ${batchRes===r.v?T.acBd:T.cBd}`,borderRadius:4,cursor:"pointer",color:batchRes===r.v?T.ac:T.tm }}>{r.l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ fontSize:9,fontFamily:mono,color:T.tm,lineHeight:1.6,marginBottom:10 }}>
              {batchFmt==="jpg" ? tr("✓ JPG conserva el EXIF/GPS de cada foto (recomendado para fotogrametría)","✓ JPG keeps each photo\u2019s EXIF/GPS (recommended for photogrammetry)") : tr("⚠ Solo JPG conserva EXIF; para alinear en Metashape convienen los JPG","⚠ Only JPG keeps EXIF; for alignment in Metashape, JPG is the safer choice")}
              <br/>{lang==="es" ? (<>Cada foto se guarda con su <strong style={{color:T.text}}>mismo nombre</strong>: eleg&iacute; una carpeta <strong style={{color:T.text}}>distinta</strong> a la de los originales para no sobreescribirlos.</>) : (<>Each photo is saved under its <strong style={{color:T.text}}>same name</strong>: pick a <strong style={{color:T.text}}>different</strong> folder from the originals so they are not overwritten.</>)}
              {!window.showDirectoryPicker && <><br/>{"⚠"} {tr("Este navegador no permite elegir carpeta: las fotos se descargar\u00E1n una por una.","This browser cannot pick a folder: the photos will be downloaded one by one.")}</>}
            </div>

            {/* Progreso */}
            {(batchRunning || batchProgress.total > 0) && (
              <div style={{ marginBottom:10 }}>
                <div style={{ height:8,background:T.bBg,borderRadius:4,overflow:"hidden",marginBottom:4 }}>
                  <div style={{ height:"100%",width:`${batchProgress.total?Math.round(batchProgress.done/batchProgress.total*100):0}%`,background:`linear-gradient(90deg,${T.gn},${T.ac})`,transition:"width 0.3s",borderRadius:4 }} />
                </div>
                <div style={{ fontSize:9.5,fontFamily:mono,color:T.tm }}>
                  {batchRunning ? `${tr("Procesando","Processing")} ${batchProgress.done+1}/${batchProgress.total}: ${batchProgress.current}` : batchProgress.done>0 ? `✓ ${tr("Listo","Done")}: ${batchProgress.done-batchProgress.errors.length}/${batchProgress.total} ${tr("procesadas","processed")}${batchProgress.errors.length?` · ${batchProgress.errors.length} ${tr("con error","failed")}`:""}` : ""}
                </div>
                {!batchRunning && batchProgress.errors.length > 0 && (
                  <div style={{ fontSize:8.5,fontFamily:mono,color:T.ac,marginTop:3,lineHeight:1.5 }}>{tr("Errores","Errors")}: {batchProgress.errors.join(", ")}</div>
                )}
              </div>
            )}

            {/* Acciones */}
            <div style={{ display:"flex",gap:6 }}>
              {!batchRunning ? (
                <button disabled={!batchFiles.length} onClick={runBatch} style={{ flex:1,padding:"9px 10px",background:batchFiles.length?`linear-gradient(135deg,${T.ac},${solar?"#7f1d1d":"#8e2118"})`:T.bBg,border:"none",borderRadius:8,color:batchFiles.length?"#fff":T.td,fontWeight:600,fontSize:12,cursor:batchFiles.length?"pointer":"default",fontFamily:"'Crimson Pro',serif" }}>
                  {"▶"} {tr("Procesar","Process")} {batchFiles.length || ""} {tr(`foto${batchFiles.length===1?"":"s"}`,`photo${batchFiles.length===1?"":"s"}`)}{window.showDirectoryPicker ? tr(" → elegir carpeta destino"," → choose destination folder") : ""}
                </button>
              ) : (
                <button onClick={()=>{batchCancelRef.current=true;}} style={{ flex:1,padding:"9px 10px",background:T.cBg,border:`1px solid ${T.acBd}`,borderRadius:8,color:T.ac,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Crimson Pro',serif" }}>
                  {"■"} {tr("Cancelar","Cancel")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ padding:"14px 20px",borderTop:`1px solid ${T.fBd}`,textAlign:"center",fontSize:10,color:T.fTx,fontFamily:mono,position:"relative",zIndex:5,lineHeight:1.8 }}>
        <div><span style={{color:T.gn,fontWeight:500}}>OPC</span> &ndash; OpuntiaColor v3.8.0 &middot; {tr("12 filtros \u00B7 Gotero crom\u00E1tico \u00B7 Zoom y encuadre \u00B7 Lote fotogram\u00E9trico \u00B7 Estad\u00EDsticas por zona \u00B7 Stacking \u00B7 GPS/EXIF \u00B7 100% offline","12 filters \u00B7 Chromatic eyedropper \u00B7 Zoom and pan \u00B7 Photogrammetric batch \u00B7 Per-area statistics \u00B7 Stacking \u00B7 GPS/EXIF \u00B7 100% offline")}</div>
        <div><span style={{color:T.tm}}>Dr. Emilio A. Villafa&ntilde;ez</span> &middot; <span style={{color:T.tm}}>LATDAA</span> &middot; <span style={{color:T.tm}}>Fund. F&eacute;lix de Azara</span> &middot; <span style={{color:T.tm}}>Universidad Nacional de Catamarca (UNCA), Argentina</span></div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input[type="range"]{-webkit-appearance:none;height:3px;border-radius:2px;background:${T.sT};outline:none}
        input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${T.ac};cursor:pointer;border:2px solid ${T.tB};box-shadow:0 1px 4px rgba(0,0,0,0.3)}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.sT};border-radius:2px}
      `}</style>
      {/* Cartel de foto grande (v3.7.3): se elige la resolución antes de procesar */}
      {preguntaRes && image && (() => {
        const completa = tamanoTrabajo(image.naturalWidth, image.naturalHeight, "full");
        const opciones = [
          { id: RES_RECOMENDADA, rec: true, nota: tr("Conserva casi todo el detalle y cada filtro tarda alrededor de la mitad.", "Keeps nearly all the detail and each filter takes about half the time.") },
          { id: "12mp", nota: tr("M\u00E1s r\u00E1pida, con algo menos de detalle.", "Faster, with somewhat less detail.") },
          { id: "full", nota: tr("Todo el detalle. Cada filtro tarda casi el doble, y en algunas computadoras el navegador se traba.", "All the detail. Each filter takes nearly twice as long, and on some computers the browser hangs.") },
        ];
        return (
          <div style={{ position:"fixed",inset:0,zIndex:60,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
            <div role="dialog" aria-modal="true" aria-label={tr("Foto grande","Large photo")} style={{ width:"100%",maxWidth:430,background:T.bg,border:`1px solid ${T.acBd}`,borderRadius:12,padding:"18px 18px 14px",color:T.text,fontFamily:mono,boxShadow:"0 12px 40px rgba(0,0,0,0.45)" }}>
              <div style={{ fontSize:14,fontWeight:700,color:T.ac,marginBottom:6 }}>{tr("Foto grande","Large photo")}</div>
              <div style={{ fontSize:11,color:T.tm,lineHeight:1.55,marginBottom:12 }}>
                {tr(`Esta foto tiene ${Math.round(completa.w * completa.h / 1e6)} MP (${completa.w} \u00D7 ${completa.h} px). A ese tama\u00F1o cada filtro tarda varios segundos. \u00BFCon qu\u00E9 resoluci\u00F3n quer\u00E9s trabajar?`,
                    `This photo has ${Math.round(completa.w * completa.h / 1e6)} MP (${completa.w} \u00D7 ${completa.h} px). At that size each filter takes several seconds. Which resolution do you want to work at?`)}
              </div>
              {opciones.map(o => {
                const t = tamanoTrabajo(image.naturalWidth, image.naturalHeight, o.id);
                return (
                  <button key={o.id} autoFocus={o.rec} onClick={()=>setWorkingRes(o.id)} style={{ display:"block",width:"100%",textAlign:"left",padding:"9px 11px",marginBottom:6,background:o.rec?T.acBg:T.cBg,border:`1px solid ${o.rec?T.acBd:T.cBd}`,borderRadius:8,cursor:"pointer",color:T.text,fontFamily:mono }}>
                    <div style={{ fontSize:11.5,fontWeight:700 }}>{etiquetaRes(o.id, t)}{o.rec && <span style={{ color:T.ac }}>{" \u00B7 " + tr("recomendada","recommended")}</span>}</div>
                    <div style={{ fontSize:9.5,color:T.tm,marginTop:2,lineHeight:1.4 }}>{o.nota}</div>
                  </button>
                );
              })}
              <div style={{ fontSize:9,color:T.td,lineHeight:1.5,marginTop:6 }}>
                {tr("Se puede cambiar despu\u00E9s en \u00ABResoluci\u00F3n de trabajo\u00BB. La resoluci\u00F3n cambia el resultado del filtro: si vas a publicar la imagen, anotala junto con el filtro y la intensidad.",
                    "It can be changed later under \u201CWorking resolution\u201D. The resolution changes the filter\u2019s result: if you are going to publish the image, record it together with the filter and the intensity.")}
              </div>
            </div>
          </div>
        );
      })()}
      <canvas ref={canvasRef} style={{display:"none"}} />
    </div>
  );
}

if (typeof document !== "undefined") {
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(RockArtEnhancer));
} else if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  // Cargado como Web Worker: atiende pedidos de filtros y nada más. Corre las
  // mismas funciones que la página, así que el resultado es el mismo byte a byte.
  self.onmessage = async (e) => {
    const t = e.data;
    try {
      const p = PRESETS.find(x => x.id === t.presetId);
      const store = t.frozen ? { frozen: t.frozen } : {};
      // Con selección se guarda la foto: fuera de la zona queda tal cual
      const origen = t.mask ? new Uint8ClampedArray(t.data) : null;
      const r = p.fn(new ImageData(t.data, t.w, t.h), t.intensity, t.mask, store, t.opts);
      const data = aplicarMascara(origen, r.data, t.mask, t.w * t.h);
      // El PNG para mostrar también se arma acá: con 29 MP, codificarlo en la
      // página la congelaba un segundo más. Si no se puede, lo hace la página.
      let png = null;
      if (t.png && typeof OffscreenCanvas !== "undefined") {
        try {
          const oc = new OffscreenCanvas(t.w, t.h);
          oc.getContext("2d").putImageData(new ImageData(data, t.w, t.h), 0, 0);
          png = await oc.convertToBlob({ type: "image/png" });
        } catch (err) { png = null; }
      }
      self.postMessage({ id: t.id, data, frozen: store.frozen || null, png }, [data.buffer]);
    } catch (err) {
      self.postMessage({ id: t.id, error: String((err && err.message) || err) });
    }
  };
}
