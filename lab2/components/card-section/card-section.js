/**
 * 通用卡片容器
 * 统一包装"渐变标题栏 + 编号 + 内容"结构
 * 支持滚动入场动画、自定义 rd 类、hover 效果
 */
Component({
  options: { multipleSlots: true },
  properties: {
    title:  { type: String,  value: '' },
    no:     { type: String,  value: '' },
    rd:     { type: String,  value: '0' },   // rd-0 ~ rd-6 错峰入场
    show:   { type: Boolean, value: false }, // 是否入场（由父页面控制）
    cid:    { type: String,  value: '' },    // 用于 IntersectionObserver 的 id
    hover:  { type: Boolean, value: true }   // 是否启用点击放大/缩小
  },
  data: {}
});
