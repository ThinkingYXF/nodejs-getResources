var https =require('https');
var fs = require('fs');

const imgStartUrl = 'https://m-tohomh123-com.mipcdn.com/i/mh1.zhengdongwuye.cn/upload/guanlangaoshouqingxiban/';

//读取错误文件中的 url列表
fs.readFile('./image/errPages.txt', 'utf-8', function(err, data){
    if(err){
        console.log(err);
    }else{
        var result = data.split('\n');
        console.log(result);
        (function(){
            var k = 0;
            var timer1 = setInterval(function(){
                if(result[k]){
                    var strArr = result[k].split('/');
                    var jishu = strArr[strArr.length-2];
                    var nowJS = strArr[strArr.length-1].substr(1);
                    
                    let imgUrl = imgStartUrl + jishu + '/' + '0'+ nowJS;
                    let imgName = nowJS;
                    saveImg(imgUrl, jishu, imgName);
                }
                
    
                k++;
                if(k == result.length){
                    clearInterval(timer1);
                }
            }, 200);
        })();
    }
});

var errStr = '';
function saveImg(url, imgFileFolder, imgName){
    https.get(url, (res)=>{
        var imgData = "";
        res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
        res.on("data", function(chunk){
            imgData+=chunk;
        });
        res.on("end", function(){
            if(imgData){
                fs.writeFile("./image/" + imgFileFolder + '/' + imgName, imgData, "binary", function(err){
                    if(err){
                        console.log("down fail", url);
                    }else{
                        console.log("down success", url);
                    }
                });
            }else{
                console.log('失败', url);
                errStr += (url + '\n');
                fs.writeFile('./image/errPages1.txt', errStr, 'utf-8', function(){});
            }
        });
    })
}