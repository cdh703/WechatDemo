// app.js
const profile = require('./data/profile.js');

App({
  globalData: {
    // 全局共享的个人资料（单一数据源）
    profile,
    // 视口缓存，各页面无需重复调用 getSystemInfo
    windowInfo: null,
    menuRect: null
  },

  onLaunch() {
    // 预取视口 & 胶囊按钮信息，各页面直接读 globalData
    const sysInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    let menuRect = null;
    try { menuRect = wx.getMenuButtonBoundingClientRect(); } catch (e) { menuRect = null; }
    this.globalData.windowInfo = sysInfo;
    this.globalData.menuRect = menuRect;

    // 开启分享入口（全局生效）
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage'] });
  },

  /**
   * 便捷 API：从 globalData 获取资料快照
   * 页面可在 onLoad 中引用，避免各页面反复 require
   */
  getProfileSnapshot() {
    return Object.assign({}, this.globalData.profile, {
      // about 与顶层字段统一合并，对外暴露单一视图模型
      about: Object.assign({
        name: this.globalData.profile.name,
        major: this.globalData.profile.major
      }, this.globalData.profile.about)
    });
  }
});
