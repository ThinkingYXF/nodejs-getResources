var getResource = require("./common1.0");
getResource.listUrl = "http://mangabz.com/1864bz/";            //漫画列表页url,(修改***)
getResource.init();                                           //执行方法


// var http = require("http");
// let url = "http://mangabz.com/m150977/chapterimage.ashx?cid=150977&page=1&key=&_cid=150977&_mid=207&_dt=2021-01-18+14%3A10%3A20&_sign=5b9d6e1994b501d8ee8f0a0b2559c7c1";
// http.get(url, function (res) {
//   var data = "";
//   res.on("data", function (chunk) {
//     data += chunk;
//   })
//   res.on("end", function () {
//     var arr;
//     eval(data);
//     arr = d;
//     console.log(arr, 123);
//   });
// });