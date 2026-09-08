const { fetchPhotoPage, getSavedProfile } = require('../../utils/data')

// 在这里配置你的歌曲：把 mp3 上传到 云开发控制台 → 存储（建议建 music/ 目录），
// 复制文件的 File ID（cloud:// 开头）填到 src；也可以直接填 https 链接。
const playlist = [
  { title: '歌曲一', singer: '歌手一', src: '' },
  { title: '歌曲二', singer: '歌手二', src: '' },
  { title: '歌曲三', singer: '歌手三', src: '' }
]

Page({
  data: {
    loading: true,
    loadingMore: false,
    hasMore: true,
    pageSize: 10,
    skeletons: [1, 2, 3, 4],
    keyword: '',
    sortMode: 'new',
    playlist,
    musicIndex: 0,
    musicTitle: playlist.length ? playlist[0].title : '',
    musicPlaying: false,
    musicOpen: false,
    activeCategory: '全部',
    categories: ['全部', '自然', '旅行', '城市', '生活'],
    photos: [],
    visiblePhotos: [],
    featured: null,
    userAvatar: getSavedProfile().avatarUrl,
    userName: getSavedProfile().nickName
  },

  onLoad() {
    this.initMusic()
    this.loadPhotos()
  },

  initMusic() {
    const audio = this.audio = wx.getBackgroundAudioManager()
    audio.onPlay(() => this.setData({ musicPlaying: true }))
    audio.onPause(() => this.setData({ musicPlaying: false }))
    audio.onStop(() => this.setData({ musicPlaying: false }))
    audio.onEnded(() => this.nextSong())
    audio.onError(() => {
      this.setData({ musicPlaying: false })
      wx.showToast({ title: '音乐加载失败，请检查歌曲链接', icon: 'none' })
    })
  },

  async playSong(index) {
    const song = this.data.playlist[index]
    if (!song) return
    if (!song.src) {
      this.setData({ musicOpen: false })
      return wx.showToast({ title: '请在 index.js 顶部配置歌曲链接', icon: 'none' })
    }
    let src = song.src
    if (src.startsWith('cloud://')) {
      try {
        const { fileList } = await wx.cloud.getTempFileURL({ fileList: [src] })
        src = fileList[0].tempFileURL
      } catch (error) {
        return wx.showToast({ title: '音乐链接获取失败', icon: 'none' })
      }
    }
    this.audio.title = song.title
    this.audio.singer = song.singer || ''
    this.audio.src = src
    this.setData({ musicIndex: index, musicTitle: song.title, musicOpen: false })
  },

  toggleMusic() {
    if (!this.audio.src) return this.playSong(this.data.musicIndex)
    if (this.data.musicPlaying) this.audio.pause()
    else this.audio.play()
  },

  nextSong() {
    if (!this.data.playlist.length) return
    this.playSong((this.data.musicIndex + 1) % this.data.playlist.length)
  },

  toggleMusicPanel() {
    this.setData({ musicOpen: !this.data.musicOpen })
  },

  chooseSong(event) {
    this.playSong(Number(event.currentTarget.dataset.index))
  },

  onShow() {
    const profile = getSavedProfile()
    this.setData({ userAvatar: profile.avatarUrl, userName: profile.nickName })
    if (!this.data.loading) this.loadPhotos(false)
  },

  onPullDownRefresh() {
    this.loadPhotos(false).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    this.loadMore()
  },

  async loadPhotos(showLoading = true) {
    if (showLoading) this.setData({ loading: true })
    const result = await fetchPhotoPage(0, this.data.pageSize, this.data.sortMode)
    const photos = result.photos
    this.setData({ photos, featured: photos[0] || null, loading: false, hasMore: result.hasMore })
    this.applyFilters()
  },

  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore || this.data.keyword) return
    this.setData({ loadingMore: true })
    const result = await fetchPhotoPage(this.data.photos.length, this.data.pageSize, this.data.sortMode)
    this.setData({ photos: this.data.photos.concat(result.photos), hasMore: result.hasMore, loadingMore: false })
    this.applyFilters()
  },

  onSearch(event) {
    this.setData({ keyword: event.detail.value.trim() })
    this.applyFilters()
  },

  switchSort(event) {
    const sortMode = event.currentTarget.dataset.mode
    if (sortMode === this.data.sortMode) return
    this.setData({ sortMode })
    this.loadPhotos()
  },

  chooseCategory(event) {
    this.setData({ activeCategory: event.currentTarget.dataset.category })
    this.applyFilters()
  },

  applyFilters() {
    const { photos, keyword, activeCategory } = this.data
    const lowered = keyword.toLowerCase()
    const visiblePhotos = photos.filter((photo) => {
      const categoryMatched = activeCategory === '全部' || photo.category === activeCategory
      const text = `${photo.title} ${photo.nickName} ${(photo.tags || []).join(' ')}`.toLowerCase()
      return categoryMatched && (!lowered || text.includes(lowered))
    })
    this.setData({ visiblePhotos })
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` })
  },

  openAuthor(event) {
    const { openid, nickname } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/homepage/homepage?openid=${openid || ''}&nickname=${encodeURIComponent(nickname || '')}` })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goCategoryManager() {
    wx.navigateTo({ url: `/pages/category/index?type=${this.data.activeCategory}` })
  },

  goHome() {
    wx.navigateTo({ url: '/pages/homepage/homepage' })
  },

  onShareAppMessage() {
    return { title: '拾光社区｜发现值得收藏的瞬间', path: '/pages/index/index' }
  }
})
