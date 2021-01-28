/**
 * 获取longStr字符串中 key的值 (类似 page=)
 */
function getValueWithKey(longStr, key) {
  var startIdx = longStr.indexOf(key) + key.length;
  var endIdx = longStr.substr(startIdx).indexOf(";");
  var result = longStr.substr(startIdx).substring(0, endIdx);
  result = result.replace(/["']/g, "");
  return result;
}

/**
 * ajax 解决中文页面 编码格式为gb2312乱码
 * @param {ajax url} url 
 * @param {类型gb2312中文乱码问题} type 
 */
function myAjax(url, type, headers) {
  return new Promise((resolve) => {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, true);
    if (type == "gb2312") {
      xmlhttp.overrideMimeType("text/html;charset=gb2312"); //设定以gb2312编码识别数据 
    }
    if (headers) {
      xmlhttp.setRequestHeader("Host", headers.host);
    }
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4) {
        if (xmlhttp.status == 200) {
          resolve(xmlhttp.responseText);
        }
      }
    };
    xmlhttp.send();
  });
}

/**
 * 批量执行异步请求 连接池
 */
function batchOption(imgUrlList) {
  const MAX = 5;  //线程数
  // var totalLenght = imgUrlList.length;
  // var computedCout = {
  //   total: totalLenght,
  //   count: 0
  // };
  //连接池放入异步任务
  var ajaxPool = [];
  for (let i = 0; i < imgUrlList.length; i++) {
    var name = i < 10 ? "00" + i : "0" + i;
    let aj = {
      isFinish: false,
      url: imgUrlList[i],
      name: name,
      task: function (url) {
        return new Promise(function (resolve) {
          getUrlBase64(url, "png", function (img) {
            resolve(img);
          });
        });

      }
    };
    ajaxPool.push(aj);
  }
  //开始从连接池取MAX个下载，之后MAX中有一个成功则再在连接池取一个下载
  var start = ajaxPool.splice(0, MAX);
  for (let i = 0; i < start.length; i++) {
    batchDeal(ajaxPool, start[i]);
  }
}

/**
 * 遍历下载
 * @param {连接池数据} ajaxPool 
 * @param {当前下载的项} nowItem 
 */
function batchDeal(ajaxPool, nowItem) {
  nowItem.task(nowItem.url).then(res => {
    downloadImg(res, nowItem.name);
    nowItem.isFinish = true;
    var next = ajaxPool.splice(0, 1);
    if (next.length) {
      batchDeal(ajaxPool, next[0]);
    }
  });
}


function getAjax(xmlhttp) {
  return new Promise(function (resolve) {
    xmlhttp.send(null);
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4) {
        if (xmlhttp.status == 200) {
          resolve(xmlhttp.responseText);
        }
      }
    };
  });
}

/**
 * 图片url转为base64
 * @param {图片地址} url 
 * @param {图片格式} ext 
 * @param {回调} callback 
 */
function getUrlBase64(url, ext, callback) {
  var canvas = document.createElement("canvas");   //创建canvas DOM元素
  var ctx = canvas.getContext("2d");
  var img = new Image;
  img.crossOrigin = 'Anonymous';
  img.src = url;
  img.onload = function () {
    canvas.height = img.height; //指定画板的高度,自定义
    canvas.width = img.width; //指定画板的宽度，自定义
    ctx.drawImage(img, 0, 0, img.width, img.height); //参数可自定义
    var dataURL = canvas.toDataURL("image/" + ext);
    callback.call(this, dataURL); //回掉函数获取Base64编码
    canvas = null;
  };
}

/**
 * 下载图片
 * @param {图片地址} _baseUrl 
 * @param {图片名称} filename 
 */
function downloadImg(_baseUrl, filename) {
  var eleLink = document.createElement('a');
  eleLink.download = filename;
  eleLink.style.display = 'none';
  // 图片转base64地址
  eleLink.href = _baseUrl;
  // 触发点击
  document.body.appendChild(eleLink);
  eleLink.click();
  // 然后移除
  document.body.removeChild(eleLink);
}

