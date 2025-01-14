'use strict'

class ScopeChain{
    constructor(){
        this.level = 0;
        this.scope = Object.create(null);
        this.global = Object.create(null);
        this.tmp_var = new Array();
    }

    /**
     *  进入一个作用域`
     */
    enter(){
        console.log("scope enter level: ", this.level, " scope: ", this.scope);
        this.level++;
        this.__parent__ = this.scope;
        this.scope = Object.create(null);
    }

    /**
     *  离开一个作用域
     */
    leave(){
        console.log("scope leave level: ", this.level, " scope: ", this.scope);
        if (--this.level > 0) {
            this.scope = this.__parent__;
        } else {
            this.level = 0;
            this.scope = this.global;
        }
    }

    /**
     * 在当前范围内设置一个变量的值
     */
    set(name, val){  //给对象的属性name 赋值为val
        this.scope[name] = val;
        // console.log("set", name, val);
    }

    /**
     * 获取一个变量的值
     */
    get(name){
        return this.scope[name];
    }

    /**
     * 判断当前域中是否包括某个变量
     */
    has(name){
        return name in this.scope;
    }
}

module.exports = ScopeChain;  //作为第三方包，被其他文件引用