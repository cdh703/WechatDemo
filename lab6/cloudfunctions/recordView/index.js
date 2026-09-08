const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const photoId = event.photoId
  if (!photoId) throw new Error('photoId is required')
  await db.collection('photos').doc(photoId).update({
    data: { viewCount: db.command.inc(1) }
  })
  const updated = (await db.collection('photos').doc(photoId).get()).data
  return { viewCount: Number(updated.viewCount || 0) }
}
