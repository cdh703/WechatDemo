/**
 * 名片头部组件 = Banner + Hero 区
 * 处理头像大图预览、状态点呼吸、姓名简介等
 */
Component({
  options: { multipleSlots: true },
  properties: {
    banner:  { type: String,  value: '' },
    name:    { type: String,  value: '' },
    major:   { type: String,  value: '' },
    degree:  { type: String,  value: '' },
    intro:   { type: String,  value: '' },
    status:  { type: String,  value: '' },
    bannerShown: { type: Boolean, value: false },
    heroShown:   { type: Boolean, value: false }
  },
  methods: {
    onBannerTap() {
      this.triggerEvent('bannertap');
    }
  }
});
