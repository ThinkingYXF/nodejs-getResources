var http = require('http');
var charset = require('superagent-charset');
var superagent = require('superagent');
var request = charset(superagent);
var fs = require('fs');
var cheerio = require('cheerio');           //类似jquery
var decode = require("./decode");

var getResources = {
  listUrl: "https://www.iimanhua.com/comic/428/",   //漫画列表页
  preUrl: "http://www.iimanhua.com/",              //漫画详情页前缀
  imgPreUrl: "http://res.img.jituoli.com/",         //图片url前缀
  timestamp: 500,   //每个 n 毫秒下载一张图
  init: function () {
    //得到集数与名称
    this.getJSList(this.listUrl).then(JSList => {
      fs.mkdir('./image', function () { });
      var totalLength = JSList.length;
      var count = 0;

      var that = this;
      function download() {
        if (fs.existsSync('./image/' + JSList[count]['title'])) {
          count++;
          if (count < totalLength) {
            download();
          }
        } else {
          that.getPageAndImg(JSList[count]).then(() => {
            count++;
            if (count < totalLength) {
              download();
            }
          });
        }

      }
      download();
    });
  },
  /**
   * 获取当前url的dom值 返回值 $ domStr
   * url  页面地址
   */
  getUrlDom: function (url) {
    return new Promise(function (resolve) {
      request.get(url).charset().end(function (req, res) {
        let $ = cheerio.load(res.text);
        resolve({ '$': $, 'domStr': res.text });
      });
    });
  },
  getImgUrlList: function (url) {
    var that = this;
    return new Promise(function (resolve) {
      that.getUrlDom(url).then(res => {

        let startIdx = res['domStr'].indexOf('packed=');
        let endIdx = res['domStr'].indexOf(';eval(eval(base64decode');
        let result = res['domStr'].substring(startIdx + 8, endIdx - 1);
        var photosr = new Array();
        eval(eval(decode(result).slice(4)));
        resolve(photosr);
      });
    })
  },
  getJSList(url) {
    var that = this;
    return new Promise(function (resolve) {
      that.getUrlDom(url).then(res => {
        var list = res['$']('.plist ul').find('li');
        let jishuList = [];
        for (let i = 0; i < list.length; i++) {
          let reveseIdx = list.length - i - 1;
          var href = res['$'](list).eq(reveseIdx).find('a').prop('href');
          let info = {
            title: '(' + i + ')' + res['$'](list).eq(reveseIdx).find('a').text(),
            href: that.preUrl + href
          }
          jishuList.push(info);
        }
        resolve(jishuList);
      })
    });
  },
  getPageAndImg: function (info) {
    var that = this;
    return new Promise(function (resolve) {
      var count = 0;
      that.getImgUrlList(info.href).then(imgUrlList => {
        let k = 0;
        let timer = setInterval(function () {
          if (imgUrlList[k]) {
            info.title = info.title.trim();
            fs.mkdir('./image/' + info.title, function () { });
            var key = k < 9 ? ('00' + (k + 1)) : ('0' + (k + 1));
            if (imgUrlList[k].indexOf('http') == -1) {
              imgUrlList[k] = that.imgPreUrl + imgUrlList[k];
            }
            that.saveImg(imgUrlList[k], info.title, key, function () {
              count++;
              console.log(count, imgUrlList.length, key);
              if (count == imgUrlList.length - 1) {
                console.log(info.title + ' download success!!!!');
                resolve();
              }
            });
          }


          k++;
          if (k == imgUrlList.length) {
            clearInterval(timer);
          }
        }, 300);
      });
    });
  },
  /**
   * 下载图片方法
   * url              图片地址
   * imgFileFolder    每一话的文件名
   * imgName          每一张图片名称
   * callback         下载每一张成功回调
   */
  saveImg: function (url, imgFileFolder, imgName, callback) {
    http.get(url, (res) => {
      var imgData = "";
      res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
      res.on("data", function (chunk) {
        imgData += chunk;
      });
      res.on("end", function () {
        if (imgData) {
          fs.writeFile("./image/" + imgFileFolder + '/' + imgName + '.jpg', imgData, "binary", function (err) {
            if (err) {
              console.log(url, "down fail", err);
            } else {
              console.log("down success", url);
            }
            callback();
          });
        } else {
          console.log('失败');
        }
      });
    })
  }
}
module.exports = getResources;