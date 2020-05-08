var https =require('https');
var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');           //类似jquery

const imgStartUrl = 'https://mh2.zhengdongwuye.cn/upload/meishidefulu/';      //图片的前缀url

//建议开始时先测试下， 下载集数不要太多
const partStart = 1;          //开始集数
const partEnd = 5;            //结束集数
const partInterval = 2000;      //每集下载时的间隔(避免并发大导致服务中断) 2000表示每2s下一集

var wzUrl = 'https://www.tohomh123.com/meishidefulu/';      //列表页（网站分集列表页）
getPages(wzUrl, function(json){
    console.log('program start');
    var timer = '';
    var count = partStart;
    timer = setInterval(function(){
        var fileName = json[count]['name'];                 //文件名
        fs.mkdir('./image/' + count, function(){});
        var nowjsPage = parseInt(json[count]['page']);
        for(let k = 0; k < nowjsPage; k++){
            if(k < 10){
                k = '0' + k;
            }
            let imgUrl = imgStartUrl + count + '/' + '00'+ k + '.jpg';
            let imgName = '00'+k;
            saveImg(imgUrl, count, imgName);
        }

        count++;
        if(count > partEnd){
            clearInterval(timer);
        }
    }, partInterval);
});


//下载图片
function saveImg(url, imgFileFolder, imgName){
    https.get(url, (res)=>{
        var imgData = "";
        res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
        res.on("data", function(chunk){
            imgData+=chunk;
        });
        res.on("end", function(){
            if(imgData){
                fs.writeFile("./image/" + imgFileFolder + '/' + imgName + '.jpg', imgData, "binary", function(err){
                    if(err){
                        console.log("down fail");
                    }else{
                        console.log("down success", url);
                    }
                });
            }else{
                console.log('失败');
            }
        });
    })
}
//获取集数与页数
function getPages(url, callback){
    https.get(url, (res)=>{
        var imgData = "";
        res.on("data", function(chunk){
            imgData+=chunk;
        });
        
        res.on("end", function(){
            var $ = cheerio.load(imgData);

            var list = $($('.detail-list-select')[0]).find('li');       //查询dom方法
            var json = {};
            var fileNameStr = '';
            $(list).each(function(k, v){
                var src = $(v).find('a').prop('href');
                var nowjs = src.split('/')[2].split('.')[0];        //集数
                var name = $(v).find('a').text();                   //名称

                fileNameStr += (name + '\n');

                var spanHtml = $(v).find('a').find('span').text();
                var page =  spanHtml.substr((spanHtml.indexOf('（') + 1), spanHtml.indexOf('P') - 1); //页数
                json[nowjs-1] = {
                    page: page,
                    name: name
                };
            });
            fs.writeFile('./image/集数名称.txt', fileNameStr, 'utf-8', function(){});
            callback(json);
        });
    })
}