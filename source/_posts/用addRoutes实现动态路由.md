---
title: 用addRoutes实现动态路由
date: 2017-09-01 16:12:12
tags: [Vue]
---

之前在[基于Vue实现后台系统权限控制](//refined-x.com/2017/08/29/%E5%9F%BA%E4%BA%8EVue%E5%AE%9E%E7%8E%B0%E5%90%8E%E5%8F%B0%E7%B3%BB%E7%BB%9F%E6%9D%83%E9%99%90%E6%8E%A7%E5%88%B6/)一文中提到路由权限的实现思路，因为不喜欢在每次路由跳转的before钩子里做判断，所以在初始化Vue实例前对路由做了筛选，再用实际路由初始化Vue实例，代价是登录页需要从Vue实例中独立出来，实现上倒没什么问题，不过这种做法需要在登录和首页之间通过url跳转，感觉总是不太”优雅”，实际上只要能在登录后动态修改当前实例的路由就行了，之前确实没办法，但vue-router 2.2版本新增了一个`router.addRoutes(routes)`方法，让动态路由得以实现。

<!-- more -->

## [](#想当然的实现方案 "想当然的实现方案")想当然的实现方案

用动态路由实现路由权限控制貌似是一个完美的方案，初始路由只有登录和404，登录后动态添加可用路由，同时将菜单数据保存到Vuex或本地用于实现动态菜单，关键节点大致如下：

```js
//初始路由：
[{
  path: '/login',
  name: 'login',
  component: (resolve) => require(['../views/common/404.vue'], resolve)
}, {
  path: '/404',
  name: '404',
  component: (resolve) => require(['../views/common/404.vue'], resolve)
}, {
  path: '*',
  redirect: '/404'
}]

//登录逻辑
let vm = this;
axios.get('/login', vm.user).then((res) => {
    let extendsRoutes = filterRoutes(res.menus); 
    <!--
    //假设得到的可用路由如下
    [{
      path: '/',
      name: '首页',
      component: (resolve) => require(['../views/index.vue'], resolve),
      children: [{
        path: '/menus',
        name: '菜单管理',
        component: (resolve) => require(['../views/menus.vue'], resolve)
      }, {
        path: '/resources',
        name: '资源管理',
        component: (resolve) => require(['../views/resources.vue'], resolve)
      }]
    }]-->
    //存菜单
    sessionStorage.setItem('menus',JSON.stringify(extendsRoutes[0].children));
    //动态添加路由
    vm.$router.addRoutes(extendsRoutes);
    //跳转到应用界面
    vm.$router.push({path:'/'});
})

//首页获取菜单数据
this.menus = JSON.parse(sessionStorage.getItem('menus')); 
//用此数据循环菜单
..
```

目前为止看上去一切顺利，然而前方有坑。

## [](#动态路由的坑 "动态路由的坑")动态路由的坑

第一个坑是，如果你将这套逻辑实现之后会发现打开应用看到的第一个页面是404，这是因为启动服务后将默认打开首页’/‘，然而初始路由中没有这个路径，因此根据路由规则跳转到了404。我们希望结果当然是跳转到’/login’，因此需要对这种情况做判断，在用户登录之前所有请求都要指向’/login’，这个判断可以在before钩子里做也可以在根组件里做，建议做在根组件的created回调里，核心代码大概这样：

```js
let isLogin = sessionStorage.getItem('user');
if(!isLogin){
    return this.$router.push({path:'/login'});
}
```

这时候已经可以顺利登录了，登录后很快就会发现第二个坑，手动刷新页面又会跳到404，这是因为刷新会导致Vue重新实例化，路由也恢复到了初始路由，于是当前路径又被重定向到了404，这个问题的根源是可用路由没有实现持久化，那么可以通过将路由数据存sessionStorage来解决，实例化之前如果检测到本地路由就直接合并路由，像这样：

```js
//检测本地路由
let localRoutes = sessionStorage.getItem('routes');
if(localRoutes){
    router.addRoutes(JSON.parse(localRoutes));
}
//实例化
new Vue({
  el: '#app',
  router,
  render: h => h(App)
});
```

理论上可以，但实际操作要远比上述代码复杂，因为存在本地的只能是权限数据而不是真实路由，路由在存、取之前都要先根据权限匹配获得，过程还是挺繁琐的，而且必须依赖sessionStorage这种持久存储，没有其他方法。问题就出在这个sessionStorage上，原则上权限只能在内存变量中流转，不能直接暴露到用户可操作的地方，试想只要用户手动修改了sessionStorage里的权限，再刷新一下页面就能突破前端路由控制了，非常的不靠谱。

## [](#改进方案 "改进方案")改进方案

既然不能存本地，那就每次刷新都重新从服务端获取，所以改进后的方案是本地存用户token，每次刷新要凭token从服务端重新获取用户信息和权限，然后动态更新路由，获取权限操作可以跟登录检测一起放在根组件的created回调中进行，确保访问任何路径都会先执行这一步，但因为获取权限是异步操作，在此之前仍然会经过应用初始化，所以还是会遇到404的问题，为此我们只需做一个小调整，将不匹配路径(‘\*’)跳404的路由从初始路由中移除，动态更新路由时再把这个配置加进去，如下：

```js
let userPath = ...//我们的动态路由
//注入时拼接404处理路由
this.$router.addRoutes(userPath.concat([{
  path: '*',
  redirect: '/404'
}]));
```

这样就解决了刷新问题，后面还有几个小问题就简单了。

首先是菜单，之前通过`$router.options.routes`访问路由数据实现动态菜单，但这个数据不是响应式的，无法追踪动态路由的变化，因此我们需要将得到的导航菜单数据存到sessionStorage或Vuex里实现数据共享。

资源权限控制也受到很大的影响，实现较为细致的权限控制需要一个自定义权限验证指令和一个全局验证方法，之前的方案里权限是在Vue实例化之前获取的，所以可以很方便的拿到权限后实现验证方法，然后用验证方法实现自定义指令，再将方法全局混合进Vue，然后实例化，这样实例中的 所有组件都可以使用自定义指令和验证方法；但现在的方案是先实例化再获取权限，实例化之前根本没有权限数据，所以自定义指无法实现，等拿到权限后实现了验证方法，却无法再全局混合了。

这个问题最后也解决了，但解决方案就彻底的”有辱斯文”了，首先是全局方法的实现，直接这么做:

```js
Vue.prototype.has = function(){
    ...
}
```

使用方式跟全局混合的方法完全一样。

自定义指令的实现本来很头疼，因为全局指令只能在实例化之前实现，但那时候又确实没有权限，不过既然验证方法这么做的话，指令倒是也顺便解决了，像这样：

```js
//权限指令
Vue.directive('has', {
  bind: function(el, binding) {
    if (!Vue.prototype.has(binding.value)) {
      el.parentNode.removeChild(el);
    }
  }
});
```

神奇的`prototype`貌似自带惰性效果，可以先注册后实现，具体原因我也不太明白，如过有大牛路过，希望能留下答案。

## [](#后记 "后记")后记

生命不息，折腾不止啊，本来已经放弃的思路，捋着捋着竟然捋顺了，然后又花了大半天把原来多入口的项目改成了单入口，虽然麻烦了一顿，但心里总算舒坦了。

