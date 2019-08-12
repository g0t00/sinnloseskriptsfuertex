#!/usr/bin/env node
import {argv, exit} from 'process';
import {readFileSync, writeFileSync} from 'fs';
import * as CSON from 'cson';
interface IFile {
  wordsize: number;
  alignbits: number;
  caption: string;
  parts: {
    name: string;
    length: number;
    footnote?: string;
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

let {wordsize, parts, alignbits, caption}: IFile = CSON.parse(readFileSync(argv[2]).toString());
console.log(argv[2].replace('.cson', ''));
let bitheader = [];
for (let i = 0; i < wordsize; i += alignbits) {
  bitheader.push(i);
}
bitheader.push(wordsize - 1);
const length = parts.reduce((accum, part) => accum + part.length, 0);
const hexlength = Math.ceil(Math.log2(length/8) / Math.log2(16));
let footnoteCounter = 0;
let footnotes :string[] = [];
// console.log(hexlength);
let text = `\\begin{figure}[htp]
  \\hspace{-${1.82 + 0.6 * hexlength}em}
  \\begin{bytefield}[leftcurly=., leftcurlyspace=0pt,bitwidth=${1/wordsize}\\textwidth]{${wordsize}}
    \\bitheader[endianness=big]{${bitheader.join(',')}} \\\\\n`
let bitcounter = 0;
// Align starts for multiword packages
let i = 0;
while (i < parts.length) {
  // console.log(i);
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
      part.length -= startPart.length;
      if (part.borders) {
        part.borders.t = false;
      } else {
        part.borders = {l: true, r: true, t: false, b: true};
      }
      parts.splice(i, 0, startPart);
      bitcounter += startPart.length;
      i++;
      // console.log(parts, bitcounter);
      // exit();
    } else {
      bitcounter += part.length;
      i++;
    }
  }
}
// console.log(parts);
// Align end for multiword packages
i = 0;
bitcounter = 0;
while (i < parts.length) {
  // console.log(i);
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
      // part.name += '\\ldots';
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
    footnoteCounter++;
    part.name += '\\footnotemark{}'
    footnotes.push(part.footnote);
  }
  if (bitcounter % wordsize === 0) {
    if (part.length % wordsize === 0 && part.length !== wordsize) {
      if (part.length === 2 * wordsize) {
        text += `    \\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}\\\\[1ex]
    \\texttt{0x${((bitcounter + part.length - wordsize)/8).toString(16).padStart(hexlength, '0')}}}\n`;
      } else {
        text += `    \\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}\\\\
    \\texttt{\\hspace{${(hexlength + 1)/2}ex}\\vdots}\\\\
    \\texttt{0x${((bitcounter + part.length - wordsize)/8).toString(16).padStart(hexlength, '0')}}}\n`;
      }
    } else {
      text += `    \\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}}\n`;

    }
  }
  const wordPrevious = Math.floor(bitcounter / wordsize);
  if (Math.floor((bitcounter + part.length - 1) / wordsize) > wordPrevious) {
    if (bitcounter % wordsize === 0 && part.length % wordsize === 0) {
      if (part.length / wordsize > 4) {
        let upperBorder = Object.assign({}, part.borders);
        upperBorder.b = false;
        let lowerBorder = Object.assign({}, part.borders);
        lowerBorder.t = false;
        text += `      \\wordbox${bordersToString(upperBorder)}{1}{${part.name}}\\\\\n`;
        text += `      \\skippedwords[1.5ex]\\\\\n`;
        text += `      \\wordbox${bordersToString(lowerBorder)}{1}{}\n`;
      } else {
        text += `      \\wordbox${bordersToString(part.borders)}{${part.length / wordsize}}{${part.name}}\n`;
      }
      bitcounter += part.length;
    } else {
      const partlength = wordsize - bitcounter % wordsize
      text += `      \\bitbox${bordersToString(part.borders)}{${partlength}}{${part.name}}\n`;
      text += `    \\end{leftwordgroup} \\\\\n`;
      text += `    \\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}}\n`;
      text += `      \\bitbox${bordersToString(part.borders)}{${part.length - partlength}}{${part.name}}\n`;
      bitcounter += part.length - partlength;
    }
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
  \\caption{${caption}}
  \\label{fig:${name}}
\\end{figure}\n`;
if (footnoteCounter > 0) {
  text += `\\addtocounter{footnote}{-${footnoteCounter}}\n`
  for (const fn of footnotes) {
    text += `\\stepcounter{footnote}\\footnotetext{${fn}}\n`
  }
}
writeFileSync(argv[2].replace(/cson$/i, 'tex'), text);
// console.log(text);
