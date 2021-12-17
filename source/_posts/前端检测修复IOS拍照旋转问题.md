---
title: 前端检测修复IOS拍照旋转问题
date: 2019-01-09 14:38:48
tags: [JavaScript]
---

苹果手机竖向拍照会为照片添加左旋90度的拍照方向，导致在网页中展示异常。前端解决这个问题需要提取图片的exif信息，并检测照片的拍照方向orientation，再通过canvas绘制图片并纠正旋转方向，最后输出图片的base64。

<!-- more -->

WEB前端环境可能在两种情况下遇到IOS拍照旋转问题，一是网页中通过`input:type=file`控件捕获照片文件并实时预览，二是网页中显示未经处理的苹果手机拍摄图片。

**[ios-photo-repair](https://github.com/tower1229/ios-photo-repair)**是一个专门修复IOS照片旋转问题的前端工具，提供两个方法分别应对上述两种应用场景。

## [](#安装ios-photo-repair "安装ios-photo-repair")安装ios-photo-repair

```bash
npm i ios-photo-repair --save

```

## [](#使用ios-photo-repair "使用ios-photo-repair")使用ios-photo-repair

### [](#修复file文件 "修复file文件")修复file文件

`fixImgFile(file, [compressOption])`方法接收file对象和可选的压缩配置为参数，返回promise，完成后输出修复后的图片base64。如果想顺便压缩一下，还可以传入压缩配置。输出图片统一为jpeg格式，因为只有jpeg和webp格式支持压缩比设置。

示例：

```html
<input type="file" id="fileinput">

```

```js
let {fixImgFile} = require("ios-photo-repair")

document.getElementById('fileinput').onchange = function(evt){
    let file = evt.target.files[0]
    fixImgFile(file, {
        width:500,          //最大宽度，默认不限制
        height:500,         //最大高度，默认不限制
        ratio: 0.9          //压缩比，默认不压缩
    }).then(base64 => {
        console.log(base64) // 修复并压缩后的图片base64
    })
}
```

### [](#修复图片标签 "修复图片标签")修复图片标签

`fixBySelector()`方法接收一个DOM选择器字符串为参数，用于`document.querySelectorAll()`方法获取待修复的图片元素节点，当检测到图片方向发生旋转将自动纠正并重载图片。因为`<img>`元素本来就已经载入到了网页中，因此没有压缩的必要，所以该方法不支持压缩配置。

示例：

```html
<img src="./img/ios-1.jpg" id="iosphoto">

```

```js
let {fixBySelector} = require("ios-photo-repair")

fixBySelector('#iosphoto')
```

## [](#项目信息 "项目信息")项目信息

repo: [https://github.com/tower1229/ios-photo-repair](https://github.com/tower1229/ios-photo-repair)

## [](#附：parceljs使用体验 "附：parceljs使用体验")附：parceljs使用体验

这个项目使用[parceljs](https://parceljs.org/)构建，第一次使用体验特别轻便，文档寥寥几页，但必要的功能一点不少，与webpack最大的区别是parceljs只关注加载和构建，资源处理都交给第三方工具去做，所以小项目起步的配置压力没有webpack那么大，做个类库之类的项目再适合不过了。
