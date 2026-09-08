const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID

  if (event.action === 'list') {
    const records = await db.collection('favorites').where({ _openid: openid }).orderBy('createTime', 'desc').limit(50).get()
    const photos = await Promise.all(records.data.map(async (record) => {
      try { return (await db.collection('photos').doc(record.photoId).get()).data } catch (_) { return null }
    }))
    return { photos: photos.filter(Boolean) }
  }

  const photoId = event.photoId
  if (!photoId) throw new Error('photoId is required')
  const result = await db.collection('favorites').where({ photoId, _openid: openid }).limit(1).get()
  if (event.action === 'status') return { favorited: result.data.length > 0 }

  let favorited
  if (result.data.length) {
    await db.collection('favorites').doc(result.data[0]._id).remove()
    favorited = false
  } else {
    await db.collection('favorites').add({ data: { photoId, _openid: openid, userOpenid: openid, createTime: db.serverDate() } })
    favorited = true
  }

  // 以 favorites 集合的真实记录数为准，回写冗余计数，自动纠正历史偏差
  const { total } = await db.collection('favorites').where({ photoId }).count()
  await db.collection('photos').doc(photoId).update({ data: { favoriteCount: total } })
  return { favorited, favoriteCount: total }
}
