/**
 * 触觉（震动）反馈工具
 * 统一管理所有用户交互的轻量震动
 */
function light() {
  if (wx && wx.vibrateShort) {
    try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
  }
}

function medium() {
  if (wx && wx.vibrateShort) {
    try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}
  }
}

module.exports = { light, medium };
