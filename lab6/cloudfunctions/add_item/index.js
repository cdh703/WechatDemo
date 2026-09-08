const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  if (!event.fileID) throw new Error('fileID is required')
  return db.collection('photos').add({ data: { photoUrl: event.fileID, fileID: event.fileID, authorOpenid: openid, category: event.type || '生活', type: event.type || '生活', title: '我的收藏照片', description: '', tags: [], likeCount: 0, favoriteCount: 0, commentCount: 0, allowComment: true, createdAt: db.serverDate(), createTime: db.serverDate() } })
}
