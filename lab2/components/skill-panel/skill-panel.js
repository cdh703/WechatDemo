/**
 * 技能展示组件
 * 接收 skills 数组，渲染进度条 + 微光动画
 */
Component({
  properties: {
    skills: { type: Array, value: [] },
    // 入场激活：为 true 时进度条才从 0 填充到目标 pct
    animateIn: { type: Boolean, value: false }
  }
});
