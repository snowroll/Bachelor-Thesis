/*
  From https://github.com/node-browser-compat/atob 
Copyright and license
Code copyright 2012-2015 AJ ONeal
Dual-licensed MIT and Apache-2.0
Docs copyright 2012-2015 AJ ONeal
Docs released under Creative Commons.

*/

"use strict";

function btoa(str) {  //utf8 ==> base64
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = new Buffer(str.toString(), 'binary');
  }

  return buffer.toString('base64');
}

/*
From https://github.com/node-browser-compat/atob
Copyright and license
Code and documentation copyright 2012-2014 AJ ONeal Tech, LLC.

Code released under the Apache license.

Docs released under Creative Commons.
*/
"use strict";
function atob(str) {  //base64 ==>  utf8
  return new Buffer(str, 'base64').toString('binary');
}

/* test case chaihj15 */
/*
var filedir = "/Users/chaihj15/Desktop/a.txt";
var fs = require("fs");
var code = fs.readFileSync(filedir, 'utf8');
var res = btoa(code);
console.log(res);
*/

module.exports = {btoa,atob};
