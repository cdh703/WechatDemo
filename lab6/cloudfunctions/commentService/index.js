const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const command = db.command

async function listComments(photoId, openid) {
  const result = await db.collection('comments').where({ photoId }).orderBy('createTime', 'desc').limit(100).get()
  const comments = result.data
  const ids = comments.map((comment) => comment._id)
  let likedIds = []
  if (ids.length) {
    const likes = await db.collection('commentLikes').where({
      _openid: openid,
      commentId: command.in(ids)
    }).limit(100).get()
    likedIds = likes.data.map((like) => like.commentId)
  }
  return comments.map((comment) => Object.assign({
    rootId: '', replyToCommentId: '', replyToNickName: '', likeCount: 0, replyCount: 0
  }, comment, {
    liked: likedIds.includes(comment._id),
    isMine: (comment.authorOpenid || comment._openid) === openid
  }))
}

exports.main = async (event) => {
  const openid = cloud.getWXContext().OPENID
  const photoId = event.photoId
  if (!photoId) throw new Error('photoId is required')

  if (event.action === 'list') {
    return { comments: await listComments(photoId, openid) }
  }

  if (event.action === 'toggleLike') {
    const commentId = event.commentId
    const comment = (await db.collection('comments').doc(commentId).get()).data
    if (!comment || comment.photoId !== photoId) throw new Error('评论不存在')
    const existing = await db.collection('commentLikes').where({ commentId, _openid: openid }).limit(1).get()
    let liked
    if (existing.data.length) {
      await db.collection('commentLikes').doc(existing.data[0]._id).remove()
      await db.collection('comments').doc(commentId).update({ data: { likeCount: command.inc(-1) } })
      liked = false
    } else {
      await db.collection('commentLikes').add({ data: { commentId, photoId, _openid: openid, userOpenid: openid, createTime: db.serverDate() } })
      await db.collection('comments').doc(commentId).update({ data: { likeCount: command.inc(1) } })
      liked = true
    }
    const updated = (await db.collection('comments').doc(commentId).get()).data
    return { liked, likeCount: Math.max(0, Number(updated.likeCount || 0)) }
  }

  if (event.action === 'delete') {
    const commentId = event.commentId
    const record = (await db.collection('comments').doc(commentId).get()).data
    if (!record || record.photoId !== photoId) throw new Error('评论不存在')
    if (record._openid !== openid) throw new Error('无权删除该评论')

    if (!record.rootId) {
      const replies = await db.collection('comments').where({ rootId: commentId }).limit(100).get()
      const commentIds = [commentId].concat(replies.data.map((reply) => reply._id))
      await Promise.all([
        db.collection('comments').where({ rootId: commentId }).remove(),
        db.collection('comments').doc(commentId).remove(),
        db.collection('commentLikes').where({ commentId: command.in(commentIds) }).remove()
      ])
      await db.collection('photos').doc(photoId).update({ data: { commentCount: command.inc(-commentIds.length) } })
    } else {
      await Promise.all([
        db.collection('comments').doc(commentId).remove(),
        db.collection('commentLikes').where({ commentId }).remove(),
        db.collection('comments').doc(record.rootId).update({ data: { replyCount: command.inc(-1) } })
      ])
      await db.collection('photos').doc(photoId).update({ data: { commentCount: command.inc(-1) } })
    }
    return { deleted: true }
  }

  const content = String(event.content || '').trim().slice(0, 120)
  if (!content) throw new Error('评论内容不能为空')

  // 内容安全检测：违规评论直接拒绝（接口不可用时放行，不影响主流程）
  try {
    const check = await cloud.openapi.security.msgSecCheck({ openid, scene: 2, version: 2, content })
    const suggest = check && check.result && check.result.suggest
    if (suggest === 'risky') throw new Error('评论包含违规内容')
  } catch (error) {
    if (error.message === '评论包含违规内容') throw error
    console.warn('msgSecCheck 不可用，本次放行。', error)
  }

  const photo = (await db.collection('photos').doc(photoId).get()).data
  if (photo.allowComment === false) throw new Error('作者未开启评论')

  let rootId = ''
  let replyToCommentId = ''
  let replyToNickName = ''
  if (event.replyToCommentId) {
    const target = (await db.collection('comments').doc(event.replyToCommentId).get()).data
    if (!target || target.photoId !== photoId) throw new Error('回复目标不存在')
    rootId = target.rootId || target._id
    replyToCommentId = target._id
    replyToNickName = target.nickName
  }

  await db.collection('comments').add({
    data: {
      photoId,
      rootId,
      replyToCommentId,
      replyToNickName,
      _openid: openid,
      authorOpenid: openid,
      avatarUrl: event.avatarUrl || '',
      nickName: event.nickName || '匿名用户',
      content,
      likeCount: 0,
      replyCount: 0,
      createTime: db.serverDate(),
      displayTime: event.displayTime || ''
    }
  })
  const updates = [db.collection('photos').doc(photoId).update({ data: { commentCount: command.inc(1) } })]
  if (rootId) updates.push(db.collection('comments').doc(rootId).update({ data: { replyCount: command.inc(1) } }))
  await Promise.all(updates)
  return { added: true }
}
