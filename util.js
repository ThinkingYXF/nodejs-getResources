var Common = {
  /**
   * 替换特殊字符 创建文件夹时用
   * @param {} title 
   */
  replaceSpecialChar: function (title) {
    return title.replace(/[ ?/*|:<>\\]/g, "");
  }
}

module.exports = Common;