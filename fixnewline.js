#!/usr/bin/env node
const {argv} = require('process');
const {readFileSync, writeFileSync} = require('fs');
let text = readFileSync(argv[2], {encoding: 'utf8'});
// console.log(text);
let i = 0;
let quote = false;
while(i < text.length) {
  if (text[i] === '"') {
    quote = !quote;
  } else if (quote) {
    if (text[i] === '\n') {
    // console.log(i, quote);
      text = text.substr(0, i) + ' ' + text.substr(i + 1);
    } else if (text[i] === ',') {
      text = text.substr(0, i) + ';' + text.substr(i + 1);

    }
  }
  i++;
}
// console.log(text);
writeFileSync(argv[2], text);
