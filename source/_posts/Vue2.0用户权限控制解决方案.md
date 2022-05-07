---
title: Vue2.0用户权限控制解决方案
date: 2017-11-28 10:12:39
tags: [Vue]
---

[Vue-Access-Control](//refined-x.com/Vue-Access-Control/)是一套基于 Vue/Vue-Router/axios 实现的前端用户权限控制解决方案，通过对路由、视图、请求三个层面的控制，使开发者可以实现任意颗粒度的用户权限控制。

<!-- more -->

## [](#安装 "安装")安装

### [](#版本要求 "版本要求")版本要求

- Vue 2.0x
- Vue-router 3.x

### [](#获取 "获取")获取

项目主页：//refined-x.com/Vue-Access-Control/

git：`git clone https://github.com/tower1229/Vue-Access-Control.git`

### [](#运行 "运行")运行

```bash
//开发
npm run serve

//构建
npm build

```

## [](#概述 "概述")概述

### [](#整体思路 "整体思路")整体思路

会话开始之初，先初始化一个只有登录路由的 Vue 实例，在根组件 created 钩子里将路由定向到登录页，用户登录成功后前端拿到用户 token，设置 axios 实例统一为请求 headers 添加`{"Authorization":token}`实现用户鉴权，然后获取当前用户的权限数据，主要包括路由权限和资源权限，之后动态添加路由，生成菜单，实现权限指令和全局权限验证方法，并为 axios 实例添加请求拦截器，至此完成权限控制初始化。动态加载路由后，路由组件将随之加载并渲染，而后展现前端界面。

为解决浏览器刷新路由重置的问题，拿到 token 后要将其保存到`sessionStorage`，根组件的 created 钩子负责检查本地是否已有 token，如果有则无需登录直接用该 token 获取权限并初始化，如果 token 有效且当前路由有权访问，将加载路由组件并正确展现；若当前路由无权访问将按路由设置跳转 404；如果 token 失效，后端应返回 4xx 状态码，前端统一为 axios 实例添加错误拦截器，遇到 4xx 状态码执行退出操作，清除`sessionStorage`数据并跳转到登录页，让用户重新登录。

### [](#最小依赖原则 "最小依赖原则")最小依赖原则

Vue-Access-Control 的定位是单一领域解决方案，除了 Vue/Vue-Router/axios 之外没有其他依赖，理论上可以无障碍的应用到任何有权限控制需求的 Vue 项目中，项目基于[webpack](https://github.com/vuejs-templates/webpack) 模板开发构建，大多数新项目可以直接基于检出代码继续开发。需要说明的是，项目额外引入的[Element-UI](http://element-cn.eleme.io/#/zh-CN)和[CryptoJS](https://www.npmjs.com/package/crypto-js)仅用于开发演示界面，他们不是必须且与权限控制毫无关系，项目应用中可以自行取舍。

### [](#目录结构 "目录结构")目录结构

```js
src/
  |-- api/                  //接口文件
  |     |-- index.js             //输出通用axios实例
  |     |-- account.js           //按业务模块组织的接口文件，所有接口都引用./index提供的axios实例
  |-- assets/
  |-- components/
  |-- router/
  |     |-- fullpath.js         //完整路由数据，用于匹配用户的路由权限得到实际路由
  |     `-- index.js            //输出基础路由实例
  |-- views/
  |-- App.vue
  ·-- main.js
```

### [](#数据格式约定 "数据格式约定")数据格式约定

- 路由权限数据必须是如下格式的对象数组，`id`和`parent_id`相同的两个路由具有上下级关系，如果希望使用自定义格式的路由数据，需要修改路由控制的相关实现，详见[**路由控制**](#路由控制)

```json
[
  {
    "id": "1",
    "name": "菜单1",
    "parent_id": null,
    "route": "route1"
  },
  {
    "id": "2",
    "name": "菜单1-1",
    "parent_id": "1",
    "route": "route2"
  }
]
```

- 资源权限数据必须是如下格式的对象数组，每个对象代表一个 RESTful 请求，支持带参数的 url，具体格式说明见[**请求控制**](#请求控制)

```json
[
  {
    "id": "2c9180895e172348015e1740805d000d",
    "name": "账号-获取",
    "url": "/accounts",
    "method": "GET"
  },
  {
    "id": "2c9180895e172348015e1740c30f000e",
    "name": "账号-删除",
    "url": "/account/**",
    "method": "DELETE"
  }
]
```

## [](#路由控制 "路由控制")路由控制

路由控制包括动态注册路由和动态生成菜单两部分。

### [](#动态注册路由 "动态注册路由")动态注册路由

最初实例化的路由仅包括登录和 404 两个路径，我们期待完整的路由是这样的：

```js
[
  {
    path: "/login",
    name: "login",
    component: (resolve) => require(["../views/login.vue"], resolve),
  },
  {
    path: "/404",
    name: "404",
    component: (resolve) => require(["../views/common/404.vue"], resolve),
  },
  {
    path: "/",
    name: "首页",
    component: (resolve) => require(["../views/index.vue"], resolve),
    children: [
      {
        path: "/route1",
        name: "栏目1",
        meta: {
          icon: "icon-channel1",
        },
        component: (resolve) => require(["../views/view1.vue"], resolve),
      },
      {
        path: "/route2",
        name: "栏目2",
        meta: {
          icon: "ico-channel2",
        },
        component: (resolve) => require(["../views/view2.vue"], resolve),
        children: [
          {
            path: "child2-1",
            name: "子栏目2-1",
            meta: {},
            component: (resolve) => require(["../views/route2-1.vue"], resolve),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    redirect: "/404",
  },
];
```

那么接下来就需要获取首页以及其子路由们，思路是事先在本地存一份整个项目的完整路由数据，然后根据用户权限对完整路由进行筛选。

筛选的实现思路是先将后端返回的路由数据处理成如下哈希结构：

```js
let hashMenus = {
   "/route1":true,
   "/route1/route1-1":true,
   "/route1/route1-2":true,
   "/route2":true,
   ...
}
```

然后遍历本地完整路由，在循环中将路径拼接成上述结构中的 key 格式，通过`hashMenus[route]`就可以判断路由是否匹配，具体实现见`App.vue`文件中的`getRoutes()`方法。

如果后端返回的路由权限数据与约定不同，就需要自行实现筛选逻辑，只要能得到实际可用的路由数据就可以，最终使用`addRoutes()`方法将他们动态添加到路由实例中，注意 404 页面的模糊匹配一定要放在最后。

### [](#动态菜单 "动态菜单")动态菜单

路由数据可以直接用来生成导航菜单，但路由数据是在根组件中得到的，导航菜单存在于`index.vue`组件中，显然我们需要通过某种方式共享菜单数据，方法有很多，一般来说首先想到的是 Vuex，但菜单数据在整个用户会话过程中不会发生改变，这并不是 Vuex 的最佳使用场景，而且为了尽量减少不必要的依赖，这里用了最简单直接的方法，把菜单数据挂在根组件`data.menuData`上，在首页里用`this.$parent.menuData`获取。

另外，导航菜单很可能会有添加栏目图标的需求，这可以通过在路由中添加`meta`数据实现，例如将图标 class 或 unicode 存到路由 meta 里，模板中就可以访问到 meta 数据，用来生成图标标签。

在多角色系统中可能遇到的一个问题是，不同角色有一个名字相同但功能不同的路由，比如说*系统管理员*和*企业管理员*都有”账号管理”这个路由，但他们的操作权限和目标不同，实际上是两个完全不同的界面，而 Vue 不允许多个路由同名，因此路由的 name 必须做区分，但把区分后的 name 显示在前端菜单上会很不美观，为了让不同角色可以享有同一个菜单名称，我们只要将这两个路由的`meta.name`都设置成”账号管理”，在模板循环时优先使用`meta.name`就可以了。

菜单的具体实现可以参考`views/index.vue`。

## [](#视图控制 "视图控制")视图控制

视图控制的目标是根据当前用户权限决定界面元素显示与否，典型场景是对各种操作按钮的显示控制。实现视图控制的本质是实现一个权限验证方法，输入请求权限，输出是否获准。然后配合`v-if`或`jsx`或自定义指令就能灵活实现各种视图控制。

### [](#全局验证方法 "全局验证方法")全局验证方法

验证方法的的实现本身很简单，无非是根据后端给出的资源权限做判断，重点在于优化方法的输入输出，提升易用性，经过实践总结最终使用的方案是，将权限跟请求同时维护，验证方法接收请求对象数组为参数，返回是否具有权限的布尔值。

请求对象格式：

```js
//获取账户列表
const request = {
  p: ["get,/accounts"],
  r: (params) => {
    return instance.get(`/accounts`, { params });
  },
};
```

权限验证方法`$_has()`的调用格式：

```js
v-if="$_has([request])"

```

权限验证方法的具体实现见`App.vue`中`Vue.prototype.$_has`方法。

将权限验证方法全局混入，就可以在项目中很容易的配合`v-if`实现元素显示控制，这种方式的优点在于灵活，除了可以校验权限外，还可以在判断表达式中加入运行时状态做更多样性的判断，而且可以充分利用`v-if`响应数据变化的特点，实现动态视图控制。

具体实现细节参考[基于 Vue 实现后台系统权限控制](//refined-x.com/2017/08/29/%E5%9F%BA%E4%BA%8EVue%E5%AE%9E%E7%8E%B0%E5%90%8E%E5%8F%B0%E7%B3%BB%E7%BB%9F%E6%9D%83%E9%99%90%E6%8E%A7%E5%88%B6/)中的相关章节。

### [](#自定义指令 "自定义指令")自定义指令

`v-if`的响应特性是把双刃剑，因为判断表达式在运行过程中会频繁触发，但实际上在一个用户会话周期内其权限并不会发生变化，因此如果只需要校验权限的话，用`v-if`会产生大量不必要的运算，这种情况只需在视图载入时校验一次即可，可以通过自定义指令实现：

```js
//权限指令
Vue.directive("has", {
  bind: function (el, binding) {
    if (!Vue.prototype.$_has(binding.value)) {
      el.parentNode.removeChild(el);
    }
  },
});
```

自定义指令内部仍然是调用全局验证方法，但优点在于只会在元素初始化时执行一次，多数情况下都应该使用自定义指令实现视图控制。

## [](#请求控制 "请求控制")请求控制

请求控制是利用 axios 拦截器实现的，目的是将越权请求在前端拦截掉，原理是在请求拦截器中判断本次请求是否符合用户权限，以决定是否拦截。

普通请求的判断很容易，遍历后端返回的的资源权限格式，直接判断`request.method`和`request.url`是否吻合就可以了，对于带参数的 url 需要使用通配符，这里需要根据项目需求前后端协商一致，约定好通配符格式后，拦截器中要先将带参数的 url 处理成约定格式，再判断权限，方案中已经实现了以下两种通配符格式：

```bash
1. 格式：/resources/:id
   示例：/resources/1
   url: /resources/**
   解释：一个名词后跟一个参数，参数通常表示名词的id

2. 格式：/store/:id/member
   示例：/store/1/member
   url：/store/*/member
   解释：两个名词之间夹带一个参数，参数通常表示第一个名词的id

```

对于第一种格式需要注意的是，如果你要发起一个 url 为`"/aaa/bbb"`的请求，默认会被处理成`"/aaa/**"`进行权限校验，如果这里的”bbb”并不是参数而是 url 的一部分，那么你需要将 url 改成`"/aaa/bbb/"`，在最后加一个”/“表示该 url 不需要转化格式。

拦截器的具体实现见`App.vue`中的`setInterceptor()`方法。

如果你的项目还需要其他的通配符格式，只需要在拦截器中实现对应的检测和转化方法就可以了。

## [](#演示及说明 "演示及说明")演示及说明

### [](#演示说明： "演示说明：")演示说明：

DEMO 项目中演示了动态菜单、动态路由、按钮权限、请求拦截。

演示项目后端由[rap2](http://rap2.taobao.org/)生成 mock 数据，登录请求通常应该是 POST 方式，但因为 rap2 的编程模式无法获取到非 GET 的请求参数，因此只能用 GET 方式登录，实际项目中不建议仿效；

另外登录后获取权限的接口本来不需要携带额外参数，后端可以根据请求头携带的 token 信息实现用户鉴权，但因为 rap2 的编程模式获取不到 headers 数据，因此只能增加一个”Authorization”参数用于生成模拟数据。

### [](#测试账号 "测试账号:")测试账号:

```bash
1. username: root
   password: 任意
2. username: client
   password: 任意

```

### [](#演示地址 "演示地址:")演示地址:

[https://refined-x.com/Vue-Access-Control/](https://refined-x.com/Vue-Access-Control/)
