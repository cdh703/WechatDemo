const { maps } = require('../../utils/data')
const { birds, defaultBird } = require('../../utils/birds')

Page({
  data: {
    birds,
    currentBird: defaultBird,
    switcherTop: 52,
    contentTop: 122,
    homeButtonTop: 24,
    homeButtonHeight: 32,
    levels: [
      { name: '第1关' },
      { name: '第2关' },
      { name: '第3关' },
      { name: '第4关' }
    ]
  },

  onShow() {
    this.updateHeaderLayout()
    const bird = getApp().globalData.selectedBird || defaultBird
    this.setData({ currentBird: bird }, () => {
      maps.forEach((map, index) => this.drawPreview(map, index))
    })
  },

  onReady() {
    maps.forEach((map, index) => this.drawPreview(map, index))
  },

  updateHeaderLayout() {
    if (!wx.getMenuButtonBoundingClientRect) return
    const menu = wx.getMenuButtonBoundingClientRect()
    if (!menu || !menu.bottom) return
    const switcherTop = Math.ceil(menu.bottom + 8)
    this.setData({
      switcherTop,
      contentTop: switcherTop + 70,
      homeButtonTop: Math.ceil(menu.top),
      homeButtonHeight: Math.ceil(menu.height)
    })
  },

  backHome() {
    wx.reLaunch({ url: '../splash/splash' })
  },

  drawPreview(map, index) {
    const ctx = wx.createCanvasContext('preview-' + index, this)
    const size = 20
    const bird = this.data.currentBird || defaultBird
    map.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
      let image = 'ice'
      if (cell === 1) image = 'stone'
      if (cell === 3) image = 'pig'
      ctx.drawImage('/images/icons/' + image + '.png', colIndex * size, rowIndex * size, size, size)
      if (cell === 4) ctx.drawImage('/images/icons/box.png', colIndex * size, rowIndex * size, size, size)
      if (cell === 5) ctx.drawImage(bird.icon, colIndex * size, rowIndex * size, size, size)
    }))
    ctx.draw()
  },

  chooseBird(event) {
    const bird = birds.find((item) => item.id === event.currentTarget.dataset.id) || defaultBird
    getApp().globalData.selectedBird = bird
    this.setData({ currentBird: bird }, () => {
      maps.forEach((map, index) => this.drawPreview(map, index))
    })
  },

  chooseLevel(event) {
    const level = event.currentTarget.dataset.level
    const bird = this.data.currentBird || defaultBird
    wx.navigateTo({ url: '../game/game?level=' + level + '&birdId=' + bird.id })
  }
})
