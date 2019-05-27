var fs = require('fs');
var path = require('path');
var simplify = require('./simplifier')
const esprima = require('esprima');
const estraverse = require('estraverse');
const baseline = require('./BaseLine/jstiller.js')
let escodegen = require('escodegen');
//解析需要遍历的文件夹，我这以E盘根目录为例

var filePath = process.argv[2];

function astFromCode(code, loc, obj) {
    var LOC = loc || false;
    var opts = {
      loc: LOC,
      locations: LOC
    };
    if (obj) {
      for (var i in obj) {
        opts[i] = obj[i];
      }
    }
    var ast = esprima.parse(code + '', opts);
    return ast;
}

let domain = require('domain')
let d = domain.create()
d.on('error', function (e) {
    // /*处理异常*/
    console.log("??????????????")
})




/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */
function fileDisplay(filedir){
    //根据文件路径读取文件，返回文件列表
                //根据文件路径获取文件信息，返回一个fs.Stats对象
    fs.stat(filedir,function(eror,stats){
        if(eror){
            console.warn('获取文件stats失败');
        }else{
            var isFile = stats.isFile();//是文件
            if(isFile){
                console.log(filedir)
                var code = fs.readFileSync(filedir, 'utf8');
                try{
                    var _ast = esprima.parse(code);
                    var res = simplify.simplify_func(_ast);
                    var res_ast = res[0];
                    if(res[2] == false){
                        var ast = astFromCode(code, true)
                        baseline.init();
                        d.run(baseline.deobfuscate(ast, null, true))
                        
                        
                    }
                    var result = escodegen.generate(res_ast);
                }
                catch(e){
                    m+=1;
                    console.log("error file sum", m)
                    var result = code;
                }
                console.log(result)
                // var res_dir = path.join('/Users/chaihj15/Desktop/DE-Result', filename)
                // fs.writeFileSync(res_dir, result)
            }
        }
    })
}

fileDisplay(filePath);
