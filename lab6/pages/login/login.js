const {
  defaultAvatar,
  saveProfile,
  saveUserProfile,
  uploadCloudFile
} = require('../../utils/data')

Page({
  data: {
    checking: false,
    showSetup: false,
    openidMask: '',
    identityState: '点击按钮识别当前微信身份',
    avatarUrl: defaultAvatar,
    nickName: '',
    province: '',
    bio: '用照片收藏生活中的微光'
  },

  onLoad() {
    this.restoreSession()
  },

  async restoreSession() {
    try {
      const app = getApp()
      const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
      if (!openid || !wx.cloud) return
      const { data } = await wx.cloud.database().collection('users').where({ _openid: openid }).limit(1).get()
      if (!data.length) return
      const user = data[0]
      const profile = {
        nickName: user.nickName || '拾光旅行者',
        avatarUrl: user.avatarUrl || defaultAvatar,
        province: user.province || '',
        country: user.country || '中国',
        bio: user.bio || '用照片收藏生活中的微光'
      }
      saveProfile(profile)
      wx.reLaunch({ url: '/pages/index/index' })
    } catch (error) {
      console.warn('自动恢复微信身份失败，等待用户手动登录。', error)
    }
  },

  async loginWithWechat() {
    if (this.data.checking) return
    this.setData({ checking: true, identityState: '正在识别微信身份…' })
    try {
      const app = getApp()
      const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
      if (!openid) throw new Error('openid unavailable')
      this.setData({ openidMask: `${openid.slice(0, 6)}····${openid.slice(-4)}`, identityState: '微信身份已识别' })

      const db = wx.cloud.database()
      const { data } = await db.collection('users').where({ _openid: openid }).limit(1).get()
      if (data.length) {
        const user = data[0]
        saveProfile({
          nickName: user.nickName || '拾光旅行者',
          avatarUrl: user.avatarUrl || defaultAvatar,
          province: user.province || '',
          country: user.country || '中国',
          bio: user.bio || '用照片收藏生活中的微光'
        })
        wx.reLaunch({ url: '/pages/index/index' })
        return
      }

      this.setData({ showSetup: true, checking: false })
    } catch (error) {
      console.error('登录失败', error)
      this.setData({ checking: false })
      wx.showModal({
        title: '登录失败',
        content: '请确认 getOpenid 云函数已部署，并且 users 集合已经创建。',
        showCancel: false
      })
    }
  },

  chooseAvatar(event) {
    this.setData({ avatarUrl: event.detail.avatarUrl })
  },

  inputNickname(event) {
    this.setData({ nickName: event.detail.value.trim() })
  },

  inputProvince(event) {
    this.setData({ province: event.detail.value.trim() })
  },

  inputBio(event) {
    this.setData({ bio: event.detail.value.trim() })
  },

  async completeProfile() {
    if (this.data.checking) return
    if (!this.data.nickName) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }

    this.setData({ checking: true })
    try {
      const app = getApp()
      const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
      if (!openid) throw new Error('openid unavailable')

      let avatarUrl = this.data.avatarUrl
      if (avatarUrl && !avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('/assets/')) {
        const extension = (avatarUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/) || [])[1] || 'jpg'
        const upload = await uploadCloudFile(`avatars/${openid}-${Date.now()}.${extension}`, avatarUrl)
        avatarUrl = upload.fileID
      }

      const profile = {
        nickName: this.data.nickName,
        avatarUrl: avatarUrl || defaultAvatar,
        province: this.data.province,
        country: '中国',
        bio: this.data.bio || '用照片收藏生活中的微光'
      }
      const saved = await saveUserProfile(profile)
      if (!saved) throw new Error('profile save failed')
      app.globalData.profile = profile
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 350)
    } catch (error) {
      console.error('创建用户资料失败', error)
      wx.showModal({
        title: '资料保存失败',
        content: '请检查 users 集合权限是否允许创建者读写，然后重试。',
        showCancel: false
      })
    } finally {
      this.setData({ checking: false })
    }
  }
})
