const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  const record = (await db.collection('photos').doc(event._id).get()).data
  if (!record || record._openid !== openid) throw new Error('无权删除该作品')
  const fileID = event.fileID || record.photoUrl || record.fileID
  if (fileID && String(fileID).startsWith('cloud://')) await cloud.deleteFile({ fileList: [fileID] })
  await db.collection('photos').doc(event._id).remove()
  return { deleted: true }
}
