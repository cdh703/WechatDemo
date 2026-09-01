const { birds, defaultBird } = require('../../utils/birds')

Page({
  data: { birds, selectedId: defaultBird.id },

  onShow() {
    const selectedBird = getApp().globalData.selectedBird || defaultBird
    this.setData({ selectedId: selectedBird.id })
  },

  selectBird(event) {
    const selectedId = event.currentTarget.dataset.id
    this.setData({ selectedId })
  },

  enterGame() {
    const bird = birds.find((item) => item.id === this.data.selectedId) || defaultBird
    getApp().globalData.selectedBird = bird
    wx.navigateTo({ url: '../index/index' })
  }
})
