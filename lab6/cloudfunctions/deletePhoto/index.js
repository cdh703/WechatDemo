const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  const photoId = event.photoId
  if (!photoId) throw new Error('photoId is required')
  const photo = (await db.collection('photos').doc(photoId).get()).data
  if (!photo || photo._openid !== openid) throw new Error('无权删除该作品')

  if (photo.photoUrl && photo.photoUrl.startsWith('cloud://')) {
    await cloud.deleteFile({ fileList: [photo.photoUrl] })
  }
  const comments = await db.collection('comments').where({ photoId }).limit(100).get().catch(() => ({ data: [] }))
  const commentIds = comments.data.map((comment) => comment._id)
  const tasks = [
    db.collection('photos').doc(photoId).remove(),
    db.collection('comments').where({ photoId }).remove().catch(() => null),
    db.collection('favorites').where({ photoId }).remove().catch(() => null),
    db.collection('likes').where({ photoId }).remove().catch(() => null)
  ]
  if (commentIds.length) tasks.push(db.collection('commentLikes').where({ commentId: db.command.in(commentIds) }).remove().catch(() => null))
  await Promise.all(tasks)
  return { deleted: true }
}
