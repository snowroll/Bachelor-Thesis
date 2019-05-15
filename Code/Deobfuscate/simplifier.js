// 'use strict';

const esprima = require('esprima');
const estraverse = require('estraverse');
const Syntax = esprima.Syntax;

// const util = require('./util');
const Constants = require('./constants');
// const ScopeChain = require('./scopechain');
var util_test = require('./util_test');

//调试代码 ts
var fs = require('fs');
// var filepath = '/Users/chaihj15/Desktop/a.txt';
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
function createNewScope(node){  //进入函数时，创建域
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
function simplify(ast){
    //变量
    let simplify = new util_test();

    ast = estraverse.replace(ast, {  //遍历顺序，先遍历节点的叶子节点，逐层回溯
        enter: function(node){
            if(createNewScope(node)){  //进入新的作用域
                simplify.symbols.enter();
            }
            if(Block_Statement(node)){  //for 模块
                simplify.symbols.tmp_var.push([]);
            }
            switch(node.type){
                case Syntax.ForStatement:  //记录会变的变量，不对其进行简化
                    console.log("Forstatement ")
                    if(node.init.type === "VariableDeclaration"){
                        var cur_block = simplify.symbols.tmp_var[simplify.symbols.tmp_var.length - 1];
                        cur_block.push(node.init.declarations.id.name);
                    }
                    else if(node.init.type === "AssignmentExpression"){
                        var cur_block = simplify.symbols.tmp_var[simplify.symbols.tmp_var.length - 1];
                        cur_block.push(node.init.left.name);
                        console.log(simplify.symbols.tmp_var[simplify.symbols.tmp_var.length - 1], "cur_block"); 
                    }
                    break;

                
                
                default:               
            }
        },
        leave: function(node){
            if(createNewScope(node)){
                for(idx in simplify.symbols.scope){
                    console.log(idx, simplify.symbols.scope[idx]);
                }
                simplify.symbols.enter();
            }
            if(Block_Statement(node)){
                simplify.symbols.tmp_var.pop();
            }
            switch(node.type){
                case Syntax.FunctionDeclaration:
                    if(node.params.length === 0 && node.body.body[node.body.body.length-1].type === "ReturnStatement"){  //无参数的函数调用，反混淆
                        let func_string;
                        let block_str = escodegen.generate(node.body);
                        console.log('body code ', block_str);
                        let end_pos = block_str.indexOf("return ");
                        func_string = block_str.slice(1, end_pos);
                        var func_val = eval(func_string);
                        console.log(func_val, "eval function value");
                        let arr_len = node.body.body.length;
                        var new_func = node.body.body.slice(arr_len - 1, arr_len);
                        node.body.body = new_func;
                        // node.body.body[0].type = "ReturnStatement";
                        node.body.body[0].argument.type = "Literal";
                        node.body.body[0].argument.value = func_val;
                        node.body.body[0].argument.raw = func_val;
                    
                        simplify.symbols.set(node.id.name, func_val);
                        // return wrap(node.id.name+"="+func_val);
                    }
                    else{
                        return null;
                    }
                    break;

                case Syntax.VariableDeclarator:  //简化变量声明  TODO 有问题
                    if(simplify.isStatic(node.init)){
                        let val = simplify.parseStatic(node.init);
                        simplify.symbols.set(node.id.name, val);
                    }
                    break;
                
                case Syntax.AssignmentExpression:
                    console.log("assignment begin ", node.left, " end ");
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

                case Syntax.BinaryExpression:
                    // if([node.left, node.right].every(e => e.type == Syntax.Literal)){
                    if([node.left, node.right].every(e => simplify.isStatic(e))){
                        let left = simplify.parseStatic(node.left);
                        let right = simplify.parseStatic(node.right);
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
                        let val = simplify.parseArguments(node);
                        return esprima.parseScript(val[0]);
                    }

                    if (node.callee.type === Syntax.Identifier && 
                        simplify.symbols.has(node.callee.name)){
                        let val = simplify.symbols.get(node.callee.name);
                        return wrap(val);
                    }

                    if (node.callee.type === Syntax.MemberExpression) {
                        let callee = node.callee;
                        if (callee.object.type === Syntax.Identifier &&  //String.join 等
                            Constants.Objects.hasOwnProperty(callee.object.name) &&
                            callee.property.type === Syntax.Identifier &&
                            Constants.Objects[callee.object.name].includes(callee.property.name) &&
                            simplify.isStaticArguments(node)) {
            
                            let method = global[callee.object.name][callee.property.name];
                            let val = method.apply(null, simplify.parseArguments(node));
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
        }
    });

    console.log(simplify.symbols);
    return ast;
}

exports.simplify = simplify;

function convert_ast(code){
    return esprima.parse(code);
}
exports.convert_ast = convert_ast;

var filepath = process.argv[2];
var code = fs.readFileSync(filepath, 'utf8');
var _ast = esprima.parse(code);

var res_ast = simplify(_ast);
var result = escodegen.generate(res_ast);
console.log(result);