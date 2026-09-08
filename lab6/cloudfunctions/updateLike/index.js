const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  const photoId = event.photoId
  if (!photoId) throw new Error('photoId is required')

  const result = await db.collection('likes').where({ photoId, _openid: openid }).limit(1).get()
  if (event.action === 'status') return { liked: result.data.length > 0 }

  let liked
  if (result.data.length) {
    await db.collection('likes').doc(result.data[0]._id).remove()
    liked = false
  } else {
    await db.collection('likes').add({ data: { photoId, _openid: openid, userOpenid: openid, createTime: db.serverDate() } })
    liked = true
  }

  // 以 likes 集合的真实记录数为准，回写冗余计数，自动纠正历史偏差
  const { total } = await db.collection('likes').where({ photoId }).count()
  await db.collection('photos').doc(photoId).update({ data: { likeCount: total } })
  return { liked, likeCount: total, delta: liked ? 1 : -1 }
}
