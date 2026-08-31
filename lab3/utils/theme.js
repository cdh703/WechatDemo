const THEME_KEY = 'news-theme'

function getIsDarkMode() {
  return wx.getStorageSync(THEME_KEY) === 'dark'
}

function applyTheme(page, isDarkMode = getIsDarkMode()) {
  page.setData({ isDarkMode })

  if (wx.setNavigationBarColor) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: isDarkMode ? '#071a2b' : '#034da2'
    })
  }
  if (wx.setTabBarStyle) {
    wx.setTabBarStyle({
      color: isDarkMode ? '#8295a8' : '#777777',
      selectedColor: isDarkMode ? '#64bfd2' : '#034da2',
      backgroundColor: isDarkMode ? '#071522' : '#ffffff',
      borderStyle: isDarkMode ? 'white' : 'black'
    })
  }
  if (wx.setBackgroundColor) {
    wx.setBackgroundColor({
      backgroundColor: isDarkMode ? '#07131f' : '#edf2f6',
      backgroundColorTop: isDarkMode ? '#071a2b' : '#edf2f6',
      backgroundColorBottom: isDarkMode ? '#07131f' : '#edf2f6'
    })
  }
}

function syncTheme(page) {
  applyTheme(page, getIsDarkMode())
}

function toggleTheme(page) {
  const isDarkMode = !page.data.isDarkMode
  wx.setStorageSync(THEME_KEY, isDarkMode ? 'dark' : 'light')
  applyTheme(page, isDarkMode)
}

module.exports = {
  syncTheme,
  toggleTheme
}
