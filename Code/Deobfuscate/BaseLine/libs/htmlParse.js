var cheerio = require('cheerio');
function collectHTMLData(val) {
  var $ = cheerio.load(val);
  var retObj = {};
  retObj.code = [];
  $("script").each(function(i, elem) {
    retObj.code[i] = $(this).text();
  });

  retObj.code = retObj.code.join('\n');
  retObj.src = ($("*[src]").attr("src"))
  return retObj;
}
// console.log(collectHTMLData ("<script>var t = 1;</script>"))
exports.collectHTMLData = collectHTMLData
