// 'use strict';

const esprima = require('esprima');
const estraverse = require('estraverse');
const Syntax = esprima.Syntax;

const Constants = require('./constants');
const ScopeChain = require('./scopechain');
var util_test = require('./util_test');


//调试代码 ts
var fs = require('fs');
let escodegen = require('escodegen');

//base64编码转换  utils 
global.btoa = str => new Buffer(str.toString()).toString('base64');
global.atob = str => new Buffer(str, 'base64').toString();

//在节点中模拟窗口
global.window = global.window || global;

/**
 * 将词转换为AST
 */
const wrap = value => esprima.parse(JSON.stringify(value)).body[0].expression; 

//ES7 包含 polyfill
Array.prototype.includes = Array.prototype.includes || function(e){
    return this.indexOf(e) > -1;
};

/**
 * 几个辅助函数，scopechain
 * @param {*} ast 
 */
function createNewScope(node){  //判断是否进入一个新域
    return node.type === 'FunctionDeclaration' ||
           node.type === 'FunctionExpression' ||
           node.type === 'Program';
}

function Block_Statement(node){  //防止循环变量被简化
    return node.type === 'ForStatement';
}



/**
 * 简化代码  从AST转换为反混淆代码
 */
function simplify_func(ast){
    //变量
    let simplify = new util_test();

    // function Get_Symbols(){
    //     return simplify;
    // }

    ast = estraverse.replace(ast, {  //遍历顺序，先遍历节点的叶子节点，逐层回溯
        enter: function(node){  //遍历节点，深度搜索
            // console.log("enter node", node);
            if(createNewScope(node)){  //进入新的作用域
                // simplify.symbols.enter();
                // console.log("enter ", simplify.symbols);
            }
            if(Block_Statement(node)){  //进入For Statement 等临时变量区，
                simplify.symbols.tmp_var.push([]);
            }
            switch(node.type){
                case Syntax.ForStatement:  //记录会变的变量，不对其进行简化
                    if(node.init.type === "VariableDeclaration"){
                        var cur_block = simplify.symbols.tmp_var[simplify.symbols.tmp_var.length - 1];
                        cur_block.push(node.init.declarations.id.name);
                    }
                    else if(node.init.type === "AssignmentExpression"){
                        var cur_block = simplify.symbols.tmp_var[simplify.symbols.tmp_var.length - 1];
                        cur_block.push(node.init.left.name); 
                    }
                    break;
                case Syntax.VariableDeclarator:
                    console.log("variabledeclarator")
                    if(simplify.isStatic(node.init)){
                        let val = simplify.parseStatic(node.init);
                        simplify.symbols.set(node.id.name, val);
                    }
                    if(node.init.type === "FunctionExpression"){  //var f = function(x){}
                        let exec_func = escodegen.generate(node.init.body);
                        let param = []
                        for(let i = 0; i < node.init.params.length; i++){
                            param.push(node.init.params[i].name);
                        }
                        let tmp_func = new Function(param, exec_func);  
                        console.log("new function param ", param, " exec code ", exec_func);
                        simplify.symbols.set(node.id.name, tmp_func);
                    }
                    break;
                case Syntax.FunctionDeclaration:
                    
                    break;
                
                    case Syntax.AssignmentExpression:
                    console.log("assignment begin ", node.left, " end ");
                    if(simplify.isStatic(node.left) && node.operator === "="
                       && node.right.type === "FunctionExpression"){
                        let exec_func = escodegen.generate(node.right.body);
                        let param = []
                        for(let i = 0; i < node.right.params.length; i++){
                            param.push(node.right.params[i].name);
                        }
                        let tmp_func = new Function(param, exec_func);  
                        console.log("new function param ", param, " exec code ", exec_func);  //TODO  简化错误，导致函数错误
                        simplify.symbols.set(node.left.name, tmp_func);
                    }
                    if([node.left, node.right].every(e => simplify.isStatic(e))){
                        let left = simplify.parseStatic(node.left);
                        let right = simplify.parseStatic(node.right);
                        console.log("assignment", node.left, "=", left, node.right, "=", right);
                        
                        let results = {  
                            '=': right,
                            '+=': left + right,
                            '-=': left - right,
                            '*=': left * right,
                            '/=': left / right,
                            '%=': left % right
                        };

                        if(results.hasOwnProperty(node.operator)){
                            let val = results[node.operator];
                            if(val !== null){
                                let change = 0;
                                if(node.left.type === Syntax.MemberExpression){
                                    console.log('left type is memberexpression')
                                    let left_obj = simplify.parseStatic(node.left.object);
                                    let left_idx = simplify.parseStatic(node.left.property);
                                    console.log("obj is ", left_obj, "idx is", left_idx, node.left.property.type);
                                    left_obj[left_idx] = val;
                                    change = 1;
                                }
                                else{
                                    if(simplify.symbols.tmp_var.length !== 0){
                                        if(simplify.symbols.tmp_var[simplify.symbols.tmp_var.length-1].indexOf(node.left.name) === 0){

                                        }
                                        else{
                                            simplify.symbols.set(node.left.name, val);
                                            change = 1;
                                        }   
                                    }
                                    else{
                                        simplify.symbols.set(node.left.name, val);
                                            change = 1;
                                    }
                                }
                                if(change === 1){
                                    node.operator = '=';
                                    node.right = wrap(right);
                                    console.log("change done node is ", node);
                                }
                                // console.log("assignment result ", node)
                            }
                        }

                    }
                    break;
                    
                default:               
            }
        },
        leave: function(node){
            switch(node.type){
                case Syntax.FunctionDeclaration:
                    if(node.body.body[node.body.body.length-1].type === "ReturnStatement"){  //无参数的函数调用，反混淆
                        let func_string;
                        let exec_func = escodegen.generate(node.body);
                        let param = [];
                        for(let i = 0; i < node.params.length; i++)
                            param.push(node.params[i].name)
                        let tmp_func = new Function(param, exec_func);
                        // console.log('body code ', block_str);
                        let end_pos = exec_func.indexOf("return ");
                        func_string = exec_func.slice(1, end_pos);
                        let res_value = tmp_func(param);
                        console.log(res_value, "eval function value");
                        let arr_len = node.body.body.length;
                        var new_func = node.body.body.slice(arr_len - 1, arr_len);
                        node.body.body = new_func;
                        // node.body.body[0].type = "ReturnStatement";
                        node.body.body[0].argument.type = "Literal";
                        node.body.body[0].argument.value = res_value;
                        node.body.body[0].argument.raw = res_value;
                    
                        simplify.symbols.set(node.id.name, tmp_func);
                        // return wrap(node.id.name+"="+func_val);
                    }
                    else{
                        return null;
                    }
                    break;

                case Syntax.BinaryExpression:
                    // if([node.left, node.right].every(e => e.type == Syntax.Literal)){
                    console.log("here 1")
                    // console.log(simplify.isStatic(node.left), simplify.isStatic())
                    if([node.left, node.right].every(e => simplify.isStatic(e))){
                        console.log("here 2")
                        let left = simplify.parseStatic(node.left);
                        let right = simplify.parseStatic(node.right);
                        console.log("binary ", node.operator, left, right);
                        if(typeof(left) === "number" || typeof(left) === "string"){
                            node.left.type = "Literal";
                            node.left.value = left;
                        }
                        if(typeof(right) === "number" || typeof(right) === "string"){
                            node.right.type = "Literal";
                            node.right.value = right;
                        }
                        if(left === null || right === null){
                            return;
                        }
                        // let left = node.left.value;
                        // let right = node.right.value;
                        let results = {  //这里的实现有点蠢，为什么先把值算出来，再看是哪种操作符
                            '|': left | right,
                            '^': left ^ right,
                            '&': left & right,
                            // '==': left == right,
                            // '!=': left != right,
                            // '===': left === right,
                            // '!==': left !== right,
                            // '<': left < right,
                            // '>': left > right,
                            // '<=': left <= right,
                            // '>=': left >= right,
                            '<<': left << right,
                            '>>': left >> right,
                            '>>>': left >>> right,
                            '+': left + right,
                            '-': left - right,
                            '*': left * right,
                            '/': left / right,
                            '%': left % right
                        };

                        if (results.hasOwnProperty(node.operator)){
                            let val = results[node.operator];
                            console.log(node.operator, node.left, left, node.right, right, val, ' binary ');
                            return wrap(val);  //这步可以从语句生成ast，替换目前的ast节点
                        }
                    }
                    break;
                                    
                /*case Syntax.LogicalExpression:
                    if(node.left.type === Syntax.Literal && node.right.type === Syntax.Literal){
                        let left = node.left.value, right = node.right.value;
                        let results = {
                            '||': left || right,
                            '&&': left && right
                        };

                        if(results.hasOwnProperty(node.operator)){
                            let val = results[node.operator];
                            return wrap(val);
                        }
                    }
                    break;

                case Syntax.UnaryExpression:
                    if (node.argument.type === Syntax.Literal) {
                        let arg = node.argument.value;
                        let results = {
                            '+': +arg,
                            '-': -arg,
                            '~': ~arg,
                            '!': !arg,
                            'delete': false,
                            'void': undefined,
                            'typeof': typeof arg
                        };
          
                    if (results.hasOwnProperty(node.operator)) {
                        let val = results[node.operator];
                        return wrap(val);
                      }
                    }
                    break;*/

                case Syntax.CallExpression:  //系统自带函数的简化 tostring fromcharcode ......   TODO HERE
                    var exist = Constants.Functions.filter(function(item){
                        return item.indexOf('test') === -1;
                    });
                    if (node.callee.type === Syntax.Identifier &&  //计算Constants.Functions中的全局函数
                        Constants.Functions.indexOf(node.callee.name) > -1 &&
                        simplify.isStaticArguments(node)) {
          
                        let method = global[node.callee.name];
                        let val = method.apply(null, simplify.parseArguments(node));
                        return wrap(val);
                    }
                    
                    if (node.callee.type === Syntax.Identifier &&
                        node.callee.name === 'eval'){
                        let val = simplify.parseArguments(node);  //把eval的字符串输出
                        // 将eval转换为ast，再做处理
                        let tmp_ast = esprima.parseScript(val[0]);
                        // if(tmp_ast[0])
                        let tmp_symbols = simplify_func(tmp_ast);
                        for(var i in tmp_symbols[1].scope){
                            simplify.symbols.set(i, tmp_symbols[1].get(i))
                            console.log(i, tmp_symbols[1].get(i));
                        }
                        return esprima.parseScript(val[0]);
                    }

                    if (node.callee.type === Syntax.Identifier && 
                        simplify.symbols.has(node.callee.name)){
                        // console.log("here");
                        let callee_func = simplify.symbols.get(node.callee.name);
                        // console.log(callee_func(100));
                        let arg = [];
                        for(let i = 0; i < node.arguments.length; i++)
                            arg.push(node.arguments[i].value);
                        let callee_val = callee_func(arg);
                        return wrap(callee_val);
                    }

                    if (node.callee.type === Syntax.MemberExpression) {
                        let callee = node.callee;
                        if (callee.object.type === Syntax.Identifier &&  //String.join 等
                            Constants.Objects.hasOwnProperty(callee.object.name) &&
                            callee.property.type === Syntax.Identifier &&
                            Constants.Objects[callee.object.name].includes(callee.property.name) &&
                            simplify.isStaticArguments(node)) {
                            // console.log("here ?")
                            let method = global[callee.object.name][callee.property.name];
                            // console.log("method ",method, node);
                            // console.log(simplify.parseArguments(node));
                            if(simplify.parseArguments(node)[0] === null)
                                return;
                            let val = method.apply(null, simplify.parseArguments(node));
                            // console.log("here &&&&  ", val)
                            return wrap(val);
                        }
                        
                        if (callee.property.type === Syntax.Identifier) {
                            let calleeVal;
                            if (callee.object.type === Syntax.Literal) {
                                // number.toString(), 'string'.substr
                                calleeVal = callee.object.value;
                            } 
                            else if (simplify.isStatic(callee.object)) {  //这里没有细分 有问题  考虑是否有elements、objectname  
                                // ['a', 'r', 'r', 'a', 'y'].join
                                // console.log(node) 
                                if(callee.object.hasOwnProperty('elements'))
                                    calleeVal = callee.object.elements.map(e => e.value);
                                else{  
                                    if(simplify.symbols.has(callee.object.name))
                                        calleeVal = simplify.symbols.get(callee.object.name);
                                }
                                // console.log(calleeVal);
                            }
          
                            if (typeof calleeVal !== 'undefined') {
                                let calleeType = typeof calleeVal;
                                console.log(calleeType);
                                // holy Javascript
                                if (calleeType === 'object' && Array.isArray(calleeVal)) {
                                    calleeType = 'array';
                                }
                                if (Constants.Methods.hasOwnProperty(calleeType) &&
                                    Constants.Methods[calleeType].includes(callee.property.name) &&
                                    simplify.isStaticArguments(node)) {
                                    let method = calleeVal[callee.property.name];
                                    console.log(method);
            
                                    let val = method.apply(calleeVal, simplify.parseArguments(node));
                                    return wrap(val);
                                }
                            }
                        }
          
                    }
                    break;

                case Syntax.MemberExpression:
                    //'test'.length, /regexp/.source
                    if (!node.computed &&
                        node.property.type === Syntax.Identifier) {
            
                        if (node.object.type === Syntax.Literal) {
                            let objType = typeof node.object.value;
            
                            // RegExp
                            if (objType === 'object') {
                                objType = 'regex';
                            }
            
                            if (Constants.Properties.hasOwnProperty(objType) &&
                                Constants.Properties[objType].includes(node.property.name)) {
                                let val = node.object.value[node.property.name];
                                return wrap(val);
                            }
                        }
            
                    }
            
                    if (node.computed &&  //只有在操作符号那里改变节点，否则会有错误
                        simplify.symbols.has(node.object.name) &&
                        node.property.type === Syntax.Literal) {
                        let val = simplify.symbols.get(node.object.name)[node.property.value];
                        // if (typeof val === 'string')
                        //     return wrap(val);
                    }
            
                    // convert brackets to dot
                    if (node.property.type === Syntax.Literal &&
                        typeof node.property.value === 'string' &&
                        simplify.isValidIdentifier(node.property.value)) {
                        return {
                            type: Syntax.MemberExpression,
                            computed: false,
                            object: node.object,
                            property: {
                                type: Syntax.Identifier,
                                name: node.property.value
                            }
                        };
                    }
                    break;
                
                case Syntax.ExpressionStatement:
                    if(node.expression.hasOwnProperty('callee'))
                        if(simplify.symbols.has(node.expression.callee.name))
                            console.log(simplify.symbols.get(node.expression.callee.name));
                default:
            }
            if(createNewScope(node)){
                // simplify.symbols.leave();
                // console.log("leave ", simplify.symbols);
            }
            if(Block_Statement(node)){
                simplify.symbols.tmp_var.pop();
            }
        }
    });

    console.log(simplify.symbols);
    return [ast, simplify.symbols];
}

exports.simplify_func = simplify_func;

function convert_ast(code){
    return esprima.parse(code);
}
exports.convert_ast = convert_ast;

var filepath = process.argv[2];
var code = fs.readFileSync(filepath, 'utf8');
var _ast = esprima.parse(code);

var res_ast = simplify_func(_ast)[0];
var result = escodegen.generate(res_ast);
console.log(result);