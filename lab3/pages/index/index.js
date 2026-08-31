const common = require('../../utils/common.js')
const theme = require('../../utils/theme.js')

const VIEW_COUNT_PREFIX = 'news-view-count:'
const SEARCH_HISTORY_KEY = 'news-search-history'
const MAX_SEARCH_HISTORY = 10

function formatViewCount(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  return String(count)
}

Page({
  data: {
    swiperImg: [],
    allNewsList: [],
    newsList: [],
    categories: ['全部', '校园生活', '合作交流'],
    hotKeywords: ['航天电子', '研究生', '迎新', '奖学金', '校企合作', '深海装备'],
    activeCategory: '全部',
    sortMode: 'latest',
    searchKeyword: '',
    resultCount: 0,
    searchHistory: [],
    isDarkMode: false
  },

  onLoad() {
    theme.syncTheme(this)
    this.loadSearchHistory()
    this.loadNews()
  },

  onShow() {
    theme.syncTheme(this)
    this.loadSearchHistory()
    if (this.hasShown) this.loadNews(true)
    this.hasShown = true
  },

  onPullDownRefresh() {
    this.loadNews()
    wx.stopPullDownRefresh()
    wx.showToast({ title: '新闻已刷新', icon: 'none' })
  },

  loadNews(preserveFilters = false) {
    const allNewsList = common.getNewsList().map((item) => {
      const localViews = Number(wx.getStorageSync(`${VIEW_COUNT_PREFIX}${item.id}`)) || 0
      const viewCount = item.baseViews + localViews
      return {
        ...item,
        viewCount,
        viewText: formatViewCount(viewCount)
      }
    })
    const searchKeyword = preserveFilters ? this.data.searchKeyword : ''
    const activeCategory = preserveFilters ? this.data.activeCategory : '全部'
    const sortMode = preserveFilters ? this.data.sortMode : 'latest'
    const newsList = this.filterNews(allNewsList, searchKeyword, activeCategory, sortMode)

    this.setData({
      allNewsList,
      newsList,
      resultCount: newsList.length,
      searchKeyword,
      activeCategory,
      sortMode,
      swiperImg: allNewsList.slice(0, 3).map((item) => ({
        id: item.id,
        src: item.poster,
        title: item.title
      }))
    })
  },

  onSearchInput(event) {
    const searchKeyword = event.detail.value
    const newsList = this.filterNews(
      this.data.allNewsList,
      searchKeyword,
      this.data.activeCategory,
      this.data.sortMode
    )

    this.setData({
      searchKeyword,
      newsList,
      resultCount: newsList.length
    })
  },

  onSearchConfirm(event) {
    this.applySearchKeyword(event.detail.value, true)
  },

  clearSearch() {
    const newsList = this.filterNews(
      this.data.allNewsList,
      '',
      this.data.activeCategory,
      this.data.sortMode
    )
    this.setData({
      searchKeyword: '',
      newsList,
      resultCount: newsList.length
    })
  },

  selectKeyword(event) {
    this.applySearchKeyword(event.currentTarget.dataset.keyword, true)
  },

  applySearchKeyword(keyword, shouldRecord = false) {
    const searchKeyword = keyword.trim()
    const newsList = this.filterNews(
      this.data.allNewsList,
      searchKeyword,
      this.data.activeCategory,
      this.data.sortMode
    )
    this.setData({
      searchKeyword,
      newsList,
      resultCount: newsList.length
    })
    if (shouldRecord) this.recordSearchKeyword(searchKeyword)
  },

  loadSearchHistory() {
    const searchHistory = wx.getStorageSync(SEARCH_HISTORY_KEY) || []
    this.setData({ searchHistory })
  },

  recordSearchKeyword(keyword) {
    if (!keyword) return
    const normalizedKeyword = keyword.toLowerCase()
    const searchHistory = [
      keyword,
      ...this.data.searchHistory.filter((item) => item.toLowerCase() !== normalizedKeyword)
    ].slice(0, MAX_SEARCH_HISTORY)
    wx.setStorageSync(SEARCH_HISTORY_KEY, searchHistory)
    this.setData({ searchHistory })
  },

  clearSearchHistory() {
    wx.showModal({
      title: '清空搜索记录',
      content: '确定清空全部历史搜索关键词吗？',
      confirmColor: '#034d91',
      success: (result) => {
        if (!result.confirm) return
        wx.removeStorageSync(SEARCH_HISTORY_KEY)
        this.setData({ searchHistory: [] })
      }
    })
  },

  toggleTheme() {
    theme.toggleTheme(this)
  },

  selectCategory(event) {
    const activeCategory = event.currentTarget.dataset.category
    const newsList = this.filterNews(
      this.data.allNewsList,
      this.data.searchKeyword,
      activeCategory,
      this.data.sortMode
    )
    this.setData({
      activeCategory,
      newsList,
      resultCount: newsList.length
    })
  },

  selectSortMode(event) {
    const sortMode = event.currentTarget.dataset.mode
    const newsList = this.filterNews(
      this.data.allNewsList,
      this.data.searchKeyword,
      this.data.activeCategory,
      sortMode
    )
    this.setData({
      sortMode,
      newsList
    })
  },

  filterNews(newsList, searchKeyword, activeCategory, sortMode) {
    const keyword = searchKeyword.trim().toLowerCase()
    return newsList
      .map((item) => {
        if (!keyword) return { ...item, searchScore: 0 }

        const terms = keyword.split(/\s+/).filter(Boolean)
        let searchScore = 0
        const matchesAllTerms = terms.every((term) => {
          let termScore = 0
          if (item.title.toLowerCase().includes(term)) termScore = Math.max(termScore, 100)
          if (item.keywords.some((word) => word.toLowerCase().includes(term))) {
            termScore = Math.max(termScore, 80)
          }
          if (`${item.category} ${item.author} ${item.source}`.toLowerCase().includes(term)) {
            termScore = Math.max(termScore, 60)
          }
          if (item.summary.toLowerCase().includes(term)) termScore = Math.max(termScore, 40)
          if (item.searchText.toLowerCase().includes(term)) termScore = Math.max(termScore, 20)
          searchScore += termScore
          return termScore > 0
        })

        return { ...item, searchScore: matchesAllTerms ? searchScore : -1 }
      })
      .filter((item) => {
        const matchesKeyword = !keyword || item.searchScore >= 0
        const matchesCategory = activeCategory === '全部' || item.category === activeCategory
        return matchesKeyword && matchesCategory
      })
      .sort((a, b) => {
        if (keyword && b.searchScore !== a.searchScore) return b.searchScore - a.searchScore
        if (sortMode === 'hot') return b.viewCount - a.viewCount
        return b.add_date.localeCompare(a.add_date)
      })
  },

  goToDetail(event) {
    const id = event.currentTarget.dataset.id
    if (this.data.searchKeyword) this.recordSearchKeyword(this.data.searchKeyword.trim())
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
