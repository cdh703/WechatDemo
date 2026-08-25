// index.js
Page({
  data: {
    banner: '/images/陈东汉.png',
    name: '陈东汉',
    major: '网络空间安全',
    degree: '本科生',
    intro: '探索网络安全与人工智能，记录学习与成长。',
    status: '在线学习中',
    about: {
      name: '陈东汉',
      major: '网络空间安全',
      directions: ['人工智能', '深度学习', '网络安全']
    },
    skills: [
      { name: 'Python',     level: '熟练',   cls: 'high', pct: 85 },
      { name: '深度学习',   level: '学习中', cls: 'mid',  pct: 55 },
      { name: '网络安全',   level: '学习中', cls: 'mid',  pct: 50 },
      { name: '微信小程序', level: '入门',   cls: 'low',  pct: 30 }
    ],
    timeline: [
      { no: '01', year: '2025', event: '参加计算机相关竞赛' },
      { no: '02', year: '2026', event: '学习人工智能和深度学习项目' },
      { no: '03', year: '2026', event: '完成微信小程序开发学习' }
    ],
    interests: [
      { name: 'AI研究',   cls: 'cloud-0' },
      { name: '运动跑步', cls: 'cloud-1' },
      { name: '技术学习', cls: 'cloud-2' },
      { name: '阅读',     cls: 'cloud-3' }
    ],
    contact: {
      motto: '用代码守护数据，让热爱驱动前行',
      email: 'xc66868@gmail.com',
      location: '青岛'
    },
    animateList: [false, false, false, false, false, false, false],
    navBg: 'transparent',
    scrollPct: 0,
    windowHeight: 0
  },

  onLoad() {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage'] });
    wx.getSystemInfo({
      success: (res) => {
        this.setData({ windowHeight: res.windowHeight });
      }
    });
    this._reveal(0);
    this._reveal(1);
  },

  onReady() {
    this._initObserver();
  },

  onScroll(e) {
    const { scrollTop, scrollHeight } = e.detail;
    const winH = this.data.windowHeight;
    const maxScroll = Math.max(1, (scrollHeight || 1500) - winH);
    const pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));

    let navBg = 'transparent';
    if (scrollTop > 40) {
      const opacity = Math.min(0.92, (scrollTop - 40) / 160);
      navBg = `rgba(15, 32, 39, ${opacity})`;
    }

    this.setData({ scrollPct: pct, progressStyle: `width: ${pct}%`, navBg });
  },

  _initObserver() {
    this._observers = [];
    const list = this.data.animateList;
    list.forEach((shown, i) => {
      if (shown) return;
      const obs = this.createIntersectionObserver({ thresholds: [0.15], observeAll: false });
      obs.relativeToViewport(0, 0);
      obs.observe(`#card-${i}`, () => {
        this._reveal(i);
        obs.disconnect();
      });
      this._observers.push(obs);
    });
  },

  _reveal(idx) {
    if (this.data.animateList[idx]) return;
    this.setData({ [`animateList[${idx}]`]: true });
  },

  _haptic() {
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  },

  onUnload() {
    if (this._observers) {
      this._observers.forEach(o => o.disconnect());
      this._observers = null;
    }
  },

  onBannerTap() {
    this._haptic();
    wx.previewImage({
      urls: [this.data.banner],
      current: this.data.banner
    });
  },

  onContactTap() {
    this._haptic();
    wx.setClipboardData({
      data: this.data.contact.email,
      success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' })
    });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.name}的个人名片`,
      path: '/pages/index/index',
      imageUrl: this.data.banner
    };
  }
})
