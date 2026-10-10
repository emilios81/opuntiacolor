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

const { useState, useRef, useCallback, useEffect } = React;
const OPC_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCACgAKADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxk0c0n0paCgHFB60UUALSGiigA7UUUUAHekPWlNJj1oAUUpFSWlrcXkwhs7ea4m/uQxl2/IAmrmo6Jqumx+ZqOl39pGf457Z0X8yMUAZ3ejHNJ3paACgGjrSd6AFzxQKKMUAIeaBRzR2oABS0L0oNAATQKbSrSAU0dKdximmmB0Fp4akvvCNzrdncLK9pKUubYL80aYGHz3/w+hrFsYDd3tvbKcGaVIwfTcwH9a3fAPiL/hHddWWcb9PuF8i7jIyGjPfHt1+maunTrPSPiRFHZO17pdrdRz77VDNsj4bB2g5I4FcntJwnKMu11/l8jo5IyjGS9H/mY3i7SotD8S6hpsErzR20mxXcAMeAecfWtf4ZeCrnxz4kSwhcw2kS+bdXGM+XHnHH+0TwPxPaquvXVhqHjPWL6++0C1eV5UhCGOSXoFXkfID1JPQDjmvefg3DD4I+Dd34kuI18y5jlvpCc7mCnbCn0/8Aiq1pSlyLm3sjOokpO3ct6t478H/CoN4f0TTHnuoQPOS2IXBxn97K3JbnJ649qoaN8fdJ1G6Sy1fRpbKzmPltOZlnRM8ZdcDK+vWsX4GeBbfxO974s8VxJeiW4fyYpuUkkzmSRh3AJwAeOD7Vq/GTwz4e17wJJ4n8MR2WbI8y2aBVmiDbHVgAASp5B9j2NK73Jstjmvj98NrPQ7WLxL4eiSKzldUu7eIfu0ZvuyIOyk8EdBkYrw85r6t8Nuviz9nmSC8cvMNOmtyWP8UOdp/DatfKSNvVWPcA1rF3RIZwKAc0p9KQCqAU0dqMUEUAFH1pAeaXrQAZo60lL0oATFL0oNIaAFzXR+HfCV1r1k1zbahpcAVyhjuLkI/HfGOnNc2OnNbXhzwzqfiSV10y1EkceBJNIQscf1Y/yFY1pcsL83L5s0pq8rWubR+H2oW+s6TZ3l1ZMl/MYw9tMJCoUbmOMeg/Ou78R+MNP8BvDoehaYjNEitIC2xVBHGSOWY9Sa4qBNF8F61pVzDqjalqNvcZuhbxjyEjIIYBupYZz/hXb+L/AANb+MbuLWdH1KJfOjUMxUyRyADAYEcg44I/lXkYicJVIfWW3Cz6NK/pvselRjKMJexXv+qegtxFbfFDwdJcQWfkarDJ5UZ+8yvxwG7qQehrqv2iruPQPh7o/h2x+VJnSIKO8UKjj8W20fD220zwtq2ieGraX7TfTytNIP4uFLNIw/hHAAFc98aJjrnxo8P6N96OH7NEV95JN7f+OgVvgPgly/Bf3fQwxnxx5vitr6nZeK7keBfgR9htJAt4ltHY5HBWaUZc/XDMay/gnbrffBLX7OVd0TSXcYHsYgf50ftUX3l6FoVip/191JMRnsiYH6vUvwZdLD4Iavd5ILG9lPPA2pgfTpXecXQZ+zzMbj4Ua1BIMpFNOo+jQhj+pr5hh/1Sf7o/lX03+zlEyfC3XZW+69xNj8IFFfMkXMMf+6P5VpDYT3Hd6XNJ0FFWIdmk5zS0E0AIOtL1NJRQApFKOaQmgGgA70hpaUYxSAbirEN5dQ20tvFczx28pzJGkhCv9QOtQcDr34Fben+FPEWoIHsNC1S4Q9GS1fB/EjFDSe472MUAthUGWPAHqe1dl44j/wCEYv7LS9HnntJorKP7a0EzL5krckkA4ziol+G/jUbXXwzqoIIIPljIP50mreEfG17ezXep6BrU11KdzyNakljjHb6VlOm5TTb0V9P6+ZcZqMWluek/Ai20298b6RqGn7VuY9Hn+2R7izCYOqb2J/vBs0pQan+1JhvmWG8z/wB+4P8AGrX7Mfh7VNN8R63c6pp17ZD7LHEhuIGj3ZkyQNw5+6KzPhnM2o/tDX15y2Z76T8BlR/Sko8i5b3E5czbF/aiuN3i7R7beSIbFpCD2LyH+i12LwDQf2Y3UkxvNpu4+paZ8/8As1ecftHSm6+JkkCD5orOCEfUgn/2YV6R+0FN/Y3wt0rR1PM00FuR/sxJk/qooDsSfA2MQ/Ba8kYbVdr1y3rwR/SvleEfuI/90fyr6v8Ah5EbP9nh3B+ZtNvZ8Z7nzK+UY+I0H+yP5VpDYl7i4opc0hqxCikopM0gFFLxTQaX60wDFLigUopAGa7T4Z/D3U/Heoslsfs2mwsBcXjrkJ/sqP4m9u3euKc7VJ9BmvsjRxD4E+Dcd1plurm000XbLj/WysgYsfqxyfYUm7IDEe1+HfwhtoRcRJPqrLlS6Ce7k/2h2QfkK5fVf2g3Vj/ZWhKeMeZd3J5/4CgwPzryHRrHVfHvjOK1a587U9RlLSXE5yBgZZj7ADgD2Ar6Gj8BeAPh/pMV/wCJUhuCGCfar8GQyORkBIhxng8YPA61ndsuyR59/wANA+I2YlNN0bHoEkOP/HquQfH/AF6MA3Oh6ey/7LSx/wA811x+NPgSwXytPsrwoOn2exSNfwyRUqfHjwfKAJrbVEHfdaqw/RqQfI5N/wBom5I50C2DjlT9tbG73G3ke1R/s36TeXfifVPEd1E0dqInjSZhtV5ZHBIXPXAz+YFdbL8WfhzcOrzQOx9X0sN/StXT/jH4FldYBqElvGvKma0dEX2GBxQHyPN/G/gvX9e+OrkabdHT5bqCX7V5Z8pYVCbju6Z+UjHXNbv7Vkch0zw5KoPkrcTKx9GKAj9A1el2nxC8IXZzD4l0wj0ecJ/6Fik1r/hE/GGnTafd32mX1tPjcEu0LArnaykNlWB70Cucx8KbrSvFPwitdAjvQk32J7G6jikUTRZyCQD6g5BxjmvPfEX7PWpW5kbw7qkV1GvSK9TyXPsGXKn8QK09X/Z6YS+f4d8Q4Gcxi6iOV/7aRn+lYs2g/FrwS3nWF3e31tH1FtP9rTHvG/zY+gqlJoLJ7HlfibwxrXhm58jXdNuLNicKzrlH/wB1x8p/OscV9NeAvivY+NCPDXjLT7RLm6PkqWTME7f3GVvuP6ds+hrzL43/AA6TwTqkF3pYc6JesViVzkwSDkxk9xjkE88EdqtSuJqx5jikpaBxVCExRS0uKACjoaOMUGkAhIPWvq74HeNLHxR4Oh0G/ZX1OxtzbyW0hH+lQhSqkZ6/LwfQ+xr5Rqeyup7K7iurOaSC5hYPHLGxVkYdwR0oauB6746+GuveAtdTXvCP2ifT4ZPOhlgG+W1/2XX+JeozyCOtdTpXxj8L+KtHGl/EDSVjBI3yCMywFh/EMfOh/l61meCPj/c2yx2vi6yN1GBtN9aALJ9Wj6H6qR9K79tK+G/xLiNxapYXV22Nz2z/AGe5U9yw4J/EGs3Foq/c562+Fnw48SIZfD2tSASdEt71JNv/AAFxuFZuofs7N5h+weISI8cfaLXkH0yrf0qzrf7PNsXL6Drk0D/wx3kQf/x9cH9DXPS+CPix4Wf/AIlGoXl1ApwPsV9vH/fuT/CpHfzEu/2f/EcSk2up6TcEdATJGf1Brn774OeNrWYRrpSXIIyJLe4Rl+hyQQa1vDXxW8bWvimw0/Vbw3AN2ltcW1zbojfM4UgkAFSM17f8XfFU/gzwhLqVhFFJeyTpbxGUZVS2csR3wB0oC7R81zfC3xtEuW8P3p9kKN/Jqz5Ph54vhbL+GNT4/wCnbd/LNd9pfxs8XlTLLpVlqEa5G9bSRce25DgVpJ+0NqEUmLvw5bBvQXLofyK0aD1PN9KsfHehzKdLs/Elk/pDDMoP4Ywfyr3v4RXXj/UJJ18bQOmmeV+5kuUEU7SZ6YXBK4z1A7Yrkj+0d8pB8OLv7EX+B/6BWZN8S/iD4132fhbSntEk4L2UTMwB9Zn4X6jFAndmN8bLeG5+M32fw+gN7K1skgh73JPXj+LG0n6V6l+07JDH8PIY5yDPLqEPlAnuoYsR6cZ/Ok+Fnw4tfBkdx4i8VXUEmrxhnkkkfMdoCMsd5+85zy34DvXjfxs8dr428RRiwLDR7ANHbZGDIT96QjtnAA9h71UVrclvoede1HegUtaiA4xQOlJiigABpaSkFAC0c0tFACZoBIcMOGHQjqPxo7UUAdhoHxJ8X6GEWx127aJekVw3np9MPk/rXvvwQ8da149i1aLXraz8izWMCaBWjLuxJwRnHRc8V8p19Wfsz6W1l8OzeMNrahePMOB8yLhB/wCgmolsB5V452337QUqW4UZ1a1i4HVh5eT+leo/tPuD4DshxzqaD/xx68j8Gu2ufHazuMhhNq8txn/ZUuw/QCvUP2ppQPCmiwlvme/LgdM4jb/GszTqix+z5cjTfhPqV9PvMFvdXFxtRsEqiKxH6Gmx/HjwXfIpvtO1NCQDiW0ST+RNUvhdmD9nvXpt2MxagcZ4+7jP6V80Lwq/QVcVch7n1LL8XfhuqFo7STzMcFdKGQfXkVmaz+0NpsMBj0HRbqdwMKbplhj+u1cn8OK+bqUVXKhHV+N/H/iHxlJjWL3FoG3JZwDZCp7fL/Efck1ymTigjmimAlBNKaTvTAKUUUtADTQKXFAoATvS55pTSDrSAKKDRTAa5wpI7DNfa+hRjwp8KbMqSosNI8xgf74j3n9Sa+LIk3yov95gv5nFfZ3xfb7J8MPEJjCgrYeV15wSq/lyaiY0eB/s5QG5+J9tK/zGC1nmJPrtC5/8err/ANqm9UT+G9OUksomuGBOTglVH8mrB/ZjMC+OdS89kU/2a+3cQP40z+lct8YvE0Xijx5e3lo++wt1FrbMDwyJnLD2LFj9MVmX9o9g8LxfZf2Yb18YMun3cnH+0zCvmMcDFfVerWi6X+zbJAxxIuhqSM/38Hp9TXyo1ax2IYUCkpeMUxB1pMUoNBoAKSjpS0AJ9KKXtRTAM0Zoo5pAJQBS0A0wCigsBwSMntmtey8M67fCNrPRNTnWQZRo7SQhh7HGKQGQrmNhIOShDAfTmvt7xTZxeLvh/exW2HfUtOLQ46tlQ6/rivlay+Ffje7I8vw5eID3mKRj9Wr6X+D9j4j0fwjDo/ii1it5bP5LaWO4WTfH1CkDoV6e4xUzA+PpUeB8NkEg+3sR+YIIqbSrCXVNStLC1UvPdSrCij1Y4/8Ar19LfED4L2/iO8m1DSLyPTLmeQyzQSR+ZEZD1dSMFS3UjkE88Gr3ww+Edj4MvRqd7djUdWAKxME2RwA8EqOSWxxuP4CsjTmJvjxNFpHwe1C0QjEiwWcfv8y/0U18iE5r6q+OvhDxT40OnWOiR2I0u0zOwludjyykbR8uMYUZ/FvavFbz4OeOrXJ/sTzgO8FxG/8AUVrHYzPPqUe9dFqPgjxTpylr7w9qsSr1b7MzD81zXOyAxuUkBRx1Vhg/kasAxS8YpM5oNIBKU03vTx0oAaaMUpopgLyKDRnilpANp8TKkiMyLIqsCUbOGAPQ45welNPApKAPRtJ+KlxowH9k+FfC1oQcho7Ni3/fRYn9a2H+P/i4xhUt9IT6QOf5vXkFKKLID1SX46+M2ztk0xP92zBx+Zqu/wAb/HDY26hZp/u2Sf1rzSkosgPSj8bPHXfVLb/wCj/wpB8bPHQ/5ilvj/ryj/wrzc0AHFFkB6WPjd43BBN9ZOwyAzWSZ5qdPjp40AG6XTGPqbMf415ZiiiyA9XHx58ZgddLP/bqR/7NVPUPjJ4g1JCmo6b4eu1PUT6eH/ma80PFANFgLOpXIvL+a5W1trQSHd5NshSNOP4QScDv1quRmkJ5pRQAmPzoHFLSZpgHWg0tJSA//9k=";

// ============================================================
// OPC – OpuntiaColor v3.7.0
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
// ============================================================

// --- Color Conversion Core ---

function rgb2lab(r, g, b) {
  let rr = r / 255, gg = g / 255, bb = b / 255;
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
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

function enhanceBichrome(imageData, intensity = 1.5, mask = null, store = null) {
  const data=imageData.data,n=data.length/4,output=new Uint8ClampedArray(data.length);
  const labs=new Array(n);const lv=new Float64Array(n);for(let i=0;i<n;i++){labs[i]=rgb2lab(data[i*4],data[i*4+1],data[i*4+2]);lv[i]=labs[i][0];}
  const mL = (store && store.frozen) ? store.frozen.mL : meanStd1(lv, n, mask).mean;
  if (store && !store.frozen) store.frozen = { mL };
  for(let i=0;i<n;i++){let[L,a,bL]=labs[i];const rb=a>5?intensity*1.3:(a>0?intensity:1),nA=a*rb,ch=Math.sqrt(a*a+bL*bL),isW=L>mL&&ch<25,wb=isW?(L-mL)*intensity*0.15:0,nL=Math.max(0,Math.min(100,L+wb)),isR=!isW&&a<5&&L<mL,rs=isR?0.7:1;const[nr,ng,nb]=lab2rgb(nL*rs+(1-rs)*(nL*0.6),Math.max(-128,Math.min(127,nA)),Math.max(-128,Math.min(127,bL*(isW?0.5:1))));output[i*4]=nr;output[i*4+1]=ng;output[i*4+2]=nb;output[i*4+3]=255;}
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
  if (escala > 0) return reliefEscala(imageData, intensity, mask, store, escala);
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
function reliefEscala(imageData, intensity, mask, store, escala) {
  const data = imageData.data, w = imageData.width, h = imageData.height, n = w * h;
  const lum = new Float32Array(n), fino = new Float32Array(n), fondo = new Float32Array(n), tmp = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = 0.299*data[i*4] + 0.587*data[i*4+1] + 0.114*data[i*4+2];
  quitarTendencia(lum, w, h);
  const r = Math.max(1, Math.round(Math.max(w, h) * escala / 200)), R = r * RELIEF_FONDO;
  boxBlur(lum, fino, tmp, w, h, r); boxBlur(fino, fondo, tmp, w, h, r); boxBlur(fondo, fino, tmp, w, h, r);
  // El fondo usa lum como intermedio: ya no hace falta
  boxBlur(lum, fondo, tmp, w, h, R); boxBlur(fondo, lum, tmp, w, h, R); boxBlur(lum, fondo, tmp, w, h, R);
  for (let i = 0; i < n; i++) fino[i] -= fondo[i];
  let st = store && store.frozen;
  if (!st) {
    const q = tukeyFences(fino, n, mask, 0);   // k = 0: Q1 y Q3
    st = { mid: (q.lo + q.hi) / 2, sig: (q.hi - q.lo) / 1.349 || 1 };
    if (store) store.frozen = st;
  }
  const g = 40 * intensity / 1.5 / st.sig;
  const output = new Uint8ClampedArray(data.length);
  for (let i = 0; i < n; i++) {
    const v = 128 + (fino[i] - st.mid) * g;
    output[i*4] = v; output[i*4+1] = v; output[i*4+2] = v; output[i*4+3] = 255;
  }
  return new ImageData(output, w, h);
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
  const labs=new Array(n);const lv=new Float64Array(n);for(let i=0;i<n;i++){labs[i]=rgb2lab(data[i*4],data[i*4+1],data[i*4+2]);lv[i]=labs[i][0];}
  const mL = (store && store.frozen) ? store.frozen.mL : meanStd1(lv, n, mask).mean;
  if (store && !store.frozen) store.frozen = { mL };
  for(let i=0;i<n;i++){const[L,a,bL]=labs[i];const ch=Math.sqrt(a*a+bL*bL);if(a>8&&ch>12){const ri=Math.min(1,a/40);output[i*4]=Math.round(255*ri);output[i*4+1]=Math.round(80*(1-ri));output[i*4+2]=0;}else if(L<(mL-10)&&ch<15){const bi=Math.min(1,(mL-L)/(mL*0.6));output[i*4]=Math.round(40*(1-bi));output[i*4+1]=Math.round(200+55*bi);output[i*4+2]=Math.round(40*(1-bi));}else if(L>65&&ch<18){const wi=Math.min(1,(L-65)/35);output[i*4]=Math.round(100*(1-wi));output[i*4+1]=Math.round(200+55*wi);output[i*4+2]=Math.round(220+35*wi);}else{const g=Math.min(255,Math.round(L*1.2));output[i*4]=g;output[i*4+1]=g;output[i*4+2]=g;}output[i*4+3]=255;}
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
// MAIN COMPONENT
// ============================================================

function RockArtEnhancer() {
  const [image, setImage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [processedSrc, setProcessedSrc] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [intensity, setIntensity] = useState(1.5);
  // Escala del Relieve en % del lado mayor (0 = mapa de bordes de v3.6)
  const [reliefScale, setReliefScale] = useState(0);
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
  // Resolución de trabajo: completa por defecto (hasta 8192px). Se puede bajar
  // a 2000px desde el panel si la máquina no da abasto; la elección persiste
  // mientras dure la sesión, y el botón queda marcado para que no pase inadvertida.
  const [fullRes, setFullRes] = useState(true);
  // NUEVO: modo acumular (stacking)
  const [stackMode, setStackMode] = useState(false);
  // NUEVO: ajustes post-procesamiento
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  // NUEVO: formato de exportación
  const [exportFmt, setExportFmt] = useState("png"); // png|jpg|tiff
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
  const pickBaseRef = useRef(null);                   // + ajustes fijados: de acá se muestrea

  const [selTool, setSelTool] = useState("none"); // none|rect|circle|free
  const [selData, setSelData] = useState(null); // {type,x1,y1,x2,y2} or {type,points:[]}
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

  // Tamaño de trabajo: resolución completa por defecto (hasta 8192px), 2000px opcional
  const computeSize = (img, full) => {
    const mx = full ? 8192 : 2000;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > mx || h > mx) { const s = mx / Math.max(w,h); w = Math.round(w*s); h = Math.round(h*s); }
    return { w, h };
  };

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFileName(file.name); setExifData(null); setExifRaw(null);
    const er = new FileReader();
    er.onload = (e) => { try { const p = parseExifData(e.target.result); if(p) setExifData(p); const seg = extractExifSegment(e.target.result); if(seg) setExifRaw(seg); } catch(e){} };
    er.readAsArrayBuffer(file);
    const dr = new FileReader();
    dr.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageSize(computeSize(img, fullRes)); setImage(img); setImageSrc(e.target.result); setProcessedSrc(null); setActivePreset(null); setStackMode(false); setSelData(null); setSelTool("none"); setContrast(0); setSaturation(0); setPickColor(null); setPickSteps([]); setPicking(false); setPickSrc(null); processedDataRef.current=null; pickBaseRef.current=null; drawRef.current={active:false,tool:"",start:null,pts:[]}; pipelineRef.current=[]; setView({z:1,tx:0,ty:0}); setPanTool(false);
      };
      img.src = e.target.result;
    };
    dr.readAsDataURL(file);
  }, [fullRes]);

  const setWorkingRes = (nv) => {
    if (nv === fullRes) return;
    setFullRes(nv);
    if (image) {
      setImageSize(computeSize(image, nv));
      setProcessedSrc(null); setActivePreset(null); setSelData(null); setSelTool("none");
      drawRef.current={active:false,tool:"",start:null,pts:[]}; pipelineRef.current=[];
    }
  };

  // processImage: soporta stacking y máscara de selección
  const processImage = useCallback((preset, int) => {
    if (!image) return; setProcessing(true); setActivePreset(preset.id);
    // setTimeout directo (no requestAnimationFrame): rAF se pausa si la
    // pestaña pierde visibilidad y el procesamiento quedaba colgado
    setTimeout(() => {
      try {
        const cv = document.createElement("canvas"), ctx = cv.getContext("2d"), {w,h} = imageSize;
        cv.width=w; cv.height=h;

        const applyWithMask = (sourceData, resultData, mask) => {
          if (!mask) return resultData;
          const merged = new ImageData(new Uint8ClampedArray(sourceData.data), w, h);
          for (let i = 0; i < w*h; i++) {
            if (mask[i]) {
              merged.data[i*4] = resultData.data[i*4];
              merged.data[i*4+1] = resultData.data[i*4+1];
              merged.data[i*4+2] = resultData.data[i*4+2];
            }
            merged.data[i*4+3] = 255;
          }
          return merged;
        };

        const mask = generateMask(selData, w, h);
        // Parámetros propios de un filtro; viajan también al pipeline del lote
        const opts = preset.id === "relief" ? { escala: reliefScale } : null;

        // Si stackMode y hay resultado previo, usar ese como fuente
        if (stackMode && processedSrc) {
          const tmpImg = new Image();
          tmpImg.onload = () => {
            try {
              ctx.drawImage(tmpImg,0,0,w,h);
              const sourceData = ctx.getImageData(0,0,w,h);
              const id = new ImageData(new Uint8ClampedArray(sourceData.data), w, h);
              const store = {};
              const result = preset.fn(id, int, mask, store, opts);
              const final = applyWithMask(sourceData, result, mask);
              processedDataRef.current = final;   // fuente del gotero: el filtro sin ajustes post
              ctx.putImageData(final,0,0); setProcessedSrc(cv.toDataURL("image/png"));
              // Registrar el paso acumulado en el pipeline del lote
              pipelineRef.current.push({ presetId: preset.id, intensity: int, frozen: store.frozen || null, opts });
            } catch(err) { console.error(err); }
            setProcessing(false);
          };
          tmpImg.onerror = () => setProcessing(false);
          tmpImg.src = processedSrc;
          return;
        }

        ctx.drawImage(image,0,0,w,h);
        const sourceData = ctx.getImageData(0,0,w,h);
        const id = new ImageData(new Uint8ClampedArray(sourceData.data), w, h);
        // La máscara también se pasa al filtro: las estadísticas se calculan
        // sobre la zona seleccionada (decorrelación local, como DStretch)
        const store = {};
        const result = preset.fn(id, int, mask, store, opts);
        const final = applyWithMask(sourceData, result, mask);
        processedDataRef.current = final;   // fuente del gotero: el filtro sin ajustes post
              ctx.putImageData(final,0,0); setProcessedSrc(cv.toDataURL("image/png"));
        // Aplicación fresca → el pipeline arranca de cero con este paso
        pipelineRef.current = [{ presetId: preset.id, intensity: int, frozen: store.frozen || null, opts }];
      } catch(e) { console.error(e); }
      setProcessing(false);
    }, 50);
  }, [image, imageSize, stackMode, processedSrc, selData, generateMask, reliefScale]);

  useEffect(() => {
    // En modo acumular NO se reaplica automáticamente al mover la intensidad:
    // cada reaplicación tomaría el resultado previo como fuente y el filtro
    // se acumularía sin control. El usuario reaplica con el botón del filtro.
    if (stackMode) return;
    if (activePreset && image) { const p = PRESETS.find(x=>x.id===activePreset); if(p){ const t=setTimeout(()=>processImage(p,intensity),250); return ()=>clearTimeout(t); }}
  }, [intensity]);

  // Lo mismo con la escala del Relieve, que solo afecta a ese filtro
  useEffect(() => {
    if (stackMode || activePreset !== "relief" || !image) return;
    const p = PRESETS.find(x => x.id === "relief");
    const t = setTimeout(() => processImage(p, intensity), 100);
    return () => clearTimeout(t);
  }, [reliefScale]);

  const handleSliderMove = useCallback((cx) => { const b=getImageBounds(); if(!b) return; setSliderPos(Math.max(0,Math.min(100,((cx-b.ox)/b.cw)*100))); }, [getImageBounds]);
  const handlePointerDown = (e) => { setDragging(true); handleSliderMove(e.clientX); };
  useEffect(() => { if(!dragging) return; const m=(e)=>handleSliderMove(e.clientX), u=()=>setDragging(false); window.addEventListener("pointermove",m); window.addEventListener("pointerup",u); return ()=>{window.removeEventListener("pointermove",m);window.removeEventListener("pointerup",u);}; }, [dragging,handleSliderMove]);

  // Encoder TIFF sin comprimir (RGB 8-bit)
  const encodeTIFF = (canvas) => {
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, w, h).data;
    const pixelBytes = w * h * 3; // RGB sin alpha
    const ifdOffset = 8;
    const ifdEntries = 12;
    const ifdSize = 2 + ifdEntries * 12 + 4;
    // Área de valores fuera de línea (BitsPerSample necesita 3 SHORTs,
    // X/YResolution son RATIONAL de 8 bytes según spec TIFF 6.0)
    const bitsOffset = ifdOffset + ifdSize;
    const xresOffset = bitsOffset + 8;   // 6 bytes + 2 de alineación
    const yresOffset = xresOffset + 8;
    const stripOffset = yresOffset + 8;
    const fileSize = stripOffset + pixelBytes;
    const buf = new ArrayBuffer(fileSize);
    const view = new DataView(buf);
    const u8 = new Uint8Array(buf);
    // Header: little-endian TIFF
    view.setUint16(0, 0x4949, false); // II
    view.setUint16(2, 42, true);
    view.setUint32(4, ifdOffset, true);
    let off = ifdOffset;
    // IFD entry count
    view.setUint16(off, ifdEntries, true); off += 2;
    const writeIFD = (tag, type, count, value) => {
      view.setUint16(off, tag, true); off += 2;
      view.setUint16(off, type, true); off += 2;
      view.setUint32(off, count, true); off += 4;
      view.setUint32(off, value, true); off += 4;
    };
    writeIFD(256, 3, 1, w);            // ImageWidth
    writeIFD(257, 3, 1, h);            // ImageLength
    writeIFD(258, 3, 3, bitsOffset);   // BitsPerSample [8,8,8]
    writeIFD(259, 3, 1, 1);            // Compression: none
    writeIFD(262, 3, 1, 2);            // PhotometricInterpretation: RGB
    writeIFD(273, 4, 1, stripOffset);  // StripOffsets
    writeIFD(277, 3, 1, 3);            // SamplesPerPixel
    writeIFD(278, 4, 1, h);            // RowsPerStrip
    writeIFD(279, 4, 1, pixelBytes);   // StripByteCounts
    writeIFD(282, 5, 1, xresOffset);   // XResolution: RATIONAL 72/1
    writeIFD(283, 5, 1, yresOffset);   // YResolution: RATIONAL 72/1
    writeIFD(296, 3, 1, 2);            // ResolutionUnit: pulgadas
    // Next IFD offset = 0
    view.setUint32(off, 0, true);
    // Valores fuera de línea
    view.setUint16(bitsOffset, 8, true); view.setUint16(bitsOffset+2, 8, true); view.setUint16(bitsOffset+4, 8, true);
    view.setUint32(xresOffset, 72, true); view.setUint32(xresOffset+4, 1, true);
    view.setUint32(yresOffset, 72, true); view.setUint32(yresOffset+4, 1, true);
    // Pixel data: RGB (sin alpha)
    let pOff = stripOffset;
    for (let i = 0; i < w * h; i++) {
      u8[pOff++] = imgData[i * 4];
      u8[pOff++] = imgData[i * 4 + 1];
      u8[pOff++] = imgData[i * 4 + 2];
    }
    return new Blob([buf], { type: "image/tiff" });
  };

  const handleDownload = () => {
    if (!processedSrc) return;
    try {
      const tmpImg = new Image();
      tmpImg.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = tmpImg.naturalWidth; cv.height = tmpImg.naturalHeight;
        const ctx = cv.getContext("2d");
        if (contrast !== 0 || saturation !== 0) {
          ctx.filter = `contrast(${1 + contrast/100}) saturate(${1 + saturation/100})`;
        }
        ctx.drawImage(tmpImg, 0, 0);
        // Nombre reproducible: filtro + intensidad + ajustes post aplicados
        const gPasos = [...pickSteps, ...((pickColor && pickGain) ? [{ tol:pickTol, gain:pickGain }] : [])];
        const gt = gPasos.length ? "_gotero" + gPasos.map(a => `_g${a.gain>0?"+":""}${a.gain}t${a.tol}`).join("") : "";
        // La escala del Relieve va al lado de la intensidad; con 0 (bordes) se
        // omite, así el nombre sale igual que en v3.6 para el mismo resultado
        const esc = (activePreset === "relief" && reliefScale) ? `_e${reliefScale}` : "";
        const params = `_i${intensity.toFixed(1)}${esc}${gt}${contrast!==0?`_c${contrast}`:""}${saturation!==0?`_s${saturation}`:""}`;
        const base = `${(fileName||"opc").replace(/\.[^.]+$/,"")}_OPC_${activePreset}${params}`;
        const doDownload = (blob, ext) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `${base}.${ext}`;
          a.style.display = "none"; document.body.appendChild(a); a.click();
          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
        };
        if (exportFmt === "tiff") {
          doDownload(encodeTIFF(cv), "tif");
        } else if (exportFmt === "jpg") {
          cv.toBlob(async (blob) => {
            if (!blob) return;
            let out = blob;
            // Reinyectar el EXIF original (GPS/fecha) en el JPG exportado
            if (exifRaw) {
              try {
                const buf = new Uint8Array(await blob.arrayBuffer());
                if (buf[0] === 0xFF && buf[1] === 0xD8) {
                  out = new Blob([buf.slice(0, 2), exifRaw, buf.slice(2)], { type: "image/jpeg" });
                }
              } catch (err) {}
            }
            doDownload(out, "jpg");
          }, "image/jpeg", 0.92);
        } else {
          cv.toBlob((blob) => { if(blob) doDownload(blob, "png"); }, "image/png");
        }
      };
      tmpImg.src = pickSrc || processedSrc;
    } catch(e) { const w=window.open(); if(w) w.document.write(`<img src="${processedSrc}" style="max-width:100%"/>`); }
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
      try {
        // EXIF crudo de ESTA foto (cada una conserva su propio GPS/fecha)
        let exifSeg = null;
        if (batchFmt === "jpg") {
          try { exifSeg = extractExifSegment(await file.arrayBuffer()); } catch (e) {}
        }
        const bmp = await createImageBitmap(file);
        let w = bmp.width, h = bmp.height;
        if (w > batchRes || h > batchRes) { const s = batchRes / Math.max(w, h); w = Math.round(w*s); h = Math.round(h*s); }
        cv.width = w; cv.height = h; // redimensionar también limpia el canvas
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        let id = ctx.getImageData(0, 0, w, h);
        // Aplicar cada paso del pipeline con sus estadísticas congeladas
        // (sin máscara: en el lote el realce cubre la imagen completa)
        for (const step of pipeline) {
          const preset = PRESETS.find(p => p.id === step.presetId);
          if (!preset) continue;
          id = preset.fn(id, step.intensity, null, step.frozen ? { frozen: step.frozen } : null, step.opts);
          await new Promise(r => setTimeout(r, 0));
        }
        // Ajustes post por píxel (ver applyPostAdjust): mismo resultado que
        // la descarga individual pero sin segundo canvas ni ctx.filter
        // El gotero va antes de los ajustes post, igual que en la vista previa
        applyPickChain(id, pickSteps, (pickColor && pickGain) ? { ...pickColor, tol:pickTol, feather:pickFeather, gain:pickGain } : null);
        applyPostAdjust(id, contrast, saturation);
        ctx.putImageData(id, 0, 0);
        id = null;
        // Codificar según formato
        const base = file.name.replace(/\.[^.]+$/, "");
        let blob, ext;
        if (batchFmt === "tiff") {
          blob = encodeTIFF(cv); ext = "tif";
        } else if (batchFmt === "png") {
          blob = await new Promise(r => cv.toBlob(r, "image/png")); ext = "png";
        } else {
          blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.95)); ext = "jpg";
          if (blob && exifSeg) {
            try {
              const u8 = new Uint8Array(await blob.arrayBuffer());
              if (u8[0] === 0xFF && u8[1] === 0xD8) blob = new Blob([u8.slice(0, 2), exifSeg, u8.slice(2)], { type: "image/jpeg" });
            } catch (e) {}
          }
        }
        if (!blob) throw new Error(tr("No se pudo codificar la imagen","Could not encode the image"));
        // MISMO nombre que el original (workflow de reemplazo de texturas):
        // guardar siempre en una carpeta DISTINTA a la de los originales
        const outName = `${base}.${ext}`;
        if (dirHandle) {
          const fh = await dirHandle.getFileHandle(outName, { create: true });
          const ws = await fh.createWritable();
          await ws.write(blob); await ws.close();
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = outName; a.style.display = "none";
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
      } catch (err) { console.error("Lote:", file.name, err); errors.push(file.name); }
      setBatchProgress(p => ({ ...p, done: fi + 1, errors: [...errors] }));
    }
    // Liberar el backing store del canvas de trabajo
    cv.width = 0; cv.height = 0;
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

  const handleReset = () => { setImage(null);setImageSrc(null);setProcessedSrc(null);setActivePreset(null);setExifData(null);setExifRaw(null);setFileName("");setStackMode(false);setContrast(0);setSaturation(0);setPickColor(null);setPickSteps([]);setPicking(false);setPickSrc(null);processedDataRef.current=null;pickBaseRef.current=null;setSelTool("none");setSelData(null);drawRef.current={active:false,tool:"",start:null,pts:[]};pipelineRef.current=[];setShowBatch(false);setBatchFiles([]);setView({z:1,tx:0,ty:0});setPanTool(false);if(fileInputRef.current)fileInputRef.current.value=""; };

  // --- Herramientas de selección ---
  const clearSelection = () => { setSelData(null); setSelTool("none"); setProcessedSrc(null); drawRef.current={active:false,tool:"",start:null,pts:[]}; pipelineRef.current=[]; };

  // Un unico reparto del pointerdown del visor: la mano tiene prioridad
  // mientras esta activa; si no, gotero, seleccion y deslizador como antes.
  const handleViewerDown = (e) => {
    if (panTool || e.button === 1) return startPan(e);
    if (picking) return handlePick(e);
    if (selTool !== "none") return handleSelDown(e);
    if (processedSrc) return handlePointerDown(e);
  };

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
              <span style={{ fontSize:9,color:T.tm,fontFamily:mono }}>v3.7.0</span>
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
          <h3 style={{ margin:"0 0 10px",color:T.ac,fontSize:15 }}>OPC v3.7.0 &mdash; {tr("Novedades","What\u2019s new")}</h3>
          {lang === "es" ? (<>
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
                  {processedSrc && <button onClick={handleDownload} style={{ flex:1,padding:"8px 8px",background:`linear-gradient(135deg,${T.ac},${solar?"#7f1d1d":"#8e2118"})`,border:"none",borderRadius:8,color:"#fff",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'Crimson Pro',serif" }}>{"\u2B07"} {tr("Descargar","Download")}</button>}
                  <button onClick={handleReset} style={{ flex:1,padding:"8px 8px",background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:8,color:T.tm,fontSize:11,cursor:"pointer",fontFamily:"'Crimson Pro',serif" }}>{"\u21BB"} {tr("Nueva imagen","New image")}</button>
                </div>
                {processedSrc && (
                  <div style={{ display:"flex",gap:2 }}>
                    {["png","jpg","tiff"].map(fmt => (
                      <button key={fmt} onClick={()=>setExportFmt(fmt==="tiff"?"tiff":fmt)} style={{ flex:1,padding:"4px 2px",fontSize:9,fontFamily:mono,fontWeight:exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?700:400,background:exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?T.acBg:T.bBg,border:`1px solid ${exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?T.acBd:T.cBd}`,borderRadius:4,cursor:"pointer",color:exportFmt===fmt||(fmt==="tiff"&&exportFmt==="tiff")?T.ac:T.tm,textTransform:"uppercase" }}>{fmt}</button>
                    ))}
                  </div>
                )}
                {processedSrc && (
                  <button onClick={()=>{setShowBatch(true);setBatchFiles([]);setBatchProgress({done:0,total:0,current:"",errors:[]});}} style={{ padding:"7px 8px",background:T.gnBg,border:`1px solid ${T.gnBd}`,borderRadius:8,color:T.gn,fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'Crimson Pro',serif" }}>{"▦"} {tr("Procesar lote (fotogrametr\u00EDa)","Batch processing (photogrammetry)")}</button>
                )}
              </div>

              {/* Resolución de trabajo. Va arriba, antes de los filtros, porque es
                  una decisión que se toma ANTES de procesar y porque al fondo del
                  panel pasaba inadvertida: se terminaba analizando en baja sin
                  querer. Las dos opciones se muestran juntas para que se vea que
                  hay una elección y cuál está activa. */}
              {image && Math.max(image.naturalWidth,image.naturalHeight) > 2000 && (
                <div style={{ marginBottom:4,padding:"8px 10px",background:T.cBg,border:`1px solid ${fullRes?T.cBd:T.acBd}`,borderRadius:8 }}>
                  <div style={{ fontSize:8.5,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4 }}>{tr("Resoluci\u00F3n de trabajo","Working resolution")}</div>
                  <div style={{ display:"flex",gap:3 }}>
                    {[{ v:true, l:tr("Completa","Full") },{ v:false, l:"2000 px" }].map(o => (
                      <button key={String(o.v)} onClick={()=>setWorkingRes(o.v)}
                        title={o.v?tr("Procesar la foto en su resoluci\u00F3n real, con un tope de 8192 px","Process the photo at its real resolution, capped at 8192 px"):tr("M\u00E1s r\u00E1pido, pero se procesa menos detalle","Faster, but less detail is processed")}
                        style={{ flex:1,padding:"5px 4px",fontSize:9.5,fontFamily:mono,fontWeight:fullRes===o.v?700:400,background:fullRes===o.v?T.acBg:T.bBg,border:`1px solid ${fullRes===o.v?T.acBd:T.cBd}`,borderRadius:5,cursor:"pointer",color:fullRes===o.v?T.ac:T.tm }}>{o.l}</button>
                    ))}
                  </div>
                  <div style={{ fontSize:8,fontFamily:mono,color:fullRes?T.td:T.ac,marginTop:4,lineHeight:1.4 }}>
                    {imageSize.w} &times; {imageSize.h} px {!fullRes
                      ? tr(`\u00B7 reducida de ${image.naturalWidth}\u00D7${image.naturalHeight}`,`\u00B7 reduced from ${image.naturalWidth}\u00D7${image.naturalHeight}`)
                      : Math.max(image.naturalWidth,image.naturalHeight) > 8192
                        ? tr(`\u00B7 tope de 8192 px (orig. ${image.naturalWidth}\u00D7${image.naturalHeight})`,`\u00B7 capped at 8192 px (orig. ${image.naturalWidth}\u00D7${image.naturalHeight})`)
                        : tr("\u00B7 la resoluci\u00F3n real de la foto","\u00B7 the photo\u2019s real resolution")}
                  </div>
                </div>
              )}

              {/* Filtros */}
              <div style={{ fontSize:8.5,fontFamily:mono,color:T.ac,letterSpacing:"1.5px",textTransform:"uppercase",margin:"4px 0 3px 4px",fontWeight:600 }}>{tr("Filtros","Filters")}</div>
              {PRESETS.map(p => (
                <button key={p.id} onClick={()=>processImage(p,intensity)} disabled={processing} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 10px",width:"100%",background:activePreset===p.id?T.acBg:T.cBg,border:`1px solid ${activePreset===p.id?T.acBd:T.cBd}`,borderRadius:7,cursor:processing?"wait":"pointer",transition:"all 0.2s",textAlign:"left",color:T.text,opacity:processing?0.6:1,marginBottom:2 }}>
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
                    <button key={t.id} onClick={()=>{setSelData(null);setProcessedSrc(null);setPanTool(false);setSelTool(selTool===t.id?"none":t.id);drawRef.current={active:false,tool:"",start:null,pts:[]};pipelineRef.current=[];}} title={tr(t.tip,t.tipEn)} style={{ flex:1,padding:"5px 4px",fontSize:13,background:selTool===t.id?T.acBg:T.bBg,border:`1px solid ${selTool===t.id?T.acBd:T.cBd}`,borderRadius:5,cursor:"pointer",color:selTool===t.id?T.ac:T.tm,fontWeight:selTool===t.id?700:400,transition:"all 0.2s" }}>{t.icon}</button>
                  ))}
                  {selData && <button onClick={clearSelection} title={tr("Limpiar selecci\u00F3n","Clear selection")} style={{ flex:1,padding:"5px 4px",fontSize:10,background:T.bBg,border:`1px solid ${T.cBd}`,borderRadius:5,cursor:"pointer",color:T.tm,fontFamily:mono }}>{"\u2715"}</button>}
                </div>
                <div style={{ fontSize:8,fontFamily:mono,color:T.td,marginTop:4,lineHeight:1.4 }}>
                  {selTool !== "none" ? `${tr("Dibuj\u00E1 sobre la imagen","Draw on the image")} \u2192 ${selTool==="rect"?tr("rect\u00E1ngulo","rectangle"):selTool==="circle"?tr("c\u00EDrculo","circle"):tr("forma libre","freehand")}`
                    : selData ? tr("\u2713 Zona seleccionada \u2014 el filtro se aplica solo ah\u00ED","\u2713 Area selected \u2014 the filter is applied only there")
                    : tr("Sin selecci\u00F3n \u2014 filtro en toda la imagen","No selection \u2014 filter applied to the whole image")}
                </div>
              </div>

              {/* Intensity */}
              <div style={{ marginTop:6,padding:"10px 12px",background:T.cBg,border:`1px solid ${T.cBd}`,borderRadius:8 }}>
                <div style={{ fontSize:9,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4 }}>{tr("Intensidad","Intensity")}: {intensity.toFixed(1)}</div>
                <input type="range" min="0.2" max="5.0" step="0.1" value={intensity} onChange={e=>setIntensity(parseFloat(e.target.value))} style={{ width:"100%",accentColor:T.ac }} />
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:7.5,color:T.td,fontFamily:mono,marginBottom:6 }}><span>0.2</span><span>5.0</span></div>
                {/* Preset buttons */}
                <div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>
                  {INTENSITY_PRESETS.map(ip => (
                    <button key={ip.label} onClick={()=>setIntensity(ip.value)} style={{ flex:1,minWidth:36,padding:"4px 2px",fontSize:8.5,fontFamily:mono,fontWeight:Math.abs(intensity-ip.value)<0.2?700:400,background:Math.abs(intensity-ip.value)<0.2?T.acBg:T.cBg,border:`1px solid ${Math.abs(intensity-ip.value)<0.2?T.acBd:T.cBd}`,borderRadius:5,cursor:"pointer",color:Math.abs(intensity-ip.value)<0.2?T.ac:T.tm }}>{tr(ip.label,ip.labelEn)}</button>
                  ))}
                </div>
                {/* Escala del Relieve: solo aparece con ese filtro activo */}
                {activePreset === "relief" && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:9,fontFamily:mono,color:T.td,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4 }}>{tr("Escala","Scale")}: {reliefScale ? `${reliefScale}%` : tr("bordes","edges")}</div>
                    <div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>
                      {RELIEF_ESCALAS.map(e => (
                        <button key={e} onClick={()=>setReliefScale(e)} disabled={processing} style={{ flex:1,minWidth:30,padding:"4px 2px",fontSize:8.5,fontFamily:mono,fontWeight:reliefScale===e?700:400,background:reliefScale===e?T.acBg:T.cBg,border:`1px solid ${reliefScale===e?T.acBd:T.cBd}`,borderRadius:5,cursor:processing?"wait":"pointer",color:reliefScale===e?T.ac:T.tm }}>{e ? e : tr("Bordes","Edges")}</button>
                      ))}
                    </div>
                    <div style={{ fontSize:8,fontFamily:mono,color:T.td,marginTop:4,lineHeight:1.4 }}>
                      {reliefScale
                        ? tr(`Borra lo que mide menos de ~${Math.max(2, Math.round(Math.max(imageSize.w, imageSize.h) * reliefScale / 100))} px (${reliefScale}% del lado mayor) y resta el fondo: se van el grano y la iluminación despareja. Si el motivo se empasta, bajá la escala.`,
                             `Erases what measures less than ~${Math.max(2, Math.round(Math.max(imageSize.w, imageSize.h) * reliefScale / 100))} px (${reliefScale}% of the long side) and subtracts the background: grain and uneven lighting drop out. If the motif blurs, lower the scale.`)
                        : tr("Mapa de bordes de v3.6: todo detalle por igual, para calcar. Para grabados, probá una escala.","v3.6 edge map: every detail alike, for tracing. For engravings, try a scale.")}
                    </div>
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
                  <button onClick={()=>{setPicking(!picking);setPanTool(false);}} title={tr("Toc\u00E1 sobre la imagen el color que quer\u00E9s trabajar","Tap on the image the color you want to work on")}
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
              <div ref={compareRef} style={{ position:"relative",width:"100%",aspectRatio:`${imageSize.w}/${imageSize.h}`,maxHeight:"75vh",borderRadius:10,overflow:"hidden",border:`1px solid ${selTool!=="none"?T.acBd:T.cBd}`,cursor:panTool?(panning?"grabbing":"grab"):(picking||selTool!=="none")?"crosshair":processedSrc?"col-resize":"default",userSelect:"none",background:T.iBg,transition:"border 0.2s",touchAction:"none" }}
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
                {selTool!=="none" && <div style={{ position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",padding:"4px 12px",borderRadius:6,background:"rgba(192,57,43,0.85)",fontSize:10,fontFamily:mono,color:"#fff",pointerEvents:"none" }}>{tr("Dibuj\u00E1 la zona","Draw the area")} &middot; {selTool==="rect"?tr("\u25A1 Rect\u00E1ngulo","\u25A1 Rectangle"):selTool==="circle"?tr("\u25CB C\u00EDrculo","\u25CB Circle"):tr("\u270E Mano alzada","\u270E Freehand")}</div>}
                {processing && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:T.ov }}><div style={{ padding:"14px 20px",borderRadius:10,background:solar?"rgba(255,255,255,0.95)":"rgba(26,23,20,0.9)",border:`1px solid ${T.acBd}`,color:T.ac,fontSize:13,fontFamily:mono,animation:"pulse 1.5s ease-in-out infinite" }}>{tr("Procesando p\u00EDxeles...","Processing pixels...")}</div></div>}
                {!processedSrc && !processing && selTool==="none" && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:solar?"rgba(255,255,255,0.3)":"rgba(26,23,20,0.3)",pointerEvents:"none" }}><div style={{ padding:"14px 20px",borderRadius:10,background:solar?"rgba(255,255,255,0.9)":"rgba(26,23,20,0.8)",border:`1px solid ${T.cBd}`,color:T.tm,fontSize:13,textAlign:"center" }}>{"\u2190"} {tr("Seleccion\u00E1 un filtro","Choose a filter")}</div></div>}
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
        <div><span style={{color:T.gn,fontWeight:500}}>OPC</span> &ndash; OpuntiaColor v3.7.0 &middot; {tr("12 filtros \u00B7 Gotero crom\u00E1tico \u00B7 Zoom y encuadre \u00B7 Lote fotogram\u00E9trico \u00B7 Estad\u00EDsticas por zona \u00B7 Stacking \u00B7 GPS/EXIF \u00B7 100% offline","12 filters \u00B7 Chromatic eyedropper \u00B7 Zoom and pan \u00B7 Photogrammetric batch \u00B7 Per-area statistics \u00B7 Stacking \u00B7 GPS/EXIF \u00B7 100% offline")}</div>
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
      <canvas ref={canvasRef} style={{display:"none"}} />
    </div>
  );
}

    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(RockArtEnhancer));
