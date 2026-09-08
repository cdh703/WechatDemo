const defaultAvatar = '/assets/images/avatar-default.png'

const demoPhotos = [
  {
    _id: 'demo-lake', isDemo: true, photoUrl: '/assets/images/lake.jpg',
    avatarUrl: defaultAvatar, nickName: '林间来信', province: '云南', country: '中国',
    title: '雾散以后，湖面把天空留了下来', category: '自然', tags: ['湖泊', '旅行'],
    addDate: '2026-09-06', likeCount: 128
  },
  {
    _id: 'demo-coast', isDemo: true, photoUrl: '/assets/images/coast.jpg',
    avatarUrl: defaultAvatar, nickName: '海盐汽水', province: '福建', country: '中国',
    title: '把今天的晚风收藏起来', category: '旅行', tags: ['海边', '日落'],
    addDate: '2026-09-05', likeCount: 96
  },
  {
    _id: 'demo-forest', isDemo: true, photoUrl: '/assets/images/forest.jpg',
    avatarUrl: defaultAvatar, nickName: '青苔', province: '四川', country: '中国',
    title: '沿着树影，去往安静的地方', category: '自然', tags: ['森林', '散步'],
    addDate: '2026-09-03', likeCount: 75
  },
  {
    _id: 'demo-city', isDemo: true, photoUrl: '/assets/images/city.jpg',
    avatarUrl: defaultAvatar, nickName: '夜航星', province: '上海', country: '中国',
    title: '城市亮起灯的时候', category: '城市', tags: ['夜景', '建筑'],
    addDate: '2026-09-01', likeCount: 63
  },
  {
    _id: 'demo-home', isDemo: true, photoUrl: '/assets/images/home.jpg',
    avatarUrl: defaultAvatar, nickName: '一页生活', province: '浙江', country: '中国',
    title: '日常也值得被认真记录', category: '生活', tags: ['建筑', '日常'],
    addDate: '2026-08-29', likeCount: 48
  }
]

function getSavedProfile() {
  return wx.getStorageSync('lab6_profile') || {
    nickName: '拾光旅行者',
    avatarUrl: defaultAvatar,
    bio: '用照片收藏生活中的微光',
    province: '安徽',
    country: '中国'
  }
}

function saveProfile(profile) {
  wx.setStorageSync('lab6_profile', profile)
  getApp().globalData.profile = profile
}

function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function normalizePhoto(photo) {
  const createdValue = photo.createdAt || photo.createTime
  const created = createdValue && createdValue.$date ? createdValue.$date : createdValue
  let fileID = photo.fileID || photo.photoUrl || photo.imageUrl || photo.image || photo.url || ''
  let photoUrl = fileID
  if (fileID && typeof fileID === 'object') fileID = fileID.fileID || fileID.url || ''
  if (photoUrl && typeof photoUrl === 'object') photoUrl = photoUrl.fileID || photoUrl.url || ''
  return Object.assign({
    title: '未命名作品', description: '', category: '生活', tags: [], likeCount: 0, viewCount: 0, favoriteCount: 0, commentCount: 0, allowComment: true,
    avatarUrl: defaultAvatar, nickName: '匿名用户', province: '', country: ''
  }, photo, { photoUrl, fileID, authorOpenid: photo.authorOpenid || photo._openid || '', addDate: photo.addDate || formatDate(created) })
}

async function resolveCloudPhotoUrls(photos) {
  if (!wx.cloud || !photos.length) return photos
  const fileIDs = photos.map((photo) => photo.photoUrl).filter((url) => typeof url === 'string' && url.startsWith('cloud://'))
  if (!fileIDs.length) return photos
  const now = Date.now()
  const cache = wx.getStorageSync('lab6_cloud_url_cache') || {}
  const resolved = {}
  const pending = []
  Array.from(new Set(fileIDs)).forEach((fileID) => {
    if (cache[fileID] && cache[fileID].expiresAt > now) resolved[fileID] = cache[fileID].url
    else pending.push(fileID)
  })
  try {
    if (pending.length) {
      let fileList
      try {
        const response = await wx.cloud.callFunction({ name: 'getTempUrls', data: { fileList: pending } })
        fileList = response.result && response.result.fileList
      } catch (_) {
        const response = await wx.cloud.getTempFileURL({ fileList: pending })
        fileList = response.fileList
      }
      if (!Array.isArray(fileList)) throw new Error('empty temp file list')
      fileList.forEach((item) => {
        if (item.fileID && item.tempFileURL) {
          resolved[item.fileID] = item.tempFileURL
          cache[item.fileID] = { url: item.tempFileURL, expiresAt: now + 25 * 60 * 1000 }
        }
      })
      wx.setStorageSync('lab6_cloud_url_cache', cache)
    }
    return photos.map((photo) => Object.assign({}, photo, { photoUrl: resolved[photo.photoUrl] || photo.photoUrl }))
  } catch (error) {
    console.warn('云图片临时链接获取失败，尝试直接显示 fileID。', error)
    return photos
  }
}

async function fetchPhotos() {
  if (!wx.cloud) return demoPhotos
  try {
    const db = wx.cloud.database()
    const { data } = await db.collection('photos').orderBy('createdAt', 'desc').limit(50).get()
    return data.length ? resolveCloudPhotoUrls(data.map(normalizePhoto)) : demoPhotos
  } catch (error) {
    console.warn('读取 photos 失败，使用本地演示数据。', error)
    try {
      const { data } = await wx.cloud.database().collection('photos').limit(50).get()
      return data.length ? resolveCloudPhotoUrls(data.map(normalizePhoto)) : demoPhotos
    } catch (_) {
      return demoPhotos
    }
  }
}

// 综合热度：点赞权重最高，浏览也计入，避免点赞同为 0 时排名随机
function hotScore(photo) {
  return (Number(photo.likeCount) || 0) * 5 + (Number(photo.favoriteCount) || 0) * 3 + (Number(photo.commentCount) || 0) * 2 + (Number(photo.viewCount) || 0)
}

function sortDemoPhotos(sort) {
  const photos = demoPhotos.slice()
  if (sort === 'hot') photos.sort((a, b) => hotScore(b) - hotScore(a))
  return photos
}

async function fetchPhotoPage(skip = 0, limit = 10, sort = 'new') {
  if (!wx.cloud) {
    const demos = sortDemoPhotos(sort)
    const photos = skip === 0 ? demos.slice(0, limit) : []
    return { photos, hasMore: demos.length > skip + photos.length, isDemo: true }
  }
  try {
    const db = wx.cloud.database()
    if (sort === 'hot') {
      const { data } = await db.collection('photos').orderBy('likeCount', 'desc').limit(100).get()
      const ranked = data.map(normalizePhoto).sort((a, b) => hotScore(b) - hotScore(a))
      if (!ranked.length && skip === 0) return { photos: sortDemoPhotos(sort), hasMore: false, isDemo: true }
      const photos = await resolveCloudPhotoUrls(ranked.slice(skip, skip + limit))
      return { photos, hasMore: ranked.length > skip + limit, isDemo: false }
    }
    const { data } = await db.collection('photos').orderBy('createdAt', 'desc').skip(skip).limit(limit).get()
    if (!data.length && skip === 0) return { photos: sortDemoPhotos(sort), hasMore: false, isDemo: true }
    return { photos: await resolveCloudPhotoUrls(data.map(normalizePhoto)), hasMore: data.length === limit, isDemo: false }
  } catch (error) {
    console.warn('分页读取失败，使用演示数据。', error)
    try {
      const { data } = await wx.cloud.database().collection('photos').orderBy('createdAt', 'desc').limit(limit).get()
      return { photos: await resolveCloudPhotoUrls(data.map(normalizePhoto)), hasMore: false, isDemo: false }
    } catch (_) {
      return { photos: skip === 0 ? sortDemoPhotos(sort) : [], hasMore: false, isDemo: true }
    }
  }
}

async function findPhoto(id) {
  const demo = demoPhotos.find((item) => item._id === id)
  if (demo) return demo
  if (!wx.cloud) return null
  const { data } = await wx.cloud.database().collection('photos').doc(id).get()
  const resolved = await resolveCloudPhotoUrls([normalizePhoto(data)])
  return resolved[0]
}

function getReaction(type, id) {
  const ids = wx.getStorageSync(`lab6_${type}`) || []
  return ids.includes(id)
}

function toggleReaction(type, id) {
  const key = `lab6_${type}`
  const ids = wx.getStorageSync(key) || []
  const index = ids.indexOf(id)
  if (index >= 0) ids.splice(index, 1)
  else ids.push(id)
  wx.setStorageSync(key, ids)
  return ids.includes(id)
}

function uploadCloudFile(cloudPath, filePath, onProgress) {
  return new Promise((resolve, reject) => {
    const task = wx.cloud.uploadFile({ cloudPath, filePath, success: resolve, fail: reject })
    if (task && task.onProgressUpdate && onProgress) task.onProgressUpdate(onProgress)
  })
}

async function saveUserProfile(profile) {
  saveProfile(profile)
  if (!wx.cloud) return false
  try {
    const app = getApp()
    const openid = app.openidPromise ? await app.openidPromise : app.globalData.openid
    if (!openid) throw new Error('openid unavailable')
    const db = wx.cloud.database()
    const { data } = await db.collection('users').where({ _openid: openid }).limit(1).get()
    const payload = Object.assign({}, profile, { openid, updatedAt: db.serverDate() })
    if (data.length) await db.collection('users').doc(data[0]._id).update({ data: payload })
    else await db.collection('users').add({ data: Object.assign(payload, { createTime: db.serverDate() }) })
    return true
  } catch (error) {
    console.warn('users 集合尚未创建，资料仅保存在本机。', error)
    return false
  }
}

module.exports = {
  defaultAvatar,
  demoPhotos,
  getSavedProfile,
  saveProfile,
  formatDate,
  fetchPhotos,
  fetchPhotoPage,
  findPhoto,
  getReaction,
  toggleReaction,
  uploadCloudFile,
  saveUserProfile
}
