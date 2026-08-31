/**
 * 个人名片数据层
 * -----------------------------------
 * 所有个人资料、技能、经历、联系方式统一集中管理
 * 单一数据源，消除页面 data 中的重复字段
 */
module.exports = {
  // 基础个人信息
  banner: '/images/陈东汉.png',
  name: '陈东汉',
  major: '网络空间安全',
  degree: '本科生',
  intro: '探索网络安全与人工智能，记录学习与成长。',
  status: '在线学习中',
  footerBrand: 'DongHan Profile · 陈东汉',
  navTitle: 'DongHan Profile',

  // 关于我（详情页展示）
  about: {
    directions: ['人工智能', '深度学习', '网络安全']
  },

  // 技能列表
  skills: [
    { name: 'Python',     level: '熟练',   cls: 'high', pct: 85 },
    { name: '深度学习',   level: '学习中', cls: 'mid',  pct: 55 },
    { name: '网络安全',   level: '学习中', cls: 'mid',  pct: 50 },
    { name: '微信小程序', level: '入门',   cls: 'low',  pct: 30 }
  ],

  // 项目经历时间线
  timeline: [
    { no: '01', year: '2025', event: '参加计算机相关竞赛' },
    { no: '02', year: '2026', event: '学习人工智能和深度学习项目' },
    { no: '03', year: '2026', event: '完成微信小程序开发学习' }
  ],

  // 兴趣标签
  interests: [
    { name: 'AI研究',   cls: 'cloud-0' },
    { name: '运动跑步', cls: 'cloud-1' },
    { name: '技术学习', cls: 'cloud-2' },
    { name: '阅读',     cls: 'cloud-3' }
  ],

  // 联系信息
  contact: {
    motto: '用代码守护数据，让热爱驱动前行',
    email: 'xc66868@gmail.com',
    location: '青岛'
  }
};
