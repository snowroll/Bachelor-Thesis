#!/usr/bin/env node

'use strict';

const fs = require('fs');
const readline = require('readline');

require('colors');

const deobfuscator = require('./');

// run as a command line tool
//
// Usage:
//   node deobfuscator.js input [output]
//

let { argv } = process;

if (argv.length < 3) {
  const opt = {
    input: process.stdin,
    output: process.stdout
  };
  const rl = readline.createInterface(opt)
    .on('line', input => {
      try {
        console.log(deobfuscator.clean(input).green);
      } catch (ex) {
        if (ex.lineNumber && ex.column) {
          console.log(`Error: ${ex.description} at line ${ex.lineNumber}, col ${ex.column}`.red);
        }
      }

      rl.prompt();
    });

  rl.setPrompt('> ');
  rl.prompt();

} else {
  let src = argv[2], dst = argv[3];
  let code = fs.readFileSync(src).toString('utf8');

  if (dst)
    fs.writeFile(dst, code);
  else
    console.log(deobfuscator.clean(code).green);
}
