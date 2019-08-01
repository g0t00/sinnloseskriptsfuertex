import {argv} from 'process';
import {readFileSync} from 'fs';
import * as CSON from 'cson';
interface IFile {
  wordsize: number;
  alignbits: number;
  parts: {
    name: string;
    length: number;
  }[]
}
const {wordsize, parts, alignbits}: IFile = CSON.parse(readFileSync(argv[2]).toString());
console.log(wordsize, parts);
let bitheader = [];
for (let i = 0; i < wordsize; i += alignbits) {
  bitheader.push(i);
  // if ()
}
bitheader.push(wordsize - 1);
const length = parts.reduce((accum, part) => accum + part.length, 0);
const hexlength = Math.ceil(Math.log2(length/8) / Math.log2(16));
console.log(hexlength);
let text = `\\begin{bytefield}[leftcurly=., leftcurlyspace=0pt,bitwidth=${0.9/wordsize}\\textwidth]{${wordsize}}
\\bitheader[b]{${bitheader.join(',')}} \\\\\n`
let bitcounter = 0;
for (const part of parts) {
  if (bitcounter % wordsize === 0) {
    text += `\\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}}\n`;
  }
  const wordPrevious = Math.floor(bitcounter / wordsize);
  if (Math.floor((bitcounter + part.length) / wordsize) > wordPrevious) {
    const partlength = wordsize - bitcounter % wordsize
    text += `\\bitbox{${partlength}}{${part.name}}\n`;
    bitcounter += partlength;
    text += `\\end{leftwordgroup} \\\\\n`;
    text += `\\begin{leftwordgroup}{\\texttt{0x${(bitcounter/8).toString(16).padStart(hexlength, '0')}}}\n`;
    text += `\\bitbox{${part.length - partlength}}{${part.name}}\n`;
  } else {
    text += `\\bitbox{${part.length}}{${part.name}}\n`;
    bitcounter += part.length;
  }
  if (bitcounter % wordsize === 0) {
    text += `\\end{leftwordgroup} \\\\\n`;
  }
}
text += `\\end{bytefield}`;
console.log(text);
