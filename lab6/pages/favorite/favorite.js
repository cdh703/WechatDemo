const { demoPhotos, getReaction } = require('../../utils/data')

Page({
  data: { loading: true, photos: [] },

  onShow() { this.loadFavorites() },

  async loadFavorites() {
    this.setData({ loading: true })
    let photos = demoPhotos.filter((photo) => getReaction('favorites', photo._id))
    if (wx.cloud) {
      try {
        const { result } = await wx.cloud.callFunction({ name: 'toggleFavorite', data: { action: 'list' } })
        if (result.photos && result.photos.length) photos = result.photos
      } catch (error) {
        console.warn('收藏云函数尚未部署。', error)
      }
    }
    this.setData({ photos, loading: false })
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` })
  },

  goDiscover() { wx.reLaunch({ url: '/pages/index/index' }) }
})
