"use strict";
exports.__esModule = true;
var xlsx = require("xlsx");
var process_1 = require("process");
var fs_1 = require("fs");
var file = xlsx.readFile(process_1.argv[2]);
debugger;
for (var _i = 0, _a = Object.keys(file.Sheets); _i < _a.length; _i++) {
    var sheetName = _a[_i];
    var sheet = file.Sheets[sheetName];
    // console.log(sheet);
    // console.log(sheet['!merges']);
    var match = sheet["!ref"].match(/([a-z]+)(\d+):([a-z]+)(\d+)/i);
    if (!match) {
        continue;
    }
    var startCol = match[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
    var endCol = match[3].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
    var startRow = parseInt(match[2], 10) - 1;
    var endRow = parseInt(match[4], 10) - 1;
    var rows = Array(endCol - startCol + 1).fill('c').join('|');
    var text = "\\begin{tabular}{ " + rows + " }\n";
    if (sheetName === 'AXILite') {
        console.log(sheet['!merges'], sheet["!ref"]);
    }
    var _loop_1 = function (row) {
        var _loop_2 = function (col) {
            var field = sheet[String.fromCharCode("A".charCodeAt(0) + col) + String(row + 1)];
            if (field) {
                var merge_1 = sheet['!merges'] ? sheet['!merges'].find(function (merge) {
                    return merge.s.r === row && merge.s.c === col;
                }) : null;
                if (merge_1) {
                    text += "\\multirow{" + (merge_1.e.r - merge_1.s.r + 1) + "}{*}{" + field.w + "}";
                }
                else {
                    text += field.w;
                }
                // text += `R${row}C${col}`+String.fromCharCode("A".charCodeAt(0) + col) + String(row);
                // console.log(merge, sheetName);
            }
            if (col < endCol) {
                text += '&';
            }
        };
        for (var col = startCol; col <= endCol; col++) {
            _loop_2(col);
        }
        var merge = sheet['!merges'] ? sheet['!merges'].find(function (merge) {
            return merge.s.r <= row && merge.e.r > row;
        }) : null;
        text += '\\\\\n';
        if (merge) {
        }
        else {
            text += '\\hline';
        }
        text += '\n';
    };
    for (var row = startRow; row <= endRow; row++) {
        _loop_1(row);
    }
    text += "\\end{tabular}";
    // console.log(text);
    fs_1.writeFileSync(process_1.argv[2] + '.' + sheetName + '.tex', text);
}
// console.log(file)
