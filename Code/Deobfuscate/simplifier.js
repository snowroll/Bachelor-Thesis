'use strict';

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
 * 简化代码  从AST转换为反混淆代码
 */
function simplify(ast){
    //变量
    let simplify = new util_test();

    ast = estraverse.replace(ast, {
        leave: function(node){
            switch(node.type){
                case Syntax.VariableDeclarator:
                    if(simplify.isStatic(node.init)){
                        //TODO 如何把symbol传进去
                        let val = simplify.parseStatic(node.init);
                        // console.log(node.id, val);
                        simplify.symbols.set(node.id.name, val);
                    }
                    break;

                case Syntax.BinaryExpression:
                    // if([node.left, node.right].every(e => e.type == Syntax.Literal)){
                    if([node.left, node.right].every(e => simplify.isStatic(e))){
                        let left = simplify.parseStatic(node.left);
                        let right = simplify.parseStatic(node.right);
                        // let left = node.left.value;
                        // let right = node.right.value;
                        let results = {  //这里的实现有点蠢，为什么先把值算出来，再看是哪种操作符
                            '|': left | right,
                            '^': left ^ right,
                            '&': left & right,
                            '==': left == right,
                            '!=': left != right,
                            '===': left === right,
                            '!==': left !== right,
                            '<': left < right,
                            '>': left > right,
                            '<=': left <= right,
                            '>=': left >= right,
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
                            console.log(node.right, val);
                            return wrap(val);  //这步可以从语句生成ast，替换目前的ast节点
                        }
                    }
                    break;
                
                case Syntax.AssignmentExpression:
                    if([node.left, node.right].every(e => simplify.isStatic(e))){
                        let left = simplify.parseStatic(node.left);
                        let right = simplify.parseStatic(node.right);
                        
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

                            if(node.left.type === Syntax.MemberExpression){
                                let left_obj = simplify.parseStatic(node.left.object);
                                let left_idx = simplify.parseStatic(node.left.property);
                                left_obj[left_idx] = val;
                            }
                            else{
                                simplify.symbols.set(node.left.name, val);
                            }
                            
                            console.log(node.right);
                            node.operator = '=';
                            node.right.type = 'Literal';
                            node.right.value = val;
                            node.right.raw = "1";
                        }

                    }
                    break;
                    
                case Syntax.LogicalExpression:
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
                    break;

                case Syntax.CallExpression:  //系统自带函数的简化 tostring fromcharcode ......
                    if (node.callee.type === Syntax.Identifier &&  //这里可以把eval改成console.log
                        Constants.Functions.includes(node.callee.name) &&
                        simplify.isStaticArguments(node)) {
          
                        let method = global[node.callee.name];
                        let val = method.apply(null, simplify.parseArguments(node));
                        return wrap(val);
                    }
          
                    if (node.callee.type === Syntax.MemberExpression) {
                        let callee = node.callee;
          
                        if (callee.object.type === Syntax.Identifier &&
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
                            } else if (util.isStatic(callee.object)) {
                                // ['a', 'r', 'r', 'a', 'y'].join
                                calleeVal = callee.object.elements.map(e => e.value);
                            }
          
                            if (typeof calleeVal !== 'undefined') {
                                let calleeType = typeof calleeVal;
                                // holy Javascript
                                if (calleeType === 'object' && Array.isArray(calleeVal)) {
                                    calleeType = 'array';
                                }
                                if (Constants.Methods.hasOwnProperty(calleeType) &&
                                    Constants.Methods[calleeType].includes(callee.property.name) &&
                                    simplify.isStaticArguments(node)) {
                                    let method = calleeVal[callee.property.name];
            
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
            
                    if (node.computed &&
                        simplify.symbols.has(node.object.name) &&
                        node.property.type === Syntax.Literal) {
                        let val = simplify.symbols.get(node.object.name)[node.property.value];
                        if (typeof val === 'string')
                            return wrap(val);
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