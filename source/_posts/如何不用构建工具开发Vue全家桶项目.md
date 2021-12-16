---
title: 如何不用构建工具开发Vue全家桶项目
date: 2017-10-28 17:42:23
tags: [Vue]
---

Vue是目前最流行的前端开发框架之一，与Vue-router和Vuex组成俗称的Vue全家桶，更是开发前端富交互应用的利器。配合webpack等构建工具，开发大型应用也可以得心应手。随着Vue的普及，可能一些老旧项目也希望能“渐进式”的使用Vue，或者有的项目想用Vue来做但不打算引进构建工具，这种情况该怎样愉快的开发Vue全家桶项目呢？本文将提供一种解决方案。

<!-- more -->

## [](#构建工具的意义 "构建工具的意义")构建工具的意义

首先应该明白构建工具的意义，是为了更好的实现模块化开发。具体来说就是开发的时候“拆”，发布的时候“合”，从而实现以模块为单位的关注点分离，以解决前端项目越来越庞大的背景下，单一开发者很难同时统筹项目所有细节的问题。具体来说都“拆”了什么，无非以下两方面：

+ 静态资源
+ 业务模块

静态资源的打包构建不是什么新鲜东西，编译啊合并啊压缩啊，都是老生常谈。

业务模块的拆分才是开发大型Vue项目的关键，也是构建工具在这里存在的最大意义。例如基于webpack使用Vue的单文件组件功能，使一个组件的所有部分（样式、模板、逻辑）都集中在一个`.vue`文件中管理，非常的方便。

除此之外构建工具通常还额外提供一些别的小恩小惠，比如实时刷新、代码压缩、md5戳等等，都不是很重要，替代方案也很多，这里就忽略它们了。

## [](#如何优雅的摆脱构建工具 "如何优雅的摆脱构建工具")如何优雅的摆脱构建工具

不用构建工具不难，难的是同时实现模块化，没有构建工具的帮助，我们就要自己解决组件及依赖资源的互相引用和加载。核心思路是利用Vue的异步组件特性，借助前端模块加载器实现组件按需加载，只要能通过一个异步请求返回正确的组件对象，我们仍然可以以文件的形式组织组件！

下面就通过一个小例子来讲解具体如何实现这个方案。示例中用seajs作为加载器，对于借助seajs实现前端模块化开发另一篇讨论参见这里：[Webpack是答案吗](//refined-x.com/2017/06/16/Webpack%E6%98%AF%E7%AD%94%E6%A1%88%E5%90%97/)。

本文不对Vue全家桶及相关类库的使用做讲解，这部分内容请自行查阅文档。示例项目的完整代码及预览地址见文末链接。

### [](#文件组织 "文件组织")文件组织

项目文件被分成两类，一类是通过加载器加载的，一类的是页面文件中直接引用的，为了开发方便应该尽可能将所有文件做模块化改造，但有一部分文件不适合也没有必要，比如类库，项目通用样式，图片文件等，所以这些文件被单独拎出来，项目的整体结构如下：

```bash
|-- src/         //模块化文件
|  |-- assets/
|  |-- component/
|  |-- plugin/
|  |-- store/
|  |-- app.js
|  `-- router.js
|-- static/       //非模块化文件
|  |-- lib/
|  |-- css/
|  |-- font/
|  `-- images/
·-- index.html       //入口页面

```

### [](#文件加载 "文件加载")文件加载

非模块化文件基本都是各种类库，主要是在入口页面中引用，没什么可说的，对于项目“本体”来说，已经彻底实现了模块化改造，可以说项目中的“一切皆是模块”。

访问入口页面会加载包括Vue三件套、seajs以及其他类库，然后seajs会加载并执行入口模块`app.js`，在入口模块中完成Vue实例的创建：

```js
//app.js 部分代码
const router = require('js/router');
const store = require('js/store/store');

let app = new Vue({
	el: '#app',
	router,
	store,
	...
```

创建实例后会启动路由并跳转首页，路由中使用异步组件，此时会发起请求加载首页的路由组件：

```js
//router.js 部分代码
const router = new VueRouter({
	base: seajs.root,
	routes: [{
		path: '/',
		component: function (resolve, reject) {
			require.async('js/component/main', function(main){
				resolve(main);
			});
		},
		children: [{
			path: '/channel/:cid',
			children: [{
				path: 'type/:tid'
			}]
		}]
	},
	...
```

创建实例的同时`store`也同时初始化完成了，`store`的”actions”,”getters”,”mutations”各部分的实现比较简单，请直接参考项目源码。

到这里项目就启动完成了。

### [](#组件的实现 "组件的实现")组件的实现

上一小节是从宏观角度描述项目如何启动以及组件如何被加载，这里着重看一下Vue组件文件该如何实现。

一个Vue组件本质上是一个包含特定属性的对象，比如它可以包含`template`,`components`,`created`等等属性，因此只要是能返回这种对象的模块化文件，就已经是一个低配版的单文件组件了，像这样：

```js
module.exports = {
	template: `hello ${name}!`,
	data() {
	  name: 'Vue'
	}
}
```

组件中很有可能还需要依赖其他资源，比如样式，比如插件，或者其他子组件，也都很容易通过加载器实现，例如：

```js
define(function(require, exports, module) {
	"use strict";
	const box = require('box');   //加载插件
	const wilddogApp = require('js/assets/wilddog');

	module.exports = {
		template: `<div class="body flex-col">
  <v-head></v-head>
  <div class="flex-1 flex-col main">
    <v-nav></v-nav>
    <v-body></v-body>
  </div>
</div>`,
		components: {
			"v-head": require('js/component/head'), //加载子组件
			"v-nav": require('js/component/nav'),
			"v-body": require('js/component/body')
		},
		created: function() {
		...
```

如果组件希望独立管理自己的样式，seajs也有加载css的解决方案，可以参考`src/plugin/dropdown.js`里的实现。但就做不到`.vue`文件里的”scoped”特性了，这方面就需要开发者自己约定命名空间来避免冲突了。

### [](#插件的实现 "插件的实现")插件的实现

与Vue组件类似，Vue插件本质上是一个包含”install”属性的对象，因此一个模块化的Vue插件大概是这样的：

```js
module.exports = {
		install: function(Vue, options) {
			Vue.mixin({
			...
```

在全局方法`Vue.mixin`中就可以具体实现我们的插件功能了，这个插件可以这样被加载并调用：

```js
const Dropdown = require('js/plugin/dropdown');
Vue.use(Dropdown);
```

由于插件本质上还是调用`Vue.mixin`方法，因此如果你的插件不需要参数的话，也可以省掉`install`这一层包装，这样插件模块一旦加载就会生效，也不需要调用`Vue.use()`方法了，效果一样。

## [](#最后 "最后")最后

这个方案有明显的局限和短板，主要是由于组件加载会发起大量的请求，使项目整体运行效率受到影响，因此需要着重强调的是，组件最好不要一次同步加载，尽量的使用异步组件，分散各界面的加载压力，另外配合[恰当的缓存方案](//refined-x.com/2017/06/16/Webpack%E6%98%AF%E7%AD%94%E6%A1%88%E5%90%97/)，效果应该也不错。

项目代码：[https://github.com/tower1229/WidgetsPlayground](https://github.com/tower1229/WidgetsPlayground)  
预览地址：//refined-x.com/WidgetsPlayground/
