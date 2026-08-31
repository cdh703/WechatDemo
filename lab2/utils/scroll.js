/**
 * 滚动/视口计算工具
 * 集中处理滚动进度、导航栏透明度等数值运算
 */

/**
 * 根据滚动距离计算导航栏背景
 * @param {number} scrollTop  当前滚动位置
 * @returns {string}          rgba 背景色字符串
 */
function calcNavBg(scrollTop) {
  if (scrollTop <= 40) return 'transparent';
  const opacity = Math.min(0.92, (scrollTop - 40) / 160);
  return `rgba(15, 32, 39, ${opacity})`;
}

/**
 * 计算滚动百分比
 * @param {number} scrollTop   当前滚动位置
 * @param {number} scrollHeight scroll-view 总内容高度
 * @param {number} winH        窗口可视高度
 * @returns {number}           0-100 的百分比
 */
function calcScrollPct(scrollTop, scrollHeight, winH) {
  const maxScroll = Math.max(1, (scrollHeight || 1500) - winH);
  return Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
}

module.exports = { calcNavBg, calcScrollPct };
