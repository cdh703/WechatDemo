const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  const result = await db.collection('photos').where({ _openid: openid }).orderBy('createTime', 'desc').limit(100).get()
  const type = event.type || '全部'
  return { data: result.data.filter((item) => type === '全部' || item.category === type || item.type === type) }
}
