# WechatDemo —— 第一个微信小程序

> 中国海洋大学 26 夏《移动软件开发》课程实验 1 项目
>
> 一个基于 Skyline 渲染引擎的微信小程序 Hello World 示例，演示页面结构（wxml）、样式（wxss）、逻辑（js）的最基本协作方式。

## 项目简介

本项目实现了一个极简的微信小程序：页面中央显示文字，点击按钮在「Hello World」与「你好，微信小程序」之间切换，再次点击可恢复原文字。同时配套了渐变背景、淡入动画、按钮按压反馈等基础视觉效果，适合作为微信小程序入门示例。

## 功能特性

- 中英文文字一键切换
- 页面加载时文字淡入 + 上浮动画
- 圆角渐变按钮 + 按压缩放反馈
- 浅蓝渐变背景，视觉简洁舒适
- 采用 Skyline 渲染引擎与 glass-easel 组件框架
- 自定义导航栏组件 `navigation-bar`

## 目录结构

```
WechatDemo/
├── app.js                          # 小程序入口
├── app.json                        # 小程序全局配置
├── app.wxss                        # 全局样式
├── sitemap.json                    # 搜索索引配置
├── project.config.json             # 项目配置（含 appid）
├── project.private.config.json     # 项目私有配置
├── .eslintrc.js                    # ESLint 规则
├── components/
│   └── navigation-bar/             # 自定义导航栏组件
│       ├── navigation-bar.js
│       ├── navigation-bar.json
│       ├── navigation-bar.wxml
│       └── navigation-bar.wxss
└── pages/
    └── index/                      # 首页
        ├── index.js                # 页面逻辑：data + changeText 事件
        ├── index.json              # 页面配置
        ├── index.wxml             # 页面结构：文字 + 按钮
        └── index.wxss              # 页面样式：布局 + 动画 + 按钮
```

## 核心实现

### 页面逻辑 `pages/index/index.js`

通过 `data.message` 持有当前文字，`changeText` 方法在两种文字间切换并使用 `setData` 更新视图：

```javascript
Page({
  data: {
    message: "Hello World"
  },
  changeText: function () {
    this.setData({
      message: this.data.message === "Hello World"
        ? "你好，微信小程序"
        : "Hello World"
    });
  }
});
```

### 页面结构 `pages/index/index.wxml`

使用 `{{message}}` 绑定数据，`bindtap="changeText"` 绑定按钮点击事件：

```xml
<view class="container">
  <view class="text">{{message}}</view>
  <button class="change-button" bindtap="changeText">点击改变文字</button>
</view>
```

## 运行方式

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 克隆本仓库：

   ```bash
   git clone https://github.com/cdh703/WechatDemo.git
   ```
3. 打开微信开发者工具，选择「导入项目」，项目目录指向本仓库根目录
4. 点击编译，预览效果

## 技术栈

- 微信小程序原生框架（wxml / wxss / js / json）
- Skyline 渲染引擎（`"renderer": "skyline"`）
- glass-easel 组件框架
- 基础库版本要求：≥ 3.0.0

## 相关文档

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Skyline 渲染引擎说明](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html)

## 课程信息

| 项目 | 内容 |
| :---: | :---: |
| 姓名/学号 | 陈东汉 / 24020007006 |
| 课程 | 中国海洋大学 26 夏《移动软件开发》 |
| 实验名称 | 实验 1：第一个微信小程序 |

## License

本项目仅用于课程学习交流，未设开源许可证。
