const INTRO_DURATION = 4800
const EXIT_DURATION = 520

Page({
  data: {
    leaving: false,
    shipImageLoaded: false,
    shipImageFailed: false
  },

  onLoad() {
    this.introTimer = setTimeout(() => this.finishIntro(), INTRO_DURATION)
  },

  onUnload() {
    clearTimeout(this.introTimer)
    clearTimeout(this.exitTimer)
  },

  skipIntro() {
    this.finishIntro()
  },

  onShipImageLoad() {
    this.setData({ shipImageLoaded: true })
  },

  onShipImageError() {
    this.setData({ shipImageFailed: true })
  },

  finishIntro() {
    if (this.isFinishing) return
    this.isFinishing = true
    clearTimeout(this.introTimer)
    this.setData({ leaving: true })
    this.exitTimer = setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }, EXIT_DURATION)
  }
})
