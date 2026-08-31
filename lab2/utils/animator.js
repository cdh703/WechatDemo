/**
 * 入场动画（IntersectionObserver）工具
 * 统一封装卡片滚动入场动画的创建与销毁
 */

/**
 * 批量初始化入场动画观察器
 * @param {Object}  pageCtx      页面 this 上下文
 * @param {number}  cardCount    卡片总数（animateList 数组长度）
 * @param {string}  selectorTpl  选择器模板，含 {i} 占位
 * @param {number}  threshold    触发阈值
 * @returns {Array}              创建的 observer 数组，用于页面卸载时销毁
 */
function initRevealObservers(pageCtx, cardCount, selectorTpl = '#card-{i}', threshold = 0.15) {
  const observers = [];
  for (let i = 0; i < cardCount; i++) {
    // 已显示的跳过
    if (pageCtx.data.animateList && pageCtx.data.animateList[i]) continue;

    const obs = pageCtx.createIntersectionObserver({
      thresholds: [threshold],
      observeAll: false
    });
    obs.relativeToViewport(0, 0);
    const selector = selectorTpl.replace('{i}', i);
    obs.observe(selector, () => {
      if (pageCtx.data && !pageCtx.data.animateList[i]) {
        pageCtx.setData({ [`animateList[${i}]`]: true });
      }
      obs.disconnect();
    });
    observers.push(obs);
  }
  return observers;
}

/**
 * 批量销毁观察器（避免内存泄漏）
 * @param {Array} observers
 */
function destroyObservers(observers) {
  if (Array.isArray(observers)) {
    observers.forEach(o => { try { o.disconnect(); } catch (e) {} });
  }
  return null;
}

module.exports = { initRevealObservers, destroyObservers };
