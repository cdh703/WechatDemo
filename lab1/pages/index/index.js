// pages/index/index.js
// 页面逻辑文件：负责"页面怎么动"，保存数据、处理事件

Page({

  // data：保存页面数据，wxml 中用 {{message}} 引用
  data: {
    message: "Hello World"
  },

  // changeText：按钮点击事件，实现中英文文字切换
  changeText: function () {
    if (this.data.message === "Hello World") {
      // 第一次点击：英文 -> 中文
      this.setData({
        message: "你好，微信小程序"
      });
    } else {
      // 第二次点击：中文 -> 英文
      this.setData({
        message: "Hello World"
      });
    }
  }

});
