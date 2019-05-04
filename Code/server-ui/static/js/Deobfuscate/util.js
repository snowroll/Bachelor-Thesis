'use strict';

const esprima = require('esprima');
const Syntax = esprima.Syntax;
const ScopeChain = require('./scopechain');

// const estraverse = require('estraverse');
// const escodegen = require('escodegen');
// var fs = require('fs');
// var path = require('path');
// var filePath = '/Users/chaihj15/Desktop/a.txt';  //解析需要遍历的文件夹
// var gscope ={}

/**
 * 测试一个数组中是否包含静态词
 */

const isStatic = exports.isStatic = function(node){  //exports 模块公开接口
    if (!node)
        return false;

    switch (node.type){
        case Syntax.Literal:
            return true;
        case Syntax.Identifier:
            return true;
        case Syntax.ArrayExpression:
            return node.elements.every(isStatic);
        case Syntax.ObjectExpression:
            return node.properties.every(
                property => isStatic(property.value) && [Syntax.Literal, Syntax.Identifier]
                .indexOf(property.key.type) > -1);
        default:
            return false;
    }
};


/**
 * 转换表达式
 */

const parseStatic = exports.parseStatic = function(node){
    if(!node)
        return false;
    // if(symbols.type != ScopeChain)
    //     return false;
    switch(node.type){
        case Syntax.Literal:{
            // console.log(node);
            return node.value;
        }
        /*case Syntax.Identifier:{
            if(symbols.has(node.name)){
                return symbols.get(node.name);
            }
            // if(!(node.name in gscope))
            //     gscope[node.name] = 1;
            // else{
            //     node.type = "Literal";
            //     node.value = 1;
            //     // console.log(gscope[node.name] + ' test');
            //     // return gscope[node.name];
            // }
            // console.log('it is an id');
            // console.log(node);
            // console.log(esprima.parse(node.name).body);
            return null;
        }*/

        case Syntax.ArrayExpression:{
            // console.log(node.elements.map(parseStatic));
            return node.elements.map(parseStatic);
        }
        case Syntax.ObjectExpression:
            let obj = {};
            node.properties.forEach(property => obj[property.key.name ||
                property.key.value] = parseStatic(property.value));
            return obj;
        default:
            return null;
    }
};

/**
 * 测试字符串是否是合法的Identifier
 */
exports.isValidIdentifier = name => {
    try{
        let body = esprima.parse(name).body;
        return body.type == Syntax.ExpressionStatement &&
            body.expression.type == Syntax.Identifier && 
            body.expression.name == name;
    } catch(e){
        return false;
    }
};

/**
 * 测试call参数是否是常数
 */
exports.isStaticArguments = node =>
    node.type === Syntax.CallExpression && 
    node.arguments.every(isStatic);

/**
 * 将参赛列表转化为数组
 */
exports.parseArguments = node =>
    node.arguments.map(parseStatic);


/**
 * 将节点转换为AST
 */
exports.expression = code =>
    esprima.parse(code).body[0].expression;

/*    
var code = fs.readFileSync(filePath, 'utf-8');
var ast = esprima.parse(code);
// console.log(ast.body);
estraverse.replace(ast, {
    enter: function(node){
        console.log("node " + node.type);
        parseStatic(node);
    }        
});
// console.log(ast);
var _code = escodegen.generate(ast);
console.log(_code);
*/