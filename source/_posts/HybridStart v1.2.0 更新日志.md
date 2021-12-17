---
title: HybridStart v1.2.0 更新日志
date: 2018-04-27 10:30:11
tags: [HybridStart]
---

HybridStart v1.2.0 更新日志

<!-- more -->

## [](#新增 "新增")新增

### [](#1-插件机制 "1. 插件机制")1\. 插件机制

WEB代码无需编译，部署即可运行，因此可以很容易的实现热插拔插件机制，HybridStart内置了一个插件机制的实现DEMO，见示例APP首页“OTA-plugins(扩展插件)”。实现代码位于`/views/ota/`，额外引入了[zip](https://docs.apicloud.com/Client-API/Func-Ext/zip)模块实现插件压缩包的解压，完整流程如下：

![](http://refined-x.com/asset/hybridstart-plugin.png)

插件列表数据格式如下：

```json
{
	"status": "Y",
	"data": [{
		"remote": "http://static-zt.oss-cn-qingdao.aliyuncs.com/mock/plugin-test.zip",		//插件压缩包下载地址
		"index": "/view/index/temp.html",													//插件首页路径
		"name": "plugin-test",																//插件名称（唯一标识）
		"showName": "测试插件"																//插件展示名称
	}, {
		"remote": "http://static-zt.oss-cn-qingdao.aliyuncs.com/mock/plugin-refined-x.zip",
		"index": "/view/index/temp.html",
		"name": "plugin-refined-x",
		"showName": "下载失败测试"
	}],
	"msg": "获取插件成功"
}
```

对插件包的文件结构没有要求，只需要在插件数据中正确指定首页即可，每个插件都自成一体，无法调用App的脚本文件。示例没有实现插件的删除，实际应用中可以自行实现删除功能。

### [](#2-UI支持沉浸式 "2. UI支持沉浸式")2\. UI支持沉浸式

对`ui.less`做了调整，可以很容易的适配沉浸式效果，只需要给`.head类`加上`padding-top:24px`，编译成`ui.css`即可。开启沉浸式体验可以修改`config.xml`中的

```xml
<preference name="statusBarAppearance" value="true"/>	//默认false

```

## [](#调整 "调整")调整

### [](#1-移除页面style-css文件 "1. 移除页面style.css文件")1\. 移除页面style.css文件

考虑到页面独有样式通常不多，所以从页面文件夹中移除style.css文件，页面样式可以直接写在`temp.html`头部，减少文件引用，提升页面加载速度。

### [](#2-增加loader-js "2. 增加loader.js")2\. 增加loader.js

将原来页面底部的一大坨异步非阻塞加载脚本的代码整理成`loader.js`统一调用。所谓异步非阻塞的意思是绕过APICloud的加载等待机制，使新开窗口能第一时间进场，在进场动画过程中加载页面脚本，以提升页面进场动画的响应速度。

由此带来的问题是页面脚本只能在真机环境下运行，让js调试非常不方便，关于调试方面的建议可以参考[进场动画提速](https://refined-x.com/HybridStart/docs/#solution-speed)

## [](#BUG-修复 "BUG 修复")BUG 修复

### [](#1-IOS事件委托BUG "1. IOS事件委托BUG")1\. IOS事件委托BUG

这个BUG的复现条件为，在IOS环境下将多个页面元素（比如列表项）的点击事件委托在body元素上，当元素多到足以页面发生滚动时，非首屏的元素将不响应点击事件。框架在`common.js`中默认提供的`[active]`跳转属性受到该BUG影响，示例APP的首页列表在IOS上会出现非首屏内容无法点击的问题。

解决方法为在body里插入一个`div#body`元素，将事件委托改在这个元素上就OK了，`common.js`里的事件委托写法做了如下兼容：

```js
var $body = $('#body').length ? $('#body') : $('body');	//优先查找div#body元素
$body.on(...
```

## [](#其他 "其他")其他

### [](#1-移除默认数据格式约定 "1. 移除默认数据格式约定")1\. 移除默认数据格式约定

不再约定默认的异步数据格式，`app.ajax()`中已经移除数据格式校验相关代码。

## [](#获取 "获取")获取

[体验APP](http://app.mi.com/details?id=com.apicloud.A6997660453388)

[代码仓库](https://github.com/tower1229/HybridStart)
