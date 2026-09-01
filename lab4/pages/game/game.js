const { maps } = require('../../utils/data')
const { birds, defaultBird } = require('../../utils/birds')

const SIZE = 8
const CELL = 40

Page({
  data: {
    level: 1,
    birdName: '红鸟',
    birdIcon: defaultBird.icon,
    birdId: defaultBird.id,
    steps: 0,
    bestSteps: '--',
    contentTop: 72,
    effectVisible: false,
    effectWord: '我来'
  },

  onLoad(options) {
    this.updateHeaderLayout()
    const selected = Number(options.level || 0)
    this.levelIndex = Math.max(0, Math.min(maps.length - 1, selected))
    const selectedBird = birds.find((item) => item.id === options.birdId) || getApp().globalData.selectedBird || defaultBird
    this.bird = selectedBird
    getApp().globalData.selectedBird = selectedBird
    this.bestStepsKey = 'bestSteps-level-' + this.levelIndex + '-bird-' + this.bird.id
    const bestSteps = wx.getStorageSync(this.bestStepsKey) || '--'
    this.setData({
      level: this.levelIndex + 1,
      birdName: this.bird.name,
      birdIcon: this.bird.icon,
      birdId: this.bird.id,
      bestSteps
    })
    this.initMap(this.levelIndex)
  },

  updateHeaderLayout() {
    if (!wx.getMenuButtonBoundingClientRect) return
    const menu = wx.getMenuButtonBoundingClientRect()
    if (!menu || !menu.bottom) return
    this.setData({ contentTop: Math.ceil(menu.bottom + 12) })
  },

  onReady() {
    this.ctx = wx.createCanvasContext('myCanvas', this)
    this.drawCanvas()
  },

  onUnload() {
    clearTimeout(this.effectStartTimer)
    clearTimeout(this.effectEndTimer)
    clearTimeout(this.moveEffectTimer)
  },

  initMap(level) {
    const source = maps[level]
    this.map = []
    this.box = []
    this.row = 0
    this.col = 0
    for (let row = 0; row < SIZE; row += 1) {
      this.map[row] = []
      this.box[row] = []
      for (let col = 0; col < SIZE; col += 1) {
        const value = source[row][col]
        this.box[row][col] = value === 4 ? 4 : 0
        if (value === 4 || value === 5) this.map[row][col] = 2
        else this.map[row][col] = value
        if (value === 5) { this.row = row; this.col = col }
      }
    }
  },

  drawCanvas(effect) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, 320, 320)
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        let image = 'ice'
        if (this.map[row][col] === 1) image = 'stone'
        if (this.map[row][col] === 3) image = 'pig'
        ctx.drawImage('/images/icons/' + image + '.png', col * CELL, row * CELL, CELL, CELL)
        if (this.box[row][col] === 4) ctx.drawImage('/images/icons/box.png', col * CELL, row * CELL, CELL, CELL)
      }
    }
    if (effect) this.drawTrailEffect(ctx, effect)
    ctx.drawImage(this.bird.icon, this.col * CELL, this.row * CELL, CELL, CELL)
    if (effect) this.drawPushEffect(ctx, effect)
    ctx.draw()
  },

  drawTrailEffect(ctx, effect) {
    const fade = 1 - effect.progress
    const deltaRow = effect.toRow - effect.fromRow
    const deltaCol = effect.toCol - effect.fromCol
    const marks = [
      { offset: 0.2, alpha: 0.18 },
      { offset: 0.52, alpha: 0.32 }
    ]
    marks.forEach((mark) => {
      const row = effect.fromRow + deltaRow * mark.offset
      const col = effect.fromCol + deltaCol * mark.offset
      ctx.setGlobalAlpha(mark.alpha * fade)
      ctx.drawImage(this.bird.icon, col * CELL, row * CELL, CELL, CELL)
    })
    ctx.setGlobalAlpha(1)
  },

  drawPushEffect(ctx, effect) {
    if (!effect.pushed) return
    const centerX = effect.boxCol * CELL + CELL / 2
    const centerY = effect.boxRow * CELL + CELL / 2
    const fade = 1 - effect.progress
    if (effect.reachedGoal) {
      ctx.setStrokeStyle('#55c94c')
      ctx.setLineWidth(3)
      ctx.setGlobalAlpha(fade * 0.9)
      ctx.beginPath()
      ctx.arc(centerX, centerY, 8 + effect.progress * 22, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(centerX, centerY, 4 + effect.progress * 14, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.setGlobalAlpha(fade)
    ctx.setFontSize(14 + effect.progress * 6)
    ctx.setFillStyle(this.bird.color)
    ctx.fillText(effect.word, centerX - 12, centerY - 12 - effect.progress * 12)
    ctx.setGlobalAlpha(1)
  },

  startMoveEffect(details) {
    clearTimeout(this.moveEffectTimer)
    const startedAt = Date.now()
    const duration = details.reachedGoal ? 680 : 480
    const tick = () => {
      const progress = Math.min((Date.now() - startedAt) / duration, 1)
      this.drawCanvas(Object.assign({}, details, { progress }))
      if (progress < 1) this.moveEffectTimer = setTimeout(tick, 32)
      else this.drawCanvas()
    }
    tick()
  },

  move(deltaRow, deltaCol) {
    const fromRow = this.row
    const fromCol = this.col
    const nextRow = this.row + deltaRow
    const nextCol = this.col + deltaCol
    if (!this.inBoard(nextRow, nextCol) || this.isWall(this.map[nextRow][nextCol])) return
    let pushed = false
    let boxRow = -1
    let boxCol = -1
    if (this.box[nextRow][nextCol] === 4) {
      boxRow = nextRow + deltaRow
      boxCol = nextCol + deltaCol
      if (!this.inBoard(boxRow, boxCol) || this.isWall(this.map[boxRow][boxCol]) || this.box[boxRow][boxCol] === 4) return
      this.box[boxRow][boxCol] = 4
      this.box[nextRow][nextCol] = 0
      pushed = true
    }
    this.row = nextRow
    this.col = nextCol
    this.setData({ steps: this.data.steps + 1 })
    const pushWords = ['咚!', '顶!', '走你!']
    const pushWord = pushWords[this.pushWordIndex || 0]
    if (pushed) this.pushWordIndex = ((this.pushWordIndex || 0) + 1) % pushWords.length
    this.startMoveEffect({
      fromRow,
      fromCol,
      toRow: this.row,
      toCol: this.col,
      pushed,
      boxRow,
      boxCol,
      reachedGoal: pushed && this.map[boxRow][boxCol] === 3,
      word: pushWord
    })
    this.checkWin()
  },

  isWall(value) { return value === 0 || value === 1 },
  inBoard(row, col) { return row >= 0 && row < SIZE && col >= 0 && col < SIZE },
  up() { this.move(-1, 0) },
  down() { this.move(1, 0) },
  left() { this.move(0, -1) },
  right() { this.move(0, 1) },

  triggerBirdEffect() {
    clearTimeout(this.effectStartTimer)
    clearTimeout(this.effectEndTimer)
    const words = ['我来', '让开', '这把稳了', '到我了']
    const choices = words.filter((word) => word !== this.data.effectWord)
    const effectWord = choices[Math.floor(Math.random() * choices.length)]
    this.setData({ effectVisible: false, effectWord }, () => {
      this.effectStartTimer = setTimeout(() => {
        this.setData({ effectVisible: true })
        this.effectEndTimer = setTimeout(() => {
          this.setData({ effectVisible: false })
        }, 1400)
      }, 20)
    })
  },

  isWin() {
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (this.box[row][col] === 4 && this.map[row][col] !== 3) return false
      }
    }
    return true
  },

  checkWin() {
    if (!this.isCompleted && this.isWin()) {
      this.isCompleted = true
      const hasNext = this.levelIndex < maps.length - 1
      const previousBest = Number(wx.getStorageSync(this.bestStepsKey)) || 0
      const isNewBest = previousBest === 0 || this.data.steps < previousBest
      const bestSteps = isNewBest ? this.data.steps : previousBest
      if (isNewBest) wx.setStorageSync(this.bestStepsKey, bestSteps)
      this.setData({ bestSteps })
      wx.showModal({
        title: '恭喜',
        content: '本局用了 ' + this.data.steps + ' 步' + (isNewBest ? '，创造新纪录！' : '，最佳纪录为 ' + bestSteps + ' 步。') + (hasNext ? '\n继续进入下一关。' : '\n四个关卡全部完成！'),
        showCancel: false,
        success: () => {
          if (hasNext) wx.redirectTo({ url: '../game/game?level=' + (this.levelIndex + 1) + '&birdId=' + this.bird.id })
          else wx.navigateBack()
        }
      })
    }
  },

  restartGame() {
    clearTimeout(this.moveEffectTimer)
    this.isCompleted = false
    this.initMap(this.levelIndex)
    this.setData({ steps: 0 })
    this.drawCanvas()
  },

  backToLevels() {
    wx.navigateBack({
      delta: 1,
      fail: () => wx.redirectTo({ url: '../index/index' })
    })
  }
})
