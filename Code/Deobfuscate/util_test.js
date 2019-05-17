// 'use strict';

const esprima = require('esprima');
const Syntax = esprima.Syntax;
const ScopeChain = require('./scopechain');

var symbols = new ScopeChain();
/**
 * 测试一个结点是否为静态变量
 * @param {} node 
 */
function Static(node){
    if (!node)
        return false;

    switch (node.type){
        case Syntax.Literal:
            return true;
        case Syntax.Identifier:
            return true;
        case Syntax.NewExpression:
            return true;
        case Syntax.MemberExpression:  // var m = t[0] + t[1];
            return Static(node.object) && Static(node.property);
        case Syntax.ArrayExpression:
            return node.elements.every(Static);
        case Syntax.ObjectExpression:
            return node.properties.every(
                property => Static(property.value) && [Syntax.Literal, Syntax.Identifier]
                .indexOf(property.key.type) > -1);
        case Syntax.BinaryExpression:
            // console.log("static is ?", Static(node.left) && Static(node.right));
            return Static(node.left) && Static(node.right);
        default:
            return false;
    }
}

class Util_Test{
    constructor(){
        this.symbols = new ScopeChain();
    }

    /**
     * 测试一个结点是否为静态变量
     * @param {} node 
     */
    isStatic(node){
        return Static(node);
    }

    /**
     * 将静态结点转换为最简
     * @param {*} node 
     */
    parseStatic(node){
        if(!node)
            return false;
        
        switch(node.type){
            case Syntax.Literal:{  //这步没问题
                return node.value;
            }

            case Syntax.NewExpression:{  //暂时ok
                console.log("NewExpression");
                var empty = false;
                if(node.arguments.length === 0)
                    empty = true;
                if(!empty)
                    var argument_list = node.arguments.map(this.parseStatic);
                
                switch(node.callee.name){
                    case 'Array':{
                        if(!empty){
                            if(argument_list.length === 1)
                                return new Array(argument_list[0]);
                            else
                                return argument_list;
                        }
                        else 
                            return new Array();
                    }
                    case 'String':{
                        if(!empty)
                            return new String(argument_list[0]);
                        else
                            return new String();
                    }
                    case 'Boolean':{
                        if(!empty)
                            return new Boolean(argument_list[0]);
                        else
                            return new Boolean();
                    }
                    case 'Date':{
                        if(argument_list.length === 1)
                            return new Date(argument_list[0]);
                        else
                            return new Date();  //这里简化处理
                    }
                    case 'Number':{
                        if(empty)
                            return new Number();
                        else
                            return new Number(argument_list[0]);
                    }
                    case 'RegExp':{
                        if(empty)
                            return new RegExp();
                        else
                            return new RegExp(argument_list[0]);
                    }

                    default:{
                        return null;
                    }
                }
            }

            case Syntax.Identifier:{  //是标识符的，均返回值
                console.log("Identifier");
                if(this.symbols.has(node.name)){
                    return this.symbols.get(node.name);
                }
                return null;
            }

            case Syntax.ArrayExpression:{
                console.log("ArrayExpression")
                // console.log(node.elements.map(parseStatic));
                return node.elements.map(this.parseStatic);
            }
            case Syntax.ObjectExpression:
                console.log("ObjectExpression")
                let obj = {};
                node.properties.forEach(property => obj[property.key.name ||
                    property.key.value] = this.parseStatic(property.value));
                return obj;
            
            case Syntax.MemberExpression:{  //这里可以由simplifier中的解决，
                console.log("MemberExpression")
                let _obj = this.parseStatic(node.object);
                let _idx = this.parseStatic(node.property);

                if(typeof(_obj) === 'object' && (typeof(_idx) === 'number' || typeof(_idx) === 'string')){
                    return _obj[_idx];
                }
                return null;
            }

            //测试解决赋值问题
            case Syntax.BinaryExpression:{
                console.log("BinaryExpression", this.isStatic(node.left), this.isStatic(node.right));
                if([node.left, node.right].every(e => this.isStatic(e))){
                    let left = this.parseStatic(node.left);
                    let right = this.parseStatic(node.right);
                    console.log("binary ", node.operator, "res", left, right);
                    
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
                        return val;  //这步可以从语句生成ast，替换目前的ast节点
                    }
                    return null;
                }
                return null;
            }
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
            node.arguments.every(this.isStatic);
    }

    /**
     * 将参赛列表转化为数组
     * @param {*} node 
     */
    parseArguments(node){
        // return this.parseStatic(node.arguments[0]);
        return node.arguments.map(x => this.parseStatic(x));
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
