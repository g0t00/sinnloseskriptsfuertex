import {argv} from 'process';
import {readFileSync, writeFileSync} from 'fs';
import * as CSON from 'cson';
interface IFile {
  wordsize: number;
  alignbits: number;
  caption: string;
  parts: {
    name: string;
    length: number;
  }[]
}
const {wordsize, parts, alignbits, caption}: IFile = CSON.parse(readFileSync(argv[2]).toString());
console.log(wordsize, parts);
let bitheader = [];
for (let i = 0; i < wordsize; i += alignbits) {
  bitheader.push(i);
  // if ()
}
// \begin{figure}[h]
// \hspace{-2.42em}
// \input{../generated/bytefields/BTH.tex}
// \caption{\glsxtrfull{BTH}}
// \label{fig:BTH}
// \end{figure}
bitheader.push(wordsize - 1);
const length = parts.reduce((accum, part) => accum + part.length, 0);
const hexlength = Math.ceil(Math.log2(length/8) / Math.log2(16));
console.log(hexlength);
let text = `\\begin{figure}[h]
  \\hspace{-2.42em}
  \\begin{bytefield}[leftcurly=., leftcurlyspace=0pt,bitwidth=${1/wordsize}\\textwidth]{${wordsize}}
    \\bitheader[b]{${bitheader.join(',')}} \\\\\n`
let bitcounter = 0;
for (const part of parts) {
  if (bitcounter % wordsize === 0) {
    text += `    \\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}}\n`;
  }
  const wordPrevious = Math.floor(bitcounter / wordsize);
  if (Math.floor((bitcounter + part.length - 1) / wordsize) > wordPrevious) {
    const partlength = wordsize - bitcounter % wordsize
    text += `      \\bitbox{${partlength}}{${part.name}}\n`;
    bitcounter += partlength;
    text += `    \\end{leftwordgroup} \\\\\n`;
    text += `    \\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}}\n`;
    text += `      \\bitbox{${part.length - partlength}}{${part.name}}\n`;
  } else {
    text += `      \\bitbox{${part.length}}{${part.name}}\n`;
    bitcounter += part.length;
  }
  if (bitcounter % wordsize === 0) {
    text += `    \\end{leftwordgroup} \\\\\n`;
  }
}
const name = argv[2].replace(/.cson$/i, '');
text += `  \\end{bytefield}
  \\caption{${caption}}
  \\label{fig:${name}}
\\end{figure}`;
writeFileSync(argv[2].replace(/cson$/i, 'tex'), text);
console.log(text);
