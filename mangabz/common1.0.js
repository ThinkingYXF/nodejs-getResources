var http = require('http');
var charset = require('superagent-charset');
var superagent = require('superagent');
var request = charset(superagent);
var fs = require('fs');
var cheerio = require('cheerio');           //类似jquery

var getResources = {
  listUrl: "http://mangabz.com/207bz/",   //漫画列表页
  preUrl: "http://mangabz.com",              //漫画详情页前缀
  imgPreUrl: "http://res.img.jituoli.com/",         //图片url前缀
  timestamp: 500,   //每个 n 毫秒下载一张图

  nowPage: 1,
  nowTotal: 0,
  nowImgArr: [],


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
      getChapterInfo();
      function getChapterInfo() {
        that.getUrlDom(url).then(res => {
          //cid=MANGABZ_CID _cid  _mid=MANGABZ_MID  page=MANGABZ_PAGEINDEX key  _dt=MANGABZ_VIEWSIGN_DT  _sign=MANGABZ_VIEWSIGN
          //MANGABZ_IMAGE_COUNT
          var obj = {
            cid: "MANGABZ_CID=",
            _mid: "MANGABZ_MID=",
            _dt: "MANGABZ_VIEWSIGN_DT=",
            _sign: "MANGABZ_VIEWSIGN=",
            total: "MANGABZ_IMAGE_COUNT=",
          }
          var result = {};
          for (let k in obj) {
            let v = that.getKeywords(res.domStr, obj[k]);
            v = v.replace(/"/g, "");
            result[k] = v;
          }
          console.log(result);
          that.nowPage = 1;
          that.nowTotal = result.total;
          that.nowImgArr = [];
          that.getEveryChapterImg([result, that.nowPage]).then(res => {
            resolve(res);
          }).catch(() => {
            getChapterInfo(url);
          });
        });
      }
    })
  },
  /**
   * 
   * @param {myArr[0]需要的参数对象; myArr[1]当前的页数} myArr 
   */
  getEveryChapterImg(myArr) {
    var that = this;
    return new Promise((resolve, reject) => {
      everyChapter(myArr);
      function everyChapter(myArr) {
        var result = myArr[0], page = myArr[1];
        var getUrl = that.preUrl + "/m" + result["cid"] + "/chapterimage.ashx?";
        getUrl += "&cid=" + result.cid;
        getUrl += "&page=" + page;
        getUrl += "&key=";
        getUrl += "&_cid=" + result.cid;
        getUrl += "&_mid=" + result._mid;
        getUrl += "&_dt=" + result._dt;
        getUrl += "&_sign=" + result._sign;

        console.log(getUrl, page + " start")
        http.get(getUrl, res => {
          var data = "";
          res.on("data", function (chunk) {
            data += chunk;
          });
          res.on("end", function () {
            var arr = [];
            if (data) {
              eval(data);
              arr = d;
              that.nowImgArr = [...that.nowImgArr, ...arr];
              that.nowImgArr = Array.from(new Set(that.nowImgArr));
              // console.log(that.nowPage + "个success", that.nowImgArr);
              if (that.nowImgArr.length >= that.nowTotal) {
                resolve(that.nowImgArr);
              } else {
                that.nowPage += arr.length;
                everyChapter([myArr[0], that.nowPage]);
              }
            } else {
              reject();
            }
          })
        });
      }
    });
  },
  /**
   * 截取返回页面中某个key的值
   * @param {返回页面的字符串} str  
   * @param {获取的变量名} key 
   */
  getKeywords(str, key) {
    var startIdx = str.indexOf(key) + key.length;
    var endIdx = str.substr(startIdx).indexOf(";");
    return str.substr(startIdx).substring(0, endIdx);
  },
  /**
   * 获取漫画列表并返回每一章节信息数组
   * @param {列表地址url}  url
   */
  getJSList(url) {
    var that = this;
    return new Promise(function (resolve) {
      that.getUrlDom(url).then(res => {
        var list = res['$']('#chapterlistload').find('a');
        let jishuList = [];
        for (let i = 0; i < list.length; i++) {
          let reveseIdx = list.length - i - 1;
          var href = res['$'](list).eq(reveseIdx).prop('href');
          let info = {
            title: '(' + i + ')' + res['$'](list).eq(reveseIdx).text().replace(/ /g, ""),
            href: that.preUrl + href
          }
          jishuList.push(info);
        }
        resolve(jishuList);
      })
    });
  },
  /**
   * 根据每章节信息创建文件夹并下载图片
   * @param {章节信息}  info
   */
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
              if (count == imgUrlList.length) {
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