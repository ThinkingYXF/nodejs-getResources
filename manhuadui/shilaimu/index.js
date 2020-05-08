//关于我转生为史莱姆这件事
//列表地址  https://www.manhuadui.com/manhua/guanyuwozhuanshenghouchengweishilaimudenajianshi/

var https =require('https');
var fs = require('fs');
var cheerio = require('cheerio');           //类似jquery

const preUrl = 'https://www.manhuadui.com';
const listUrl = 'https://www.manhuadui.com/manhua/guanyuwozhuanshenghouchengweishilaimudenajianshi/';
const imgPreUrl = 'https://img01.eshanyao.com/';    //适用于55话以后  后续不用此前缀

const start = 0;    //开始集数    0代表第1话
const end = 71;     //结束集数


//加密方法
var CryptoJS = require('../crypto');

getInfoList().then(function(list){
    fs.mkdir('./image', function(){});

    let k = start;
    download(k);
    //递归下载
    function download(count){
        getPageAndImg(list[count]).then(function(){
        k++;
        if(k < end){
            download(k);
        }
        });
    }
});


//获取集数信息与链接 title href
function getInfoList(){
  return new Promise(function(resolve){
    getUrlDom(listUrl).then((obj)=>{
      //查询集数 和 每一集的链接
      var list = obj['$']('.zj_list_con').find('ul li');
      let jishuList = [];
      for(let i=0;i<list.length;i++){
        let info = {
          title: obj['$'](list).eq(i).find('span.list_con_zj').text(),
          href: obj['$'](list).eq(i).find('a').prop('href')
        }
        jishuList.push(info);
      }  
      resolve(jishuList);
    });
  });
}

//获取当前集数的页数与当前页的图片链接
function getPageAndImg(info){
  return new Promise(function(resolve){
    var count = 0;
    var url = preUrl + info.href + '?p=4';
    getUrlDom(url).then((obj)=>{
        if(obj['domStr']){
            let startStr = 'chapterImages = ';
            let endStr = 'var chapterPath = ';
            let start = obj['domStr'].indexOf(startStr);
            let end = obj['domStr'].indexOf(endStr);
            let str = obj['domStr'].substring(start + startStr.length + 1, end-2);  //images的加密文件
            let images = dealImages(str); //每一集的所有图片的后缀集合

            let end2 = obj['domStr'].indexOf('var chapterPrice');
            let midPreUrl = obj['domStr'].substring(end + endStr.length + 1, end2 -2); //每一集的url前缀
            
            let k = 1;
            let timer = setInterval(function(){
                let imgUrl = '';
                //判断图片路径下载 拼接相应图片url
                if(images[k-1].indexOf('https')!= -1){
                    imgUrl = midPreUrl + images[k-1];
                }else{
                    imgUrl = imgPreUrl + midPreUrl + images[k-1];
                }
            
                let name = '000' + k;
                if(k < 10){
                    name = '00' + k;
                }else if(k < 100){
                    name = '0' + k;
                }
                info.title = info.title.trim();
                fs.mkdir('./image/' + info.title, function(){});
                saveImg(imgUrl, info.title, name, function(){
                    count++;
                    console.log(count, images.length);
                    if(count == images.length){
                        console.log(info.title + ' download success!!!!');
                        resolve();
                    }
                });

                k++;
                if(k > images.length){
                    clearInterval(timer);
                }
            }, 300);
        }
    });
  });
}

//获取当前url的dom值 返回值 $ domStr
function getUrlDom(url){
  return new Promise(function(resolve){
    https.get(url, (res)=>{
      let domData = "";
      res.on("data", function(chunk){
        domData+=chunk;
      });
      res.on("end", function(){
        let $ = cheerio.load(domData);
        resolve({'$': $, 'domStr': domData});
      });
    })
  });
}

//处理加密的图片
function dealImages(chapterImages){
  var key = CryptoJS.enc.Utf8.parse("123456781234567G");  //十六位字符作为密钥
  var iv = CryptoJS.enc.Utf8.parse('ABCDEF1G34123412');
  var decrypt = CryptoJS.AES.decrypt(chapterImages,key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
  chapterImages = JSON.parse(decryptedStr.toString());
  return chapterImages;
}

//已知url， 下载图片
function saveImg(url, imgFileFolder, imgName, callback){
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
                      console.log(url, "down fail", err);
                  }else{
                      console.log("down success", url);
                  }
                  callback();
              });
          }else{
              console.log('失败');
          }
      });
  })
}