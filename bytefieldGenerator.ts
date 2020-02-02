#!/usr/bin/env node
import {argv} from 'process';
import {readFileSync, writeFileSync} from 'fs';

import * as CSON from 'cson';
import { dirname } from 'path';
interface IFile {
  wordsize: number;
  alignbits: number;
  caption: string;
  width?: number;
  subfigure?: boolean;
  parts: {
    name: string;
    length: number;
    footnote?: string;
    include?: string;
    borders?: {
      l: boolean;
      r: boolean;
      t: boolean;
      b: boolean;
    };
  }[]
}
const bordersToString = (borders?: {
  l: boolean;
  r: boolean;
  t: boolean;
  b: boolean;
}) => {
  if (!borders) {
    return '';
  }
  let result = '[';
  result += borders.l ? 'l' : '';
  result += borders.r ? 'r' : '';
  result += borders.t ? 't' : '';
  result += borders.b ? 'b' : '';
  return result + ']';
};

let { wordsize, parts, alignbits, caption, width, subfigure}: IFile = CSON.parse(readFileSync(argv[2]).toString());
if (typeof width === 'undefined') {
  width = 1;
}
const dir = dirname(argv[2]);
for (const [index, part] of parts.entries()) {
  if (typeof part.include !== 'undefined') {
    let { parts: partsNew }: IFile = CSON.parse(readFileSync(`${dir}/${part.include}.cson`).toString());
    parts.splice(index, 1, ...partsNew);
  }
}
console.log(argv[2].replace('.cson', ''));
for (const part of parts) {
  part.borders = {l: true, r: true, t: true, b: true};
}
let bitheader = [];
for (let i = 0; i < wordsize; i += alignbits) {
  bitheader.push(i);
}
bitheader.push(wordsize - 1);
const length = parts.reduce((accum, part) => accum + part.length, 0);
const hexlength = Math.ceil(Math.log2(length/8) / Math.log2(16));
let text = `\\begin{${subfigure === true ? 'subfigure' : 'figure'}}[${subfigure === true ? 'b' : 'htp'}]${subfigure === true ? `{${width}\\textwidth}` : ''}
  \\hspace{-${1.82 + 0.6 * hexlength}em}
  \\begin{minipage}{${subfigure === true ? 1 : width}\\textwidth}
  \\begin{bytefield}[leftcurly=., leftcurlyspace=0pt,bitwidth=${1/wordsize }\\textwidth]{${wordsize}}
    \\bitheader[endianness=big]{${bitheader.join(',')}} \\\\\n`
let bitcounter = 0;
// Align starts for multiword packages
let i = 0;
while (i < parts.length) {
  const part = parts[i];
  if (part.length < wordsize) {
    bitcounter += part.length;
    i++;
  } else {
    if (bitcounter % wordsize !== 0) {
      const startPart = Object.assign({}, part);
      if (part.length <= wordsize) {
        startPart.name += '\\ldots';
      } else {
        startPart.name = '';
      }
      startPart.length = wordsize - bitcounter % wordsize;
      startPart.borders = {l: true, r: true, t: true, b: false};
      delete part.footnote;
      part.length -= startPart.length;
      if (part.borders) {
        part.borders.t = false;
      } else {
        part.borders = {l: true, r: true, t: false, b: true};
      }
      parts.splice(i, 0, startPart);
      bitcounter += startPart.length;
      i++;
    } else {
      bitcounter += part.length;
      i++;
    }
  }
}
// Align end for multiword packages
i = 0;
bitcounter = 0;
while (i < parts.length) {
  const part = parts[i];
  if (part.length + (bitcounter % wordsize) <= wordsize) {
    bitcounter += part.length;
    i++;
  } else {
    if ((bitcounter + part.length) % wordsize !== 0) {
      const endPart = Object.assign({}, part);
      endPart.name = '';
      endPart.length = (bitcounter + part.length) % wordsize;
      endPart.borders = {l: true, r: true, t: false, b: true};
      part.length -= endPart.length;
      if (part.borders) {
        part.borders.b = false;
      } else {
        part.borders = {l: true, r: true, t: true, b: false};
      }
      parts.splice(i + 1, 0, endPart);
      bitcounter += part.length;
      i++;
    } else {
      bitcounter += part.length;
      i++;
    }
  }
}
if (bitcounter % wordsize !== 0) {
  parts.push({
    name: '',
    length: wordsize - bitcounter % wordsize
  });
}
bitcounter = 0;
for (const part of parts) {
  if (part.footnote) {
    part.name += `\\footnote{${part.footnote}}`;
  }
  if (bitcounter % wordsize === 0) {
    text += `    \\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}}\n`;
  }
  const wordPrevious = Math.floor(bitcounter / wordsize);
  if (Math.floor((bitcounter + part.length - 1) / wordsize) > wordPrevious) {
    let upperBorder = Object.assign({}, part.borders);
    upperBorder.b = false;
    let lowerBorder = Object.assign({}, part.borders);
    lowerBorder.t = false;
    let mediumBorder = {l: true, r: true, t: false, b: false};
    text += `      \\wordbox${bordersToString(upperBorder)}{1}{${part.name}}\n`;
    text += `    \\end{leftwordgroup}\\\\\n`;
    if (part.length / wordsize > 4) {
      text += `      \\skippedwords[1.5ex]\\\\\n`;
    } else if (part.length / wordsize > 2) {
      text += `      \\wordbox${bordersToString(mediumBorder)}{${part.length / wordsize - 2}}{}\\\\\n`;
    }
    text += `    \\begin{leftwordgroup}{\\texttt{0x${((bitcounter + part.length - wordsize)/8).toString(16).padStart(hexlength, '0')}}}\n`;
    text += `      \\wordbox${bordersToString(lowerBorder)}{1}{}\n`;
    bitcounter += part.length;
  } else {
    text += `      \\bitbox${bordersToString(part.borders)}{${part.length}}{${part.name}}\n`;
    bitcounter += part.length;
  }
  if (bitcounter % wordsize === 0) {
    text += `    \\end{leftwordgroup}\\\\\n`;
  }
}
const name = argv[2].replace(/.cson$/i, '').replace(/^.*\//i, '');
text += `  \\end{bytefield}
\\renewcommand*\\footnoterule{}

  \\end{minipage}
  \\caption{${caption}}
  \\label{fig:${name}}
\\end{${subfigure === true ? 'subfigure' : 'figure'}}\n`;
writeFileSync(argv[2].replace(/cson$/i, 'tex'), text);
