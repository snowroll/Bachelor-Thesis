//2019/04/24
//chaihj
//服务器端js代码

const esprima = require('esprima');
const escodegen = require('escodegen');

//服务器的表达式
var bodyParser = require('body-parser');
var compression = require('compression');
var express = require('express');
var fs = require("fs");
var app = express();

//反混淆工具
var deob_1 = require('etacsufbo');

const server_config = require("./server_config.json");
const PORT = server_config.port;

//服务器静态ui
//通过express.static访问静态文件，这里访问index.html
app.use('/', express.static(__dirname + server_config.static_html));  
console.log(__dirname + server_config.static_html);
app.use(compression());
app.use(bodyParser.json({
    type: "application/json"
}));
//for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true}));

function isOriginAllowed(origin) { 
    return ALLOWED_ORIGIN_REGEXP.test(origin);
}
  
// Set CORS Headers if allowed
app.all('/', function(req, res, next) {
    if (isOriginAllowed(req.headers.origin)) {
        res.header("Access-Control-Allow-Origin", req.headers.origin);
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    next();
});

//反混淆api
//参数 {source: "code"}  结果 {source: "de_code"}

app.post("/test", function(req, res){
    // console.log(JSON.stringify(req.body));
    var json_obj = req.body;
    var ori_code = json_obj.code;

    console.log(typeof(json_obj.code));

    console.log(ori_code);
    var de_code;
    try{
        de_code = deob_1.clean(ori_code);
    }
    catch(err){
        de_code = "can not deobfuscate the code";
    }
    console.log(de_code);
    
    // var json = JSON.parse(req.body);
    // console.log(json);
    //这里返回结果
    // var text = {"code": origin_code};
    // res.send(req.body);  
    res.json({ message: de_code });
});

app.listen(PORT, function() {
    console.log(`Visit http://localhost:${PORT}`);
});
  



