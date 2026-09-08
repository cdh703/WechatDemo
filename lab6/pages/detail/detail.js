const { findPhoto, getReaction, toggleReaction, getSavedProfile, formatDate } = require('../../utils/data')

Page({
  data: {
    loading: true,
    photo: null,
    liked: false,
    favorited: false,
    displayLikes: 0,
    displayFavorites: 0,
    comments: [],
    commentTotal: 0,
    commentContent: '',
    commentPlaceholder: '写下友善的评论…',
    replyTarget: null,
    sendingComment: false,
    isOwner: false
  },

  async onLoad(options) {
    this.photoId = options.id
    try {
      const photo = await findPhoto(options.id)
      if (!photo) throw new Error('照片不存在')
      const liked = getReaction('likes', photo._id)
      const favorited = getReaction('favorites', photo._id)
      this.setData({
        photo,
        liked,
        favorited,
        displayLikes: Number(photo.likeCount || 0) + (photo.isDemo && liked ? 1 : 0),
        displayFavorites: Number(photo.favoriteCount || 0) + (photo.isDemo && favorited ? 1 : 0),
        loading: false
      })
      if (!photo.isDemo && wx.cloud) {
        await this.loadCloudState()
        this.recordView()
        this.startWatch()
      }
      wx.setNavigationBarTitle({ title: photo.category || '图片详情' })
    } catch (error) {
      console.error(error)
      this.setData({ loading: false })
      wx.showToast({ title: '照片加载失败', icon: 'none' })
    }
  },

  async loadCloudState() {
    const app = getApp()
    const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
    this.setData({ isOwner: Boolean(openid && this.data.photo._openid === openid) })
    try {
      const photoQuery = wx.cloud.database().collection('photos').doc(this.photoId).get().catch(() => null)
      const [likeResult, favoriteResult, commentResult, photoDoc] = await Promise.all([
        wx.cloud.callFunction({ name: 'updateLike', data: { action: 'status', photoId: this.photoId } }),
        wx.cloud.callFunction({ name: 'toggleFavorite', data: { action: 'status', photoId: this.photoId } }),
        wx.cloud.callFunction({ name: 'commentService', data: { action: 'list', photoId: this.photoId } }),
        photoQuery
      ])
      const patch = {
        liked: likeResult.result.liked,
        favorited: favoriteResult.result.favorited,
        comments: this.buildCommentTree(commentResult.result.comments || []),
        commentTotal: (commentResult.result.comments || []).length
      }
      if (photoDoc && photoDoc.data) {
        patch.displayLikes = Number(photoDoc.data.likeCount || 0)
        patch.displayFavorites = Number(photoDoc.data.favoriteCount || 0)
        patch['photo.likeCount'] = photoDoc.data.likeCount || 0
        patch['photo.favoriteCount'] = photoDoc.data.favoriteCount || 0
      }
      this.setData(patch)
    } catch (error) {
      console.warn('社区扩展云函数尚未部署。', error)
    }
  },

  startWatch() {
    try {
      this.watcher = wx.cloud.database().collection('photos').doc(this.photoId).watch({
        onChange: (snapshot) => {
          const doc = snapshot.docs && snapshot.docs[0]
          if (!doc) return
          this.setData({
            displayLikes: Number(doc.likeCount || 0),
            displayFavorites: Number(doc.favoriteCount || 0),
            'photo.likeCount': doc.likeCount || 0,
            'photo.favoriteCount': doc.favoriteCount || 0,
            'photo.viewCount': doc.viewCount || 0
          })
        },
        onError: (error) => console.warn('photos 实时监听失败。', error)
      })
    } catch (error) {
      console.warn('实时监听不可用。', error)
    }
  },

  onUnload() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  },

  async recordView() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'recordView', data: { photoId: this.photoId } })
      this.setData({ 'photo.viewCount': result.viewCount })
    } catch (error) {
      console.warn('浏览量统计云函数未部署。', error)
    }
  },

  buildCommentTree(flatComments) {
    const roots = []
    const rootMap = {}
    flatComments.forEach((comment) => {
      if (!comment.rootId) {
        const root = Object.assign({}, comment, { replies: [] })
        roots.push(root)
        rootMap[root._id] = root
      }
    })
    flatComments.forEach((comment) => {
      if (comment.rootId && rootMap[comment.rootId]) rootMap[comment.rootId].replies.push(comment)
    })
    return roots
  },

  previewPhoto() {
    if (!this.data.photo) return
    wx.previewImage({ current: this.data.photo.photoUrl, urls: [this.data.photo.photoUrl] })
  },

  async toggleLike() {
    if (!this.data.photo.isDemo && wx.cloud) {
      try {
        const { result } = await wx.cloud.callFunction({ name: 'updateLike', data: { photoId: this.photoId } })
        const likeCount = typeof result.likeCount === 'number' ? result.likeCount : Math.max(0, this.data.displayLikes + result.delta)
        this.setData({ liked: result.liked, displayLikes: likeCount, 'photo.likeCount': likeCount })
        return wx.showToast({ title: result.liked ? '已点赞' : '已取消', icon: 'none' })
      } catch (error) {
        console.warn('点赞云函数调用失败，改为本地记录。', error)
        wx.showToast({ title: '云端同步失败，已本地记录', icon: 'none' })
      }
    }
    const liked = toggleReaction('likes', this.photoId)
    this.setData({ liked, displayLikes: Math.max(0, this.data.displayLikes + (liked ? 1 : -1)) })
  },

  async toggleFavorite() {
    if (!this.data.photo.isDemo && wx.cloud) {
      try {
        const { result } = await wx.cloud.callFunction({ name: 'toggleFavorite', data: { photoId: this.photoId } })
        const favoriteCount = typeof result.favoriteCount === 'number' ? result.favoriteCount : Math.max(0, this.data.displayFavorites + (result.favorited ? 1 : -1))
        this.setData({ favorited: result.favorited, displayFavorites: favoriteCount, 'photo.favoriteCount': favoriteCount })
        return wx.showToast({ title: result.favorited ? '已收藏' : '已取消收藏', icon: 'none' })
      } catch (error) {
        console.warn('收藏云函数调用失败，改为本地记录。', error)
        wx.showToast({ title: '云端同步失败，已本地记录', icon: 'none' })
      }
    }
    const favorited = toggleReaction('favorites', this.photoId)
    this.setData({ favorited, displayFavorites: Math.max(0, this.data.displayFavorites + (favorited ? 1 : -1)) })
    wx.showToast({ title: favorited ? '已收藏' : '已取消收藏', icon: 'none' })
  },

  onCommentInput(event) { this.setData({ commentContent: event.detail.value }) },

  startReply(event) {
    const { commentid, rootid, nickname } = event.currentTarget.dataset
    this.setData({
      replyTarget: { commentId: commentid, rootId: rootid, nickName: nickname },
      commentPlaceholder: `回复 @${nickname}`
    })
  },

  cancelReply() {
    this.setData({ replyTarget: null, commentPlaceholder: '写下友善的评论…' })
  },

  async sendComment() {
    const content = this.data.commentContent.trim()
    if (!content || this.data.sendingComment) return
    const profile = getSavedProfile()
    if (this.data.photo.isDemo) {
      const isReply = Boolean(this.data.replyTarget)
      const localComment = {
        _id: `local-${Date.now()}`,
        nickName: profile.nickName,
        avatarUrl: profile.avatarUrl,
        content,
        displayTime: formatDate(new Date()),
        liked: false,
        likeCount: 0,
        isMine: true,
        replies: []
      }
      const comments = this.data.comments.slice()
      if (this.data.replyTarget) {
        const rootIndex = comments.findIndex((item) => item._id === this.data.replyTarget.rootId)
        if (rootIndex >= 0) {
          localComment.rootId = this.data.replyTarget.rootId
          localComment.replyToCommentId = this.data.replyTarget.commentId
          localComment.replyToNickName = this.data.replyTarget.nickName
          comments[rootIndex].replies = [localComment].concat(comments[rootIndex].replies || [])
        }
      } else comments.unshift(localComment)
      this.setData({ comments, commentTotal: this.data.commentTotal + 1, commentContent: '', replyTarget: null, commentPlaceholder: '写下友善的评论…' })
      return wx.showToast({ title: isReply ? '演示回复已添加' : '演示评论已添加' })
    }
    this.setData({ sendingComment: true })
    try {
      await wx.cloud.callFunction({
        name: 'commentService',
        data: {
          action: 'add', photoId: this.photoId, content,
          replyToCommentId: this.data.replyTarget ? this.data.replyTarget.commentId : '',
          nickName: profile.nickName, avatarUrl: profile.avatarUrl, displayTime: formatDate(new Date())
        }
      })
      this.setData({ commentContent: '', replyTarget: null, commentPlaceholder: '写下友善的评论…' })
      await this.loadCloudState()
      wx.showToast({ title: '评论成功' })
    } catch (error) {
      const blocked = error && error.message && error.message.indexOf('违规') >= 0
      wx.showToast({ title: blocked ? '评论包含违规内容，请修改后再发布' : (this.data.photo.allowComment === false ? '作者未开启评论' : '评论服务未部署'), icon: 'none' })
    } finally {
      this.setData({ sendingComment: false })
    }
  },

  async toggleCommentLike(event) {
    const commentId = event.currentTarget.dataset.id
    if (this.data.photo.isDemo) {
      const comments = this.data.comments.map((root) => {
        if (root._id === commentId) return Object.assign({}, root, { liked: !root.liked, likeCount: Math.max(0, Number(root.likeCount || 0) + (root.liked ? -1 : 1)) })
        return Object.assign({}, root, { replies: (root.replies || []).map((reply) => reply._id === commentId ? Object.assign({}, reply, { liked: !reply.liked, likeCount: Math.max(0, Number(reply.likeCount || 0) + (reply.liked ? -1 : 1)) }) : reply) })
      })
      return this.setData({ comments })
    }
    try {
      const { result } = await wx.cloud.callFunction({ name: 'commentService', data: { action: 'toggleLike', photoId: this.photoId, commentId } })
      const comments = this.data.comments.map((root) => {
        if (root._id === commentId) return Object.assign({}, root, result)
        return Object.assign({}, root, { replies: (root.replies || []).map((reply) => reply._id === commentId ? Object.assign({}, reply, result) : reply) })
      })
      this.setData({ comments })
    } catch (error) {
      wx.showToast({ title: '点赞失败，请稍后重试', icon: 'none' })
    }
  },

  deleteComment(event) {
    const { id, rootid } = event.currentTarget.dataset
    wx.showModal({
      title: '删除评论', content: rootid ? '确定删除这条回复吗？' : '主评论及其全部回复都会删除。', confirmColor: '#e34d59',
      success: async ({ confirm }) => {
        if (!confirm) return
        if (this.data.photo.isDemo) {
          let removed = 0
          let comments
          if (!rootid) {
            const target = this.data.comments.find((item) => item._id === id)
            removed = target ? 1 + (target.replies || []).length : 0
            comments = this.data.comments.filter((item) => item._id !== id)
          } else {
            removed = 1
            comments = this.data.comments.map((root) => Object.assign({}, root, { replies: (root.replies || []).filter((reply) => reply._id !== id) }))
          }
          return this.setData({ comments, commentTotal: Math.max(0, this.data.commentTotal - removed) })
        }
        try {
          await wx.cloud.callFunction({ name: 'commentService', data: { action: 'delete', photoId: this.photoId, commentId: id } })
          await this.loadCloudState()
          wx.showToast({ title: '评论已删除' })
        } catch (error) { wx.showToast({ title: '删除失败', icon: 'none' }) }
      }
    })
  },

  deletePhoto() {
    wx.showModal({
      title: '删除作品', content: '将同时删除云存储图片及相关互动，且无法恢复。', confirmColor: '#e34d59',
      success: async ({ confirm }) => {
        if (!confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          await wx.cloud.callFunction({ name: 'deletePhoto', data: { photoId: this.photoId } })
          wx.hideLoading(); wx.showToast({ title: '已删除' })
          setTimeout(() => wx.navigateBack({ delta: 1 }), 700)
        } catch (error) {
          wx.hideLoading(); wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  },

  downloadPhoto() {
    const photo = this.data.photo
    if (!photo) return
    wx.showLoading({ title: '保存中' })
    const save = (filePath) => wx.saveImageToPhotosAlbum({
      filePath,
      success: () => wx.showToast({ title: '已保存到相册' }),
      fail: () => wx.showToast({ title: '未能保存，请检查相册权限', icon: 'none' }),
      complete: () => wx.hideLoading()
    })

    if (photo.photoUrl.startsWith('cloud://')) {
      wx.cloud.downloadFile({ fileID: photo.photoUrl }).then(({ tempFilePath }) => save(tempFilePath)).catch(() => {
        wx.hideLoading(); wx.showToast({ title: '下载失败', icon: 'none' })
      })
    } else {
      wx.getImageInfo({ src: photo.photoUrl, success: ({ path }) => save(path), fail: () => { wx.hideLoading(); wx.showToast({ title: '图片读取失败', icon: 'none' }) } })
    }
  },

  openAuthor() {
    const photo = this.data.photo
    if (!photo) return
    wx.navigateTo({ url: `/pages/homepage/homepage?openid=${photo._openid || ''}&nickname=${encodeURIComponent(photo.nickName || '')}` })
  },

  onShareAppMessage() {
    const photo = this.data.photo || {}
    return {
      title: photo.title || '分享一张好照片',
      path: `/pages/detail/detail?id=${photo._id || this.photoId}`,
      imageUrl: photo.photoUrl
    }
  }
})
