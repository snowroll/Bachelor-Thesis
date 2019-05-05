'use strict';

const esprima = require('esprima');
const Syntax = esprima.Syntax;
const ScopeChain = require('./scopechain');


class Util_Test{
    constructor(){
        this.symbols = new ScopeChain();
    }

    /**
     * 测试一个结点是否为静态变量
     * @param {} node 
     */
    isStatic(node){
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
    }

    /**
     * 将静态结点转换为最简
     * @param {*} node 
     */
    parseStatic(node){
        if(!node)
            return false;
        
        switch(node.type){
            case Syntax.Literal:{
                return node.value;
            }
            case Syntax.Identifier:{
                if(this.symbols.has(node.name)){
                    return this.symbols.get(node.name);
                }
            }

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
    }

    /**
     * 测试字符串是否是合法的Identifier
     * @param {*} name 
     */
    isValidIdentifier(name){
        try{
            let body = esprima.parse(name).body;
            return body.type == Syntax.ExpressionStatement &&
                body.expression.type == Syntax.Identifier && 
                body.expression.name == name;
        } catch(e){
            return false;
        }
    }

    /**
     * 测试call参数是否是常数
     * @param {*} node 
     */
    isStaticArguments(node){
        return node.type === Syntax.CallExpression && 
            node.arguments.every(isStatic);
    }

    /**
     * 将参赛列表转化为数组
     * @param {*} node 
     */
    parseArguments(node){
        return node.arguments.map(this.parseStatic);
    }

    /**
     * 将节点转换为AST
     * @param {*} code 
     */
    expression(code){
        return esprima.parse(code).body[0].expression;
    }
}

module.exports = Util_Test;  //作为第三方包，被其他文件引用
