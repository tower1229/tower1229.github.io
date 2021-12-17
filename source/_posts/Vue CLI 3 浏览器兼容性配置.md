---
title: Vue CLI 3 浏览器兼容性配置
date: 2018-12-04 14:26:08
tags: [Vue-CLI]
---

## [](#开发代码兼容 "开发代码兼容")开发代码兼容

Vue CLI 3初始化的项目，构建时会根据`package.json`中的`browserslist`配置自动检测需要转译的语言特性，为构建代码转译JavaScript 并为 CSS 添加浏览器前缀，通常只需要修改`browserslist`即可兼容目标浏览器，例如兼容IE10可以做如下配置：

<!-- more -->

```json
"browserslist": [
    "ie 10"
  ]
```

## [](#依赖包兼容 "依赖包兼容")依赖包兼容

但该特性仅对源码(src/)有效，对依赖包无效，当依赖包需要做兼容性转译时，有三种选择：

如果确切知道有兼容性问题的依赖包名，可以配置项目根目录下的`vue.config.js`（默认不存在），将依赖包名添加到`transpileDependencies`键中，这会为该依赖同时开启语法语法转换和根据使用情况检测 polyfill。例如：

```js
module.exports = {
    transpileDependencies: ["vue-plugin-load-script"]       // 需要编译的依赖包名
}
```

如果确切的知道需要转译的语言特性，可以配置根目录下的`babel.config.js`，为`presets`的值添加所需要的 polyfill，例如：

```js
module.exports = {
  presets: [
    ['@vue/app', {
      polyfills: [
        'es6.symbol'
      ]
    }]
  ]
}
```

然而更多的情况是，我们并不确切的知道项目中引发兼容问题的具体原因，这时还可以配置为根据兼容目标导入所有 polyfill，需要设置`babel.config.js`为：

```js
module.exports = {
  presets: [
    ['@vue/app', {
        useBuiltIns: 'entry'
    }]
  ]
}
```

同时在入口文件（main.js）第一行添加

```js
import '@babel/polyfill'

```

这种方式可能导入代码中不需要的polyfill，从而使打包体积更大。

## [](#备注 "备注")备注

+ IE10中的node节点列表不支持`forEach`方法
+ IE10中background的参数中如果包括background-size参数，则background-size必须跟在background-position后面，且加上/前缀，例如：`background:url(./img/b.jpg) center /cover no-repeat;`
