const FAVORITE_PREFIX = 'news-favorite:'
const HISTORY_PREFIX = 'news-history:'
const LIKE_PREFIX = 'news-like:'
const COMMENT_PREFIX = 'news-comments:'
const USER_PROFILE_KEY = 'news-user-profile'
const PRIVACY_CONSENT_KEY = 'news-privacy-consent'
const PRIVACY_VERSION = '1.2'
const LOGIN_PROMPT_KEY = 'news-login-required-action'
const theme = require('../../utils/theme.js')
const PERSONAL_DATA_PREFIXES = [
  FAVORITE_PREFIX,
  HISTORY_PREFIX,
  LIKE_PREFIX,
  COMMENT_PREFIX,
  'news-view-count:'
]

function formatViewedTime(timestamp) {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

Page({
  data: {
    isLogin: false,
    userInfo: {},
    newsList: [],
    favoriteCount: 0,
    historyList: [],
    historyCount: 0,
    likedList: [],
    likedCount: 0,
    commentList: [],
    commentCount: 0,
    activeSection: 'favorites',
    consentChecked: false,
    privacyConsentRecorded: false,
    isAuthorizing: false,
    avatarUploading: false,
    isDarkMode: false,
    showPolicySheet: false,
    policyType: 'privacy'
  },

  onLoad() {
    theme.syncTheme(this)
    this.syncPrivacyConsent()
    this.syncUserProfile()
  },

  onShow() {
    theme.syncTheme(this)
    this.syncPrivacyConsent()
    this.syncUserProfile()
    this.getMyFavorites()
    this.getRecentHistory()
    this.getLikedNews()
    this.getMyComments()
    this.showLoginRequiredPrompt()
  },

  showLoginRequiredPrompt() {
    const action = wx.getStorageSync(LOGIN_PROMPT_KEY)
    if (!action) return

    wx.removeStorageSync(LOGIN_PROMPT_KEY)
    if (!this.data.isLogin) {
      wx.showToast({
        title: `请先登录后再${action}`,
        icon: 'none',
        duration: 2200
      })
    }
  },

  syncUserProfile() {
    const userInfo = wx.getStorageSync(USER_PROFILE_KEY)
    const consent = wx.getStorageSync(PRIVACY_CONSENT_KEY)
    const canLogin = Boolean(
      userInfo && consent && consent.version === PRIVACY_VERSION
    )

    if (userInfo && !canLogin) wx.removeStorageSync(USER_PROFILE_KEY)
    this.setData({
      isLogin: canLogin,
      userInfo: canLogin ? userInfo : {}
    })
  },

  syncPrivacyConsent() {
    const consent = wx.getStorageSync(PRIVACY_CONSENT_KEY)
    const isValid = Boolean(consent && consent.version === PRIVACY_VERSION)
    this.setData({
      consentChecked: isValid,
      privacyConsentRecorded: isValid
    })
  },

  onConsentChange(event) {
    this.setData({
      consentChecked: event.detail.value.indexOf('agreed') !== -1
    })
  },

  startAuthorizationFlow() {
    if (!this.data.consentChecked) {
      wx.showToast({ title: '请先阅读并同意相关协议', icon: 'none' })
      return
    }

    this.setData({ isAuthorizing: true })
    wx.showModal({
      title: '头像与昵称授权',
      content: '小程序申请使用你的头像和昵称，用于个人主页与评论身份展示。课程测试将使用“校”字头像和“海大读者”昵称，不读取微信真实资料。',
      confirmText: '允许',
      cancelText: '暂不允许',
      confirmColor: '#034d91',
      success: (result) => {
        if (result.confirm) {
          this.confirmPhoneAuthorization()
        } else {
          this.setData({ isAuthorizing: false })
        }
      },
      fail: () => {
        this.setData({ isAuthorizing: false })
      }
    })
  },

  confirmPhoneAuthorization() {
    wx.showModal({
      title: '手机号授权',
      content: '小程序申请使用手机号进行快捷登录和账号安全识别。点击允许后，将使用脱敏测试号码 138****0000 直接登录，不会读取或上传真实手机号。',
      confirmText: '允许',
      cancelText: '暂不允许',
      confirmColor: '#034d91',
      success: (result) => {
        if (result.confirm) {
          this.completeLocalLogin({
            phoneLabel: '138****0000（测试）',
            phoneAuthMode: 'demo'
          })
        } else {
          this.setData({ isAuthorizing: false })
        }
      },
      fail: () => {
        this.setData({ isAuthorizing: false })
      }
    })
  },

  completeLocalLogin(phoneAuth) {
    const userInfo = {
      nickName: '海大读者',
      avatarUrl: '',
      isLocalProfile: true,
      phoneLabel: phoneAuth.phoneLabel,
      phoneAuthMode: phoneAuth.phoneAuthMode
    }
    const consent = {
      version: PRIVACY_VERSION,
      agreedAt: Date.now()
    }

    wx.setStorageSync(USER_PROFILE_KEY, userInfo)
    wx.setStorageSync(PRIVACY_CONSENT_KEY, consent)
    this.setData({
      isLogin: true,
      userInfo,
      consentChecked: true,
      privacyConsentRecorded: true,
      isAuthorizing: false
    })
    wx.showToast({ title: '登录成功', icon: 'success' })
  },

  changeAvatar() {
    if (!this.data.isLogin || this.data.avatarUploading) return

    const handleSuccess = (tempFilePath) => {
      if (!tempFilePath) return
      this.setData({ avatarUploading: true })
      this.compressAvatar(tempFilePath)
    }
    const handleFail = (error) => {
      const message = (error && error.errMsg) || ''
      if (message.indexOf('cancel') === -1) {
        wx.showToast({ title: '无法读取所选图片', icon: 'none' })
      }
    }

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (result) => handleSuccess(result.tempFiles[0].tempFilePath),
        fail: handleFail
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => handleSuccess(result.tempFilePaths[0]),
      fail: handleFail
    })
  },

  compressAvatar(tempFilePath) {
    if (!wx.compressImage) {
      this.persistAvatar(tempFilePath)
      return
    }

    wx.compressImage({
      src: tempFilePath,
      quality: 72,
      success: (result) => this.persistAvatar(result.tempFilePath),
      fail: () => this.persistAvatar(tempFilePath)
    })
  },

  persistAvatar(tempFilePath) {
    if (!wx.saveFile) {
      this.applyAvatar(tempFilePath)
      return
    }

    wx.saveFile({
      tempFilePath,
      success: (result) => this.applyAvatar(result.savedFilePath),
      fail: () => {
        this.setData({ avatarUploading: false })
        wx.showToast({ title: '头像保存失败，请重试', icon: 'none' })
      }
    })
  },

  applyAvatar(avatarUrl) {
    const oldAvatarUrl = this.data.userInfo.avatarUrl
    const userInfo = {
      ...this.data.userInfo,
      avatarUrl
    }

    wx.setStorageSync(USER_PROFILE_KEY, userInfo)
    this.updateStoredAvatarReferences(userInfo.nickName, avatarUrl)
    this.setData({
      userInfo,
      avatarUploading: false
    })
    this.getMyComments()

    if (oldAvatarUrl && oldAvatarUrl !== avatarUrl && wx.removeSavedFile) {
      wx.removeSavedFile({ filePath: oldAvatarUrl })
    }
    wx.showToast({ title: '头像已更新', icon: 'success' })
  },

  updateStoredAvatarReferences(nickname, avatarUrl) {
    const keys = wx.getStorageInfoSync().keys
      .filter((key) => key.indexOf(COMMENT_PREFIX) === 0)

    keys.forEach((key) => {
      const comments = wx.getStorageSync(key) || []
      const updatedComments = comments.map((comment) => ({
        ...comment,
        avatarUrl: comment.nickname === nickname ? avatarUrl : comment.avatarUrl,
        replies: (comment.replies || []).map((reply) => ({
          ...reply,
          avatarUrl: reply.nickname === nickname ? avatarUrl : reply.avatarUrl
        }))
      }))
      wx.setStorageSync(key, updatedComments)
    })
  },

  openPrivacyPolicy() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        fail: () => this.openPolicySheet('privacy')
      })
      return
    }
    this.openPolicySheet('privacy')
  },

  openServiceAgreement() {
    this.openPolicySheet('service')
  },

  openPolicySheet(type) {
    this.setData({
      policyType: type,
      showPolicySheet: true
    })
  },

  closePolicySheet() {
    this.setData({ showPolicySheet: false })
  },

  stopPropagation() {},

  toggleTheme() {
    theme.toggleTheme(this)
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后将保留收藏、足迹、点赞和评论，确定退出吗？',
      confirmColor: '#034da2',
      success: (result) => {
        if (!result.confirm) return

        wx.removeStorageSync(USER_PROFILE_KEY)
        this.setData({
          isLogin: false,
          userInfo: {}
        })
        wx.showToast({ title: '已退出登录', icon: 'none' })
      }
    })
  },

  withdrawPrivacyConsent() {
    wx.showModal({
      title: '撤回本地授权',
      content: '将退出登录并删除本机保存的本地身份、手机号授权状态和同意记录。收藏、足迹等行为数据不会自动删除。',
      confirmText: '确认撤回',
      confirmColor: '#b34234',
      success: (result) => {
        if (!result.confirm) return

        wx.removeStorageSync(USER_PROFILE_KEY)
        wx.removeStorageSync(PRIVACY_CONSENT_KEY)
        this.setData({
          isLogin: false,
          userInfo: {},
          consentChecked: false,
          privacyConsentRecorded: false
        })
        wx.showToast({ title: '本地授权已撤回', icon: 'none' })
      }
    })
  },

  clearPersonalData() {
    wx.showModal({
      title: '清理个人痕迹',
      content: '将永久删除当前设备中的收藏、浏览、点赞、评论和阅读量记录，此操作不可恢复。',
      confirmText: '确认清理',
      confirmColor: '#b34234',
      success: (result) => {
        if (!result.confirm) return

        const keys = wx.getStorageInfoSync().keys
        keys
          .filter((key) => PERSONAL_DATA_PREFIXES.some((prefix) => key.indexOf(prefix) === 0))
          .forEach((key) => wx.removeStorageSync(key))

        this.getMyFavorites()
        this.getRecentHistory()
        this.getLikedNews()
        this.getMyComments()
        wx.showToast({ title: '个人痕迹已清理', icon: 'success' })
      }
    })
  },

  getMyFavorites() {
    const keys = wx.getStorageInfoSync().keys
    const newsList = keys
      .filter((key) => key.indexOf(FAVORITE_PREFIX) === 0)
      .map((key) => wx.getStorageSync(key))
      .filter((article) => article && article.id)

    this.setData({
      newsList,
      favoriteCount: newsList.length
    })
  },

  getRecentHistory() {
    const keys = wx.getStorageInfoSync().keys
    const historyList = keys
      .filter((key) => key.indexOf(HISTORY_PREFIX) === 0)
      .map((key) => wx.getStorageSync(key))
      .filter((article) => article && article.id)
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 10)
      .map((article) => ({
        ...article,
        viewedText: formatViewedTime(article.viewedAt)
      }))

    this.setData({
      historyList,
      historyCount: historyList.length
    })
  },

  getLikedNews() {
    const keys = wx.getStorageInfoSync().keys
    const likedList = keys
      .filter((key) => key.indexOf(LIKE_PREFIX) === 0)
      .map((key) => wx.getStorageSync(key))
      .filter((article) => article && article.id)
      .sort((a, b) => b.likedAt - a.likedAt)
      .map((article) => ({
        ...article,
        likedText: formatViewedTime(article.likedAt)
      }))

    this.setData({
      likedList,
      likedCount: likedList.length
    })
  },

  getMyComments() {
    const keys = wx.getStorageInfoSync().keys
    const commentList = keys
      .filter((key) => key.indexOf(COMMENT_PREFIX) === 0)
      .reduce((list, key) => {
        const comments = wx.getStorageSync(key) || []
        comments.forEach((comment) => {
          list.push(comment)
          const replies = comment.replies || []
          replies.forEach((reply) => {
            list.push({
              ...reply,
              articleId: reply.articleId || comment.articleId,
              articleTitle: reply.articleTitle || comment.articleTitle,
              content: `回复 ${comment.nickname}：${reply.content}`
            })
          })
        })
        return list
      }, [])
      .filter((comment) => comment && comment.id)
      .sort((a, b) => b.createdAt - a.createdAt)

    this.setData({
      commentList,
      commentCount: commentList.length
    })
  },

  switchSection(event) {
    this.setData({ activeSection: event.currentTarget.dataset.section })
  },

  goToDetail(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
