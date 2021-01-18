var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');           //类似jquery
let midPath = '';
var getResources = {
  listUrl: "",
  preUrl: "https://www.36mh.net/",
  imgUrl: "https://img001.shmkks.com/",
  timestamp: 300,   //每隔  300ms下载一张图片
  timeEvery: 2000,  //每集之间间隔 n 秒下载 防止报错停止进程
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
      https.get(url, (res) => {
        let domData = "";
        res.on("data", function (chunk) {
          domData += chunk;
        });
        res.on("end", function () {
          let $ = cheerio.load(domData);
          resolve({ '$': $, 'domStr': domData });
        });
      })
    });
  },
  getImgUrlList: function (url) {
    var that = this;
    return new Promise(function (resolve) {
      that.getUrlDom(url).then(res => {
        let startIdx = res['domStr'].indexOf('chapterImages = ');
        let endIdx = res['domStr'].indexOf(';var chapterPath');
        let result = res['domStr'].substring(startIdx + 16, endIdx);
        let startIdx1 = res['domStr'].indexOf('chapterPath = "');
        let endIdx1 = res['domStr'].indexOf('";var chapterPrice');
        midPath = res['domStr'].substring(startIdx1 + 15, endIdx1);
        resolve(JSON.parse(result));
      });
    })
  },
  getJSList(url) {
    var that = this;
    return new Promise(function (resolve) {
      that.getUrlDom(url).then(res => {
        var list = res['$']('ul#chapter-list-4').find('li');
        let jishuList = [];
        for (let i = 0; i < list.length; i++) {
          var href = res['$'](list).eq(i).find('a').prop('href');
          let info = {
            title: '(' + i + ')' + res['$'](list).eq(i).find('a').text().trim(),
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
          info.title = info.title.trim();
          fs.mkdir('./image/' + info.title, function () { });
          var key = k < 9 ? ('00' + (k + 1)) : ('0' + (k + 1));
          if (imgUrlList[k].indexOf('http') == -1) {
            imgUrlList[k] = that.imgUrl + midPath + imgUrlList[k];
          }
          that.saveImg(imgUrlList[k], info.title, key, function () {
            count++;
            console.log(count, imgUrlList.length, key);
            if (count == imgUrlList.length) {
              console.log(info.title + ' download success!!!!');
              setTimeout(() => {
                resolve();
              }, that.timeEvery);
            }
          });

          k++;
          if (k == imgUrlList.length) {
            clearInterval(timer);
          }
        }, that.timestamp);
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
    https.get(url, (res) => {
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