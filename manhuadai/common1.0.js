var https = require('https');
var superagent = require("superagent");
var fs = require('fs');
var cheerio = require('cheerio');           //类似jquery

//加密方法
var getImgList = require('./decrypt20200824');    //调用 getImgList(str);


var getResource = {
  preStartUrl: 'https://www.manhuadui.com',       //查看某一话的前缀url
  imgPreUrl: 'https://manga.mipcdn.com/i/s/img01.eshanyao.com/',       //某些图片需要加此前缀

  listUrl: 'https://www.manhuadui.com/manhua/',  //漫画列表页
  startJS: 0,       //开始集数    0代表第一话
  endJS: 10,        //结束集数    10表示下载到第10话
  timestamp: 300,   //每隔  300ms下载一张图片
  init: function () {
    var that = this;
    this.getInfoList().then(function (list) {
      fs.mkdir('./image', function () { });
      let k = that.startJS;
      judgeDown(k);
      //判断是否存在文件夹 若存在则下载
      function judgeDown(js) {
        var nowDownloadJS = list[js].title;
        fs.exists('./image/' + nowDownloadJS, function (result) {
          if (!result) {
            if (js > 1) {
              k = k - 1;
              download(js - 1);
            } else {
              download(js);
            }
          } else {
            k++;
            judgeDown(k);
          }
        });
      }
      //递归下载
      function download(count) {
        that.getPageAndImg(list[count]).then(function () {
          k++;
          if (k < that.endJS) {
            download(k);
          }
        });
      }
    });
  },
  /**
   * 获取集数信息与链接 title href
   * 返回值为 jishuList 格式为 [{title: '**', href: '**'}]
   */
  getInfoList: function () {
    var that = this;
    return new Promise(function (resolve) {
      that.getUrlDom(that.listUrl).then((obj) => {
        //查询集数 和 每一集的链接
        var list = obj['$']('.zj_list_con').find('ul li');
        let jishuList = [];
        for (let i = 0; i < list.length; i++) {
          let info = {
            title: obj['$'](list).eq(i).find('span.list_con_zj').text(),
            href: obj['$'](list).eq(i).find('a').prop('href')
          }
          jishuList.push(info);
        }
        resolve(jishuList);
      });
    });
  },

  /**
   * 获取当前集数的页数与当前页的图片链接
   * info   每一话的名称与链接  title href
   */
  getPageAndImg: function (info) {
    var that = this;
    return new Promise(function (resolve) {
      var count = 0;
      var url = that.preStartUrl + info.href;
      that.getUrlDom(url, true).then((obj) => {
        if (obj['domStr']) {
          let startStr = 'chapterImages = ';
          let endStr = 'var chapterPath = ';
          let start = obj['domStr'].indexOf(startStr);
          let end = obj['domStr'].indexOf(endStr);
          let str = obj['domStr'].substring(start + startStr.length + 1, end - 2);  //images的加密文件
          let images = getImgList(str); //每一集的所有图片的后缀集合

          let end2 = obj['domStr'].indexOf('var chapterPrice');
          let midPreUrl = obj['domStr'].substring(end + endStr.length + 1, end2 - 2); //每一集的url前缀

          let k = 1;
          let timer = setInterval(function () {
            let imgUrl = '';
            //判断图片路径下载 拼接相应图片url
            if (images[k - 1].indexOf('https') != -1) {
              // imgUrl = midPreUrl + images[k-1];
              imgUrl = images[k - 1];
            } else {
              imgUrl = that.imgPreUrl + midPreUrl + images[k - 1];
            }

            let name = '000' + k;
            if (k < 10) {
              name = '00' + k;
            } else if (k < 100) {
              name = '0' + k;
            }
            info.title = info.title.trim();
            fs.mkdir('./image/' + info.title, function () { });
            that.saveImg(imgUrl, info.title, name, function () {
              count++;
              console.log(count, images.length, name);
              if (count == images.length) {
                console.log(info.title + ' download success!!!!');
                resolve();
              }
            });

            k++;
            if (k > images.length) {
              clearInterval(timer);
            }
          }, that.timestamp);
        }
      });
    });
  },

  /**
   * 获取当前url的dom值 返回值 $ domStr
   * url  页面地址
   */
  getUrlDom: function (url, zlib) {
    return new Promise(function (resolve) {
      superagent.get(url).end(function (req, res) {
        let $ = cheerio.load(res.text);
        resolve({ '$': $, 'domStr': res.text });
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

module.exports = getResource;