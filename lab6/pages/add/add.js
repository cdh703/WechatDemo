const { getSavedProfile, formatDate, fetchPhotos, uploadCloudFile } = require('../../utils/data')

Page({
  data: {
    tempFilePath: '',
    title: '',
    description: '',
    tagsText: '',
    city: '',
    allowComment: true,
    category: '旅行',
    categories: ['自然', '旅行', '城市', '生活'],
    uploading: false,
    progress: 0,
    historyPhotos: []
  },

  onShow() {
    this.loadHistory()
  },

  async loadHistory() {
    const app = getApp()
    const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
    const photos = await fetchPhotos()
    const own = photos.filter((item) => (item.authorOpenid || item._openid) === openid)
    this.setData({ historyPhotos: own.slice(0, 6) })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: ({ tempFiles }) => this.setData({ tempFilePath: tempFiles[0].tempFilePath })
    })
  },

  onTitleInput(event) { this.setData({ title: event.detail.value }) },
  onDescriptionInput(event) { this.setData({ description: event.detail.value }) },
  onTagsInput(event) { this.setData({ tagsText: event.detail.value }) },
  onCityInput(event) { this.setData({ city: event.detail.value }) },
  onAllowCommentChange(event) { this.setData({ allowComment: event.detail.value }) },
  onCategoryChange(event) { this.setData({ category: this.data.categories[event.detail.value] }) },

  async publish() {
    const { tempFilePath, title, description, tagsText, city, category, allowComment, uploading } = this.data
    if (uploading) return
    if (!tempFilePath) return wx.showToast({ title: '请先选择图片', icon: 'none' })
    if (!title.trim()) return wx.showToast({ title: '请写一句图片说明', icon: 'none' })
    if (!wx.cloud) return wx.showModal({ title: '云开发未开启', content: '请先开通云环境并创建 photos 集合。', showCancel: false })

    const app = getApp()
    const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
    if (!openid) {
      this.setData({ uploading: false })
      return wx.showModal({ title: '微信身份未识别', content: '请先完成微信身份登录，再发布作品。', showCancel: false })
    }
    const profile = getSavedProfile()
    const extension = tempFilePath.match(/\.[^.]+$/)
    const cloudPath = `photos/${openid}/${Date.now()}${extension ? extension[0] : '.jpg'}`
    this.setData({ uploading: true, progress: 8 })

    try {
      const textIssue = await this.runSecurityCheck({ action: 'text', content: `${title} ${description}`.trim(), scene: 3 }, '文本包含违规内容，请修改后再发布')
      if (textIssue) return wx.showToast({ title: textIssue, icon: 'none' })

      const { fileID } = await uploadCloudFile(cloudPath, tempFilePath, ({ progress }) => this.setData({ progress }))

      const imageIssue = await this.runSecurityCheck({ action: 'image', fileID }, '图片未通过内容安全检测，已自动清理')
      if (imageIssue) return wx.showToast({ title: imageIssue, icon: 'none' })

      const db = wx.cloud.database()
      await db.collection('photos').add({
        data: {
          photoUrl: fileID,
          authorOpenid: openid,
          title: title.trim(),
          description: description.trim(),
          category,
          tags: tagsText.split(/[，,\s]+/).filter(Boolean).slice(0, 5),
          avatarUrl: profile.avatarUrl,
          nickName: profile.nickName,
          province: profile.province || '',
          city: city.trim(),
          country: profile.country || '中国',
          addDate: formatDate(new Date()),
          likeCount: 0,
          viewCount: 0,
          favoriteCount: 0,
          commentCount: 0,
          allowComment,
          createdAt: db.serverDate(),
          createTime: db.serverDate()
        }
      })
      wx.showToast({ title: '发布成功' })
      this.setData({ tempFilePath: '', title: '', description: '', tagsText: '', city: '', progress: 0 })
      await this.loadHistory()
    } catch (error) {
      console.error(error)
      wx.showModal({ title: '发布失败', content: '请检查云环境、photos 集合权限和网络连接。', showCancel: false })
    } finally {
      this.setData({ uploading: false })
    }
  },

  async runSecurityCheck(data, blockMessage) {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'securityCheck', data })
      if (result && result.pass === false) return blockMessage
    } catch (error) {
      console.warn('内容安全检测云函数未部署，跳过检测。', error)
    }
    return ''
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` })
  },
  goDiscover() { wx.navigateBack({ delta: 1, fail: () => wx.reLaunch({ url: '/pages/index/index' }) }) },
  goHome() { wx.redirectTo({ url: '/pages/homepage/homepage' }) }
})
