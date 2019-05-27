var fs = require('fs');
var path = require('path');
var simplify = require('./simplifier')
const esprima = require('esprima');
const estraverse = require('estraverse');
const baseline = require('./BaseLine/jstiller.js')
let escodegen = require('escodegen');
//解析需要遍历的文件夹，我这以E盘根目录为例

var filePath = process.argv[2];

//调用文件遍历方法
fileDisplay(filePath);
var m = 1;
var t =1;

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

/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */
function fileDisplay(filePath){
    //根据文件路径读取文件，返回文件列表
    fs.readdir(filePath,function(err,files){
        if(err){
            console.warn(err)
        }else{
            //遍历读取到的文件列表
            files.forEach(function(filename){
                //获取当前文件的绝对路径
                var filedir = path.join(filePath,filename);
                //根据文件路径获取文件信息，返回一个fs.Stats对象
                fs.stat(filedir,function(eror,stats){
                    if(eror){
                        console.warn('获取文件stats失败');
                    }else{
                        var isFile = stats.isFile();//是文件
                        var isDir = stats.isDirectory();//是文件夹
                        if(isFile){
                            console.log(filedir)
                            var code = fs.readFileSync(filedir, 'utf8');
                            try{
                                var _ast = esprima.parse(code);
                                var res = simplify.simplify_func(_ast);
                                var res_ast = res[0];
                                var result = escodegen.generate(res_ast);
                                if(res[2] == false){
                                    // var ast = astFromCode(code, true)
                                    // baseline.init();
                                    // res_ast = baseline.deobfuscate(ast, null, true)
                                }
                                else{
                                    console.log("success ", filedir)
                                    var success_file = path.join('/Users/chaihj15/Desktop/DE-Success', filename)
                                    fs.writeFileSync(success_file, code)
                                    var res_dir = path.join('/Users/chaihj15/Desktop/DE-Result', filename)
                                    fs.writeFileSync(res_dir, result)
                                }
                                
                            }
                            catch(e){
                                console.log("error file")
                                // m+=1;
                                // console.log("error file sum", m)
                                // var result = code;
                            }
                            
                        }
                        if(isDir){
                            fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                        }
                    }
                })
            });
        }
    });
}
