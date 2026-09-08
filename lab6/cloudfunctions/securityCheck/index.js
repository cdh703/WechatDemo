const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 文本内容安全检测（msgSecCheck v2，scene: 1 资料 2 评论 3 帖子 4 社交日志）
async function checkText(content, openid, scene) {
  try {
    const result = await cloud.openapi.security.msgSecCheck({
      openid,
      scene,
      version: 2,
      content: String(content).slice(0, 2500)
    })
    const suggest = result && result.result && result.result.suggest
    return { pass: suggest !== 'risky', suggest: suggest || 'pass' }
  } catch (error) {
    // 内容安全接口不可用（未开通、额度耗尽等）时放行，避免阻塞主流程
    console.warn('msgSecCheck 调用失败，本次放行。', error)
    return { pass: true, suggest: 'unchecked' }
  }
}

// 图片内容安全检测（imgSecCheck），87014 表示内容违规
async function checkImage(fileID) {
  try {
    const file = await cloud.downloadFile({ fileID })
    const extension = (fileID.match(/\.([^.]+)$/) || [])[1] || 'jpg'
    const contentType = extension === 'png' ? 'image/png' : 'image/jpeg'
    await cloud.openapi.security.imgSecCheck({
      media: { contentType, value: file.fileContent }
    })
    return { pass: true }
  } catch (error) {
    if (error && error.errCode === 87014) return { pass: false }
    console.warn('imgSecCheck 调用失败，本次放行。', error)
    return { pass: true }
  }
}

exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  if (event.action === 'image') {
    const fileID = String(event.fileID || '')
    if (!fileID.startsWith('cloud://')) throw new Error('fileID is required')
    const result = await checkImage(fileID)
    if (!result.pass) await cloud.deleteFile({ fileList: [fileID] }).catch(() => {})
    return result
  }
  return checkText(event.content || '', openid, Number(event.scene) || 2)
}
