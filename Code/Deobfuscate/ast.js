// author: chaihj15
// date: 2019/03/13
// funcition: JS 的 初步识别 和 ast变换

var fs = require("fs");  //文件夹读取文件
var path = require('path');

let esprima = require('esprima');  //ast分析和合成
let estraverse = require('estraverse');
let escodegen = require('escodegen');

var filePath = path.resolve('/Users/chaihj15/Desktop/Data/train_data')  //解析需要遍历的文件夹
var savePath = '/Users/chaihj15/Desktop/Data/test_data/ast_train/'


//调用文件遍历方法
// fileDisplay(filePath, savePath)

/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */

function fileDisplay(filePath, savePath){
    //根据文件路径读取文件，返回文件列表
    // var failed_files = [];
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
                        if(isFile){  // 对代码进行ast 语法分析，重构转换
                            // console.log(filedir);
                            var code = fs.readFileSync(filedir, 'utf8');
                            var re_code = ast(code);
                            if(re_code == null){
                                console.log(filename + ' - failed');
                                fs.writeFile('failed_file_train.txt', filename, { flag: 'a+' }, function(err){
                                    if(err){
                                        return console.error(err);
                                    }
                                });
                                // failed_files.push(filename);
                            }
                            else{
                                fs.writeFile(savePath + filename, re_code,  function(err) {
                                    //console.log(re_code)
                                    if (err) {
                                        return console.error(err);
                                    }
                                 });
                                 console.log(filename + ' - success');
                            }
                            // console.log(result);
                            
                        }
                        if(isDir){
                            fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                        }
                    }
                })
            });
        }
    });
    // console.log(failed_files)
}


function ast(code) {
    try{
        var ast_code = esprima.parse(code);
        var result = escodegen.generate(ast_code)
        // console.log(result);
        return result;
    }
    catch(e){
        // console.log("failed");
        return null;
    }
}




// 单个文件执行ast变换
var signle_file = '/Users/chaihj15/Desktop/Data/test_data/black_data/2041_black.txt';
var code = fs.readFileSync(signle_file, "utf8");
console.log(code)

// console.log("读取完毕")
let _ast = esprima.parse(code);
// let result = escodegen.generate(ast)
console.log(_ast);

