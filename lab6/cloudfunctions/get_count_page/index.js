const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  const result = await db.collection('photos').where({ _openid: openid }).limit(1000).get()
  const type = event.type || '全部'
  const count = result.data.filter((item) => type === '全部' || item.category === type || item.type === type).length
  return { count, pagesize: 18, total_page: Math.ceil(count / 18) }
}
