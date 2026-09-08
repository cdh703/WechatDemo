const { fetchPhotos, uploadCloudFile, getSavedProfile } = require('../../utils/data')

Page({
  data: { type: '全部', items: [], count: 0, loading: true },
  onLoad(options) { this.setData({ type: options.type || '全部' }); this.loadItems() },
  onPullDownRefresh() { this.loadItems().finally(() => wx.stopPullDownRefresh()) },
  async loadItems() {
    this.setData({ loading: true })
    const photos = await fetchPhotos()
    const items = photos.filter((item) => this.data.type === '全部' || item.category === this.data.type || item.type === this.data.type)
    this.setData({ items, count: items.length, loading: false })
  },
  preview(event) {
    const urls = this.data.items.map((item) => item.photoUrl).filter(Boolean)
    wx.previewImage({ current: event.currentTarget.dataset.url, urls })
  },
  deletePhoto(event) {
    const item = this.data.items[event.currentTarget.dataset.index]
    if (!item || item.isDemo) return wx.showToast({ title: '演示图片不能删除', icon: 'none' })
    wx.showModal({ title: '删除照片', content: '确定删除这张照片吗？', success: async (result) => {
      if (!result.confirm) return
      try { await wx.cloud.callFunction({ name: 'delete_item', data: { _id: item._id, fileID: item.fileID || item.photoUrl } }); wx.showToast({ title: '已删除' }); this.loadItems() }
      catch (error) { console.error(error); wx.showToast({ title: '删除失败', icon: 'none' }) }
    } })
  },
  chooseAndUpload() {
    wx.chooseMedia({ count: 9, mediaType: ['image'], sourceType: ['album', 'camera'], sizeType: ['compressed'], success: ({ tempFiles }) => this.uploadFiles(tempFiles, 0) })
  },
  async uploadFiles(files, index) {
    const file = files[index]
    if (!file) return this.loadItems()
    const app = getApp(); const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
    if (!openid) return wx.showToast({ title: '请先登录微信身份', icon: 'none' })
    try {
      const ext = (file.tempFilePath.match(/\.[^.]+$/) || ['.jpg'])[0]
      const { fileID } = await uploadCloudFile(`photos/${openid}/${Date.now()}-${index}${ext}`, file.tempFilePath)
      const db = wx.cloud.database()
      const profile = getSavedProfile()
      await db.collection('photos').add({ data: { photoUrl: fileID, authorOpenid: openid, category: this.data.type === '全部' ? '生活' : this.data.type, type: this.data.type, title: '我的收藏照片', description: '', tags: [], nickName: profile.nickName, avatarUrl: profile.avatarUrl, likeCount: 0, viewCount: 0, favoriteCount: 0, commentCount: 0, allowComment: true, createdAt: db.serverDate(), createTime: db.serverDate() } })
      wx.showToast({ title: `第${index + 1}张上传成功`, icon: 'none' }); this.uploadFiles(files, index + 1)
    } catch (error) { console.error(error); wx.showToast({ title: '上传失败', icon: 'none' }) }
  }
})
