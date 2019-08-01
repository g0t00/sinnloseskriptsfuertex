import * as xlsx from 'xlsx';
import {argv} from 'process';
import {writeFileSync} from 'fs';
const file = xlsx.readFile(argv[2]);
debugger;
for (const sheetName of Object.keys(file.Sheets)) {
  const sheet = file.Sheets[sheetName];
  // console.log(sheet);
  // console.log(sheet['!merges']);
  const match = sheet["!ref"].match(/([a-z]+)(\d+):([a-z]+)(\d+)/i);
  if (!match) {
    continue;
  }
  const startCol = match[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const endCol = match[3].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
  const startRow = parseInt(match[2], 10) - 1;
  const endRow = parseInt(match[4], 10) - 1;
  const rows =  Array(endCol - startCol + 1).fill('c').join('|') ;
  let text = `\\begin{tabular}{ ${rows} }\n`;
  if (sheetName === 'AXILite') {
    console.log(sheet['!merges'], sheet["!ref"]);
  }
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const field = sheet[String.fromCharCode("A".charCodeAt(0) + col) + String(row + 1)];
      if (field) {
        const merge = sheet['!merges'] ? sheet['!merges'].find(merge => {
          return merge.s.r === row && merge.s.c === col;
        }) : null;
        if (merge) {
          text += `\\multirow{${merge.e.r - merge.s.r + 1}}{*}{${field.w}}`;
        } else {
          text += field.w;
        }
        // text += `R${row}C${col}`+String.fromCharCode("A".charCodeAt(0) + col) + String(row);
          // console.log(merge, sheetName);
      }
      if (col < endCol) {
        text += '&';
      }
    }
    const merge = sheet['!merges'] ? sheet['!merges'].find(merge => {
      return merge.s.r <= row && merge.e.r > row;
    }) : null;
    text += '\\\\\n';
    if (merge) {
    } else {
      text += '\\hline';
    }
    text += '\n';
  }
  text += `\\end{tabular}`;
  // console.log(text);
  writeFileSync(argv[2] + '.' + sheetName + '.tex', text);
}
// console.log(file)
