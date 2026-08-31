/**
 * 联系卡片组件
 * 点击复制邮箱，向外发送 contacttap 事件
 */
Component({
  properties: {
    contact:  { type: Object,  value: {} },
    rd:       { type: String,  value: '6' },
    show:     { type: Boolean, value: false },
    cid:      { type: String,  value: 'card-6' }
  },
  methods: {
    onTap() {
      this.triggerEvent('contacttap', { email: this.data.contact && this.data.contact.email });
    }
  }
});
