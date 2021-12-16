---
title: RESTful学习及应用
date: 2017-09-22 17:26:35
tags:
---

## [](#RESTful是什么 "RESTful是什么")RESTful是什么

RESTful是一种API架构，符合REST设计原则的API都可以被称为RESTful，REST的全称是*Representational State Transfer*。

<!-- more -->

REST的核心原则是后端将资源发布为URI，前端通过URI访问资源，并通过HTTP动词表示要对资源进行的操作，典型的RESTful API长这样：

```bash
POST /article           //增加一篇文章
DELETE /article/1       //删除id为1的文章
PUT /article/1          //修改id为1的文章
GET /articles/1         //查询id为1的文章

```

这里需要明确一个概念：**资源**，后端提供的所有内容都可以被定义为资源，前端用户的一切行为，本质都是与一系列后端资源互动的结果。从这个角度来讲，前端的意义就是连接用户与资源，使用户能以最简单的方式调度后端资源，并将调度结果以用户最容易接受的方式呈现出来。

## [](#为什么使用RESTful "为什么使用RESTful")为什么使用RESTful

前后端分离的本质是前后端以API为界限进行开发解耦，所以前后端分离的副产品是大量的API，采用RESTful架构可以让API的表现力更强，更易于被理解；对于接口开发来说，RESTful风格也更易于扩展，这对于大型项目非常重要。

RESTful是无状态的，因此无论前端是什么设备，前端是什么状态，都可以无差别的请求资源，有利于后端实现分布式。

RESTful允许前端索取指定格式的信息，因此可以实现一套统一的API服务于不同的前端设备。

## [](#如何构建RESTful-API "如何构建RESTful API")如何构建RESTful API

### [](#一、每个网址代表一种资源，网址中只能有名词 "一、每个网址代表一种资源，网址中只能有名词")一、每个网址代表一种资源，网址中只能有名词

网址仅用来表示资源的名称，而不包括操作，因此只能由名词组成；但有些资源可能自带操作属性，比如转账，这时候我们应该将转账看成一种服务（名词），将转账的其他信息作为参数传递

### [](#二、对于资源的操作类型由HTTP动词表示 "二、对于资源的操作类型由HTTP动词表示")二、对于资源的操作类型由HTTP动词表示

常用的四种HTTP动词以及对应的SQL操作。

```bash
GET（SELECT）：从服务器取出资源（一项或多项）。
POST（CREATE）：在服务器新建一个资源。
PUT（UPDATE）：在服务器更新资源（客户端提供改变后的完整资源）
DELETE（DELETE）：从服务器删除资源。
```

### [](#三、统一的返回结果 "三、统一的返回结果")三、统一的返回结果

针对不同操作，服务器向用户返回的结果应该符合以下规范。

```bash
GET /collection：返回资源对象的列表（数组）
GET /collection/resource：返回单个资源对象
POST /collection：返回新生成的资源对象
PUT /collection/resource：返回完整的资源对象
PATCH /collection/resource：返回完整的资源对象
DELETE /collection/resource：返回一个空文档

```

### [](#四、返回正确的状态码 "四、返回正确的状态码")四、返回正确的状态码

常用状态码

```bash
200 ：服务器成功返回用户请求的数据
400 ：用户发出的请求有错误
401 ：表示用户没有权限
403 : 表示用户得到授权（与401错误相对），但访问被禁止的
404 ：用户发出的请求针对的是不存在的记录
500 ：服务器发生错误，用户无法判断发出的请求是否成功

```

### [](#五、允许通过HTTP内容协商 "五、允许通过HTTP内容协商")五、允许通过HTTP内容协商

客户端可以通过Accept头请求一种特定格式的表述，服务端则通过Content-Type告诉客户端资源的表述形式。若服务器不支持，它应该返回一个HTTP 406响应，表示拒绝处理该请求。

通常项目中最常用的还是直接预定为JSON格式。

## [](#web端的应用 "web端的应用")web端的应用

目前最流行的web端AJAX类库当属axios，axios与RESTful完美兼容，主要体现在以下几个方面。

axios将HTTP动词直接封装为方法，正好对应RESTful的API风格，在RESTful架构中使用起来非常方便

```js
axios.post(`/article`, params)
axios.delete(`/article/1`, params)
axios.put(`/article/1`, params)
axios.get(`/article/1`, params)
```

而且axios的返回数据包括响应正文和状态码等信息，配合拦截器很容易实现对RESTful API错误码的统一处理。

```js
//错误处理
axios.interceptors.response.use(function(response) {
  return response;
}, function(error) {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        
        break;
      case 401:
        
        break;
      case 403:
        
        break;
      ...
    }
  }
});
```

更多axios内容参考[这里](https://www.npmjs.com/package/axios)。

## [](#最后 "最后")最后

其实RESTful的绝大多数内容都是规范推荐的做法，没有什么新东西，只不过前几年后端MVC盛行的时期，没有这么重的API开发需求，在这方面就一切从简了，近来赶上前后端分离的东风，API设计又被大家重视起来了，重回规范的RESTful相当于让大家见识了一下当年规范制定者们的远见卓识，就像小时候不听话的孩子在长大的某一天里突然想起来长辈曾经的教诲一样。
