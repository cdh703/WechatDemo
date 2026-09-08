const { fetchPhotos, getSavedProfile, saveUserProfile, uploadCloudFile } = require('../../utils/data')

Page({
  data: {
    profile: getSavedProfile(),
    draft: {},
    photos: [],
    likedCount: 0,
    favoriteCount: 0,
    editing: false,
    viewingOther: false
  },

  onLoad(options) {
    this.targetOpenid = options.openid || ''
    this.targetNickname = options.nickname ? decodeURIComponent(options.nickname) : ''
  },

  onShow() {
    this.loadPage()
  },

  async loadPage() {
    const app = getApp()
    const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
    const allPhotos = await fetchPhotos()
    const viewingOther = Boolean(this.targetOpenid || this.targetNickname)
    let photos
    let profile = getSavedProfile()

    if (viewingOther) {
      photos = allPhotos.filter((item) => this.targetOpenid ? (item.authorOpenid || item._openid) === this.targetOpenid : item.nickName === this.targetNickname)
      const first = photos[0]
      profile = first ? {
        nickName: first.nickName,
        avatarUrl: first.avatarUrl,
        province: first.province,
        country: first.country,
        bio: '在拾光社区分享的创作者'
      } : profile
    } else {
      photos = allPhotos.filter((item) => (item.authorOpenid || item._openid) === openid)
    }

    const likes = wx.getStorageSync('lab6_likes') || []
    const favorites = wx.getStorageSync('lab6_favorites') || []
    this.setData({ profile, photos, likedCount: likes.length, favoriteCount: favorites.length, viewingOther })
    if (!viewingOther && wx.cloud) {
      try {
        const { result } = await wx.cloud.callFunction({ name: 'toggleFavorite', data: { action: 'list' } })
        this.setData({ favoriteCount: (result.photos || []).length })
      } catch (_) {}
    }
    wx.setNavigationBarTitle({ title: viewingOther ? `${profile.nickName}的主页` : '我的主页' })
  },

  startEdit() {
    this.setData({ draft: Object.assign({}, this.data.profile), editing: true })
  },
  closeEdit() { this.setData({ editing: false }) },
  noop() {},
  onAvatarChoose(event) { this.setData({ 'draft.avatarUrl': event.detail.avatarUrl }) },
  onNicknameInput(event) { this.setData({ 'draft.nickName': event.detail.value }) },
  onBioInput(event) { this.setData({ 'draft.bio': event.detail.value }) },
  onProvinceInput(event) { this.setData({ 'draft.province': event.detail.value }) },

  async saveEdit() {
    const draft = this.data.draft
    if (!draft.nickName || !draft.nickName.trim()) return wx.showToast({ title: '请填写昵称', icon: 'none' })
    let avatarUrl = draft.avatarUrl
    if (avatarUrl && !avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('/assets/')) {
      try {
        const app = getApp()
        const extension = avatarUrl.match(/\.[^.]+$/)
        const cloudPath = `avatars/${app.globalData.openid || 'visitor'}-${Date.now()}${extension ? extension[0] : '.jpg'}`
        const uploaded = await uploadCloudFile(cloudPath, avatarUrl)
        avatarUrl = uploaded.fileID
      } catch (error) {
        console.warn('头像云端上传失败，将保存本地头像。', error)
      }
    }
    const profile = Object.assign({}, draft, { nickName: draft.nickName.trim(), avatarUrl })
    await saveUserProfile(profile)
    this.setData({ profile, editing: false })
    wx.showToast({ title: '资料已保存' })
  },

  openDetail(event) { wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` }) },
  goFavorite() { wx.navigateTo({ url: '/pages/favorite/favorite' }) },
  goDiscover() { wx.reLaunch({ url: '/pages/index/index' }) },
  goAdd() { wx.redirectTo({ url: '/pages/add/add' }) },
  onShareAppMessage() { return { title: `${this.data.profile.nickName}的拾光主页`, path: '/pages/homepage/homepage' } }
})
