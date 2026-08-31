const common = require('../../utils/common.js')
const theme = require('../../utils/theme.js')

const FAVORITE_PREFIX = 'news-favorite:'
const HISTORY_PREFIX = 'news-history:'
const LIKE_PREFIX = 'news-like:'
const VIEW_COUNT_PREFIX = 'news-view-count:'
const FONT_SIZE_KEY = 'news-font-size'
const USER_PROFILE_KEY = 'news-user-profile'
const PRIVACY_CONSENT_KEY = 'news-privacy-consent'
const PRIVACY_VERSION = '1.2'
const LOGIN_PROMPT_KEY = 'news-login-required-action'
const COMMENT_PREFIX = 'news-comments:'

function formatCommentTime(timestamp) {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

Page({
  data: {
    article: {},
    isFavorite: false,
    isLiked: false,
    notFound: false,
    fontSize: 'medium',
    viewCount: 0,
    relatedNews: [],
    userInfo: {},
    commentText: '',
    replyingToId: '',
    replyingToName: '',
    replyText: '',
    comments: [],
    commentCount: 0,
    readProgress: 0,
    showBackTop: false,
    isDarkMode: false
  },

  onLoad(options) {
    theme.syncTheme(this)
    const result = common.getNewsDetail(options.id)

    if (result.code !== '200') {
      this.setData({ notFound: true })
      return
    }

    const localViews = (Number(wx.getStorageSync(`${VIEW_COUNT_PREFIX}${result.news.id}`)) || 0) + 1
    wx.setStorageSync(`${VIEW_COUNT_PREFIX}${result.news.id}`, localViews)

    const userInfo = this.getCurrentUser()
    this.setData({
      article: result.news,
      isFavorite: Boolean(userInfo && wx.getStorageSync(`${FAVORITE_PREFIX}${result.news.id}`)),
      isLiked: Boolean(userInfo && wx.getStorageSync(`${LIKE_PREFIX}${result.news.id}`)),
      userInfo: userInfo || {},
      fontSize: wx.getStorageSync(FONT_SIZE_KEY) || 'medium',
      viewCount: result.news.baseViews + localViews,
      relatedNews: common.getRelatedNews(result.news.id, 2)
    })
    this.recordHistory(result.news)
    this.syncCommentData()
  },

  onShow() {
    theme.syncTheme(this)
    if (this.data.article.id) this.syncPersonalState()
  },

  onReady() {
    this.updatePageMetrics()
  },

  updatePageMetrics() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    wx.createSelectorQuery()
      .select('.detail-page')
      .boundingClientRect((rect) => {
        if (!rect) return
        this.pageMetrics = {
          contentHeight: rect.height,
          windowHeight: windowInfo.windowHeight
        }
      })
      .exec()
  },

  onPageScroll(event) {
    if (!this.pageMetrics) return

    const scrollableHeight = this.pageMetrics.contentHeight - this.pageMetrics.windowHeight
    const readProgress = scrollableHeight > 0
      ? Math.min(100, Math.round((event.scrollTop / scrollableHeight) * 100))
      : 100
    const showBackTop = event.scrollTop > 500

    if (readProgress !== this.data.readProgress || showBackTop !== this.data.showBackTop) {
      this.setData({ readProgress, showBackTop })
    }
  },

  recordHistory(article) {
    wx.setStorageSync(`${HISTORY_PREFIX}${article.id}`, {
      id: article.id,
      title: article.title,
      poster: article.poster,
      category: article.category,
      add_date: article.add_date,
      viewedAt: Date.now()
    })
  },

  getCurrentUser() {
    const userInfo = wx.getStorageSync(USER_PROFILE_KEY)
    const consent = wx.getStorageSync(PRIVACY_CONSENT_KEY)
    if (!userInfo || !userInfo.nickName) return null
    if (!consent || consent.version !== PRIVACY_VERSION) return null
    return userInfo
  },

  requireLogin(action) {
    const userInfo = this.getCurrentUser()
    if (userInfo) {
      if (!this.data.userInfo.nickName) this.setData({ userInfo })
      return true
    }

    wx.setStorageSync(LOGIN_PROMPT_KEY, action)
    wx.switchTab({ url: '/pages/my/my' })
    return false
  },

  syncPersonalState() {
    const articleId = this.data.article.id
    const userInfo = this.getCurrentUser()
    this.setData({
      userInfo: userInfo || {},
      isFavorite: Boolean(userInfo && wx.getStorageSync(`${FAVORITE_PREFIX}${articleId}`)),
      isLiked: Boolean(userInfo && wx.getStorageSync(`${LIKE_PREFIX}${articleId}`))
    })
    this.syncCommentData()
  },

  syncCommentData() {
    const articleId = this.data.article.id
    const comments = (wx.getStorageSync(`${COMMENT_PREFIX}${articleId}`) || []).map((comment) => ({
      ...comment,
      likeCount: Number(comment.likeCount) || 0,
      isLiked: Boolean(comment.isLiked),
      replies: comment.replies || []
    }))
    this.setData({
      userInfo: this.getCurrentUser() || {},
      comments,
      commentCount: this.countComments(comments)
    })
  },

  countComments(comments) {
    return comments.reduce((total, comment) => total + 1 + (comment.replies || []).length, 0)
  },

  saveComments(comments) {
    wx.setStorageSync(`${COMMENT_PREFIX}${this.data.article.id}`, comments)
    this.setData({
      comments,
      commentCount: this.countComments(comments)
    })
  },

  setFontSize(event) {
    const fontSize = event.currentTarget.dataset.size
    wx.setStorageSync(FONT_SIZE_KEY, fontSize)
    this.setData({ fontSize })
    this.updatePageMetrics()
  },

  backToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },

  addFavorite() {
    if (!this.requireLogin('收藏新闻')) return
    const article = this.data.article
    wx.setStorageSync(`${FAVORITE_PREFIX}${article.id}`, article)
    this.setData({ isFavorite: true })
    wx.showToast({ title: '收藏成功', icon: 'success' })
  },

  cancelFavorite() {
    if (!this.requireLogin('管理收藏')) return
    const article = this.data.article
    wx.removeStorageSync(`${FAVORITE_PREFIX}${article.id}`)
    this.setData({ isFavorite: false })
    wx.showToast({ title: '已取消收藏', icon: 'none' })
  },

  toggleLike() {
    if (!this.requireLogin('点赞新闻')) return
    const article = this.data.article
    const key = `${LIKE_PREFIX}${article.id}`

    if (this.data.isLiked) {
      wx.removeStorageSync(key)
      this.setData({ isLiked: false })
      wx.showToast({ title: '已取消点赞', icon: 'none' })
      return
    }

    wx.setStorageSync(key, {
      id: article.id,
      title: article.title,
      poster: article.poster,
      category: article.category,
      add_date: article.add_date,
      likedAt: Date.now()
    })
    this.setData({ isLiked: true })
    wx.showToast({ title: '点赞成功', icon: 'success' })
  },

  copyTitle() {
    wx.setClipboardData({
      data: this.data.article.title
    })
  },

  onCommentInput(event) {
    this.setData({ commentText: event.detail.value })
  },

  publishComment() {
    if (!this.requireLogin('发表评论')) return
    const content = this.data.commentText.trim()
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    const now = Date.now()
    const comment = {
      id: `${now}-${Math.floor(Math.random() * 1000)}`,
      articleId: this.data.article.id,
      articleTitle: this.data.article.title,
      nickname: this.data.userInfo.nickName,
      avatarUrl: this.data.userInfo.avatarUrl,
      content,
      likeCount: 0,
      isLiked: false,
      replies: [],
      createdAt: now,
      createdText: formatCommentTime(now)
    }
    const comments = [comment, ...this.data.comments]

    this.saveComments(comments)
    this.setData({ commentText: '' })
    wx.showToast({ title: '评论已发布', icon: 'success' })
  },

  toggleCommentLike(event) {
    if (!this.requireLogin('点赞评论')) return
    const commentId = event.currentTarget.dataset.id
    const comments = this.data.comments.map((comment) => {
      if (comment.id !== commentId) return comment
      const isLiked = !comment.isLiked
      return {
        ...comment,
        isLiked,
        likeCount: Math.max(0, (Number(comment.likeCount) || 0) + (isLiked ? 1 : -1))
      }
    })
    this.saveComments(comments)
  },

  startReply(event) {
    if (!this.requireLogin('回复评论')) return
    this.setData({
      replyingToId: event.currentTarget.dataset.id,
      replyingToName: event.currentTarget.dataset.name,
      replyText: ''
    })
  },

  cancelReply() {
    this.setData({
      replyingToId: '',
      replyingToName: '',
      replyText: ''
    })
  },

  onReplyInput(event) {
    this.setData({ replyText: event.detail.value })
  },

  publishReply(event) {
    if (!this.requireLogin('回复评论')) return
    const content = this.data.replyText.trim()
    if (!content) {
      wx.showToast({ title: '请输入回复内容', icon: 'none' })
      return
    }

    const now = Date.now()
    const reply = {
      id: `reply-${now}-${Math.floor(Math.random() * 1000)}`,
      articleId: this.data.article.id,
      articleTitle: this.data.article.title,
      nickname: this.data.userInfo.nickName,
      avatarUrl: this.data.userInfo.avatarUrl,
      replyToName: this.data.replyingToName,
      content,
      createdAt: now,
      createdText: formatCommentTime(now)
    }
    const commentId = event.currentTarget.dataset.id
    const comments = this.data.comments.map((comment) => {
      if (comment.id !== commentId) return comment
      return {
        ...comment,
        replies: [...(comment.replies || []), reply]
      }
    })

    this.saveComments(comments)
    this.cancelReply()
    wx.showToast({ title: '回复已发布', icon: 'success' })
  },

  removeComment(event) {
    if (!this.requireLogin('管理评论')) return
    const commentId = event.currentTarget.dataset.id
    wx.showModal({
      title: '删除评论',
      content: '确定删除这条评论吗？',
      confirmColor: '#034da2',
      success: (result) => {
        if (!result.confirm) return

        const comments = this.data.comments.filter((item) => item.id !== commentId)
        this.saveComments(comments)
      }
    })
  },

  removeReply(event) {
    if (!this.requireLogin('管理回复')) return
    const commentId = event.currentTarget.dataset.commentId
    const replyId = event.currentTarget.dataset.replyId
    wx.showModal({
      title: '删除回复',
      content: '确定删除这条回复吗？',
      confirmColor: '#034da2',
      success: (result) => {
        if (!result.confirm) return

        const comments = this.data.comments.map((comment) => {
          if (comment.id !== commentId) return comment
          return {
            ...comment,
            replies: (comment.replies || []).filter((reply) => reply.id !== replyId)
          }
        })
        this.saveComments(comments)
      }
    })
  },

  goToLogin() {
    wx.setStorageSync(LOGIN_PROMPT_KEY, '发表评论')
    wx.switchTab({ url: '/pages/my/my' })
  },

  goToDetail(event) {
    wx.redirectTo({
      url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}`
    })
  },

  onShareAppMessage() {
    const article = this.data.article
    return {
      title: article.title,
      path: `/pages/detail/detail?id=${article.id}`
    }
  }
})
