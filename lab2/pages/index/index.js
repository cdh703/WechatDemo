// index.js
// ---------------------------------------------
// 架构说明：
//   · 数据     → 来自 app.getProfileSnapshot() → data/profile.js
//   · 通用逻辑 → utils/haptic.js / utils/scroll.js / utils/animator.js
//   · 视图组件 → components/* （业务组件 + 通用卡片）
//   · 本文件仅负责：组合数据、响应事件、驱动状态
// ---------------------------------------------
const app        = getApp();
const haptic     = require('../../utils/haptic.js');
const scrollUtil = require('../../utils/scroll.js');
const animator   = require('../../utils/animator.js');

const CARD_COUNT = 7; // card-0 ~ card-6

Page({
  data: {
    // —— 视图模型（全部从 profile 快照载入，避免硬编码）——
    banner:      '',
    name:        '',
    major:       '',
    degree:      '',
    intro:       '',
    status:      '',
    about:       {},
    skills:      [],
    timeline:    [],
    interests:   [],
    contact:     {},
    navTitle:    '',
    footerBrand: '',

    // —— 界面交互状态 ——
    animateList:  Array(CARD_COUNT).fill(false),
    navBg:        'transparent',
    scrollPct:    0,
    progressStyle: 'width: 0%',
    windowHeight: 0
  },

  /* ===================== 生命周期 ===================== */

  onLoad() {
    // 1. 从全局数据层获取个人资料快照（单一数据源）
    const prof = app.getProfileSnapshot();

    // 2. 视口高度（优先用 app.globalData 缓存，避免重复 API 调用）
    const wInfo = app.globalData.windowInfo || wx.getWindowInfo();
    const winH  = (wInfo && wInfo.windowHeight) || 0;

    this.setData(Object.assign({}, prof, { windowHeight: winH }));

    // 3. 首屏立即显示 Banner & Hero，避免首屏白等 observer
    this._reveal(0);
    this._reveal(1);
  },

  onReady() {
    // 初始化滚动入场观察器（card-2 ~ card-6 由 IntersectionObserver 触发）
    this._observers = animator.initRevealObservers(this, CARD_COUNT);
  },

  onUnload() {
    this._observers = animator.destroyObservers(this._observers);
  },

  /* ===================== 滚动处理 ===================== */

  onScroll(e) {
    const { scrollTop, scrollHeight } = e.detail;
    const winH = this.data.windowHeight;

    const pct   = scrollUtil.calcScrollPct(scrollTop, scrollHeight, winH);
    const navBg = scrollUtil.calcNavBg(scrollTop);

    this.setData({
      scrollPct:    pct,
      progressStyle: `width: ${pct}%`,
      navBg
    });
  },

  /* ===================== 事件处理 ===================== */

  onBannerTap() {
    haptic.light();
    wx.previewImage({
      urls:    [this.data.banner],
      current: this.data.banner
    });
  },

  onContactTap() {
    haptic.light();
    wx.setClipboardData({
      data: this.data.contact.email,
      success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' })
    });
  },

  /* ===================== 分享 ===================== */

  onShareAppMessage() {
    return {
      title:    `${this.data.name}的个人名片`,
      path:     '/pages/index/index',
      imageUrl: this.data.banner
    };
  },

  /* ===================== 私有方法 ===================== */

  _reveal(idx) {
    if (this.data.animateList[idx]) return;
    this.setData({ [`animateList[${idx}]`]: true });
  }
});
