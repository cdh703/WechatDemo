const { demoPhotos, getSavedProfile } = require('./utils/data')

App({
  globalData: {
    openid: '',
    cloudReady: false,
    demoPhotos,
    profile: getSavedProfile()
  },

  onLaunch() {
    if (!wx.cloud) {
      console.warn('当前基础库不支持云开发，将使用演示数据。')
      return
    }
    wx.cloud.init({
      env: 'cloud1-d2g2oa98791e8ec8c',
      traceUser: true
    })
    this.globalData.cloudReady = true
    this.openidPromise = wx.cloud.callFunction({ name: 'getOpenid' })
      .then(({ result }) => {
        this.globalData.openid = result.openid || ''
        return this.globalData.openid
      })
      .catch((error) => {
        console.warn('getOpenid 尚未部署，暂时使用演示模式。', error)
        return ''
      })
  }
})
