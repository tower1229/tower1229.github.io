---
title: 前端作品
layout: blank
comments: false
---

<style>
  .logo_wrap {
    float: left;
    width: 202px;
    height: 120px;
    overflow: hidden;
    text-align: center
  }

  .comp-cards .logo_wrap img {
    float: none;
    height: 100%;
    margin: 0 auto;
  }

  .comp-cards {
    font-size: 0;
    margin: 40px 0;
  }

  .comp-cards ul {
    overflow: hidden;
    padding: 0;
  }

  .comp-cards li {
    margin: 14px 0;
  }

  .comp-cards a {
    display: block;
    position: relative;
    border: 0;
    overflow: hidden;
  }

  .comp-cards img {
    float: left;
    margin: 0 14px 0 0;
    max-height: 120px;
  }

  .comp-cards h3 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    height: 3em;
    line-height: 3em;
    overflow: hidden;
  }

  .comp-cards .desc {
    display: block;
    line-height: 1.7em;
    color: #999;
    margin: 0;
    font-size: 14px;
  }

  .comp-cards a:hover h3 {
    text-decoration: underline;
  }

  .comp-cards a:hover .desc {
    color: #333;
  }

  @media only screen and (max-device-width: 640px) {
    .comp-cards img {
      float: none;
      display: block;
    }

  }
</style>

## 前端作品

一个前端工程师的 web 前端作品集，里面有我开发过程中的思考和尝试。如无特殊说明，以下项目全部为我个人开发。

## 我的课程

[**《Hybrid App 开发快速指南》**](https://gitbook.cn/gitchat/column/5b679a1d201ffa4ab88e7d5d)

> 混合应用开发入门课程，将带领读者快速掌握 Hybrid App 开发能力，内容涵盖混合应用原理、混合应用开发基础、混合应用开发进阶、基于 APICloud 的混合应用开发最佳实践。

[**《基于 Vue 实现前端权限控制》**](https://gitbook.cn/gitchat/activity/5a1f620f52525e427b667ca6)

> Vue 是目前最流行的前端框架之一，当我们用 Vue 开发系统类或任意类型拥有多角色的项目时，前端权限控制是绕不过去的基础功能，本场 Chat 中我将为大家分享一套做权限控制的方式方法。

## 个人项目

<div class="comp-cards">
  <ul>
    <li>
      <a href="https://github-card.refined-x.com/" title="StartMenu" target="_blank">
        <div class="logo_wrap"><img src="https://refined-x.com/asset/github-card-logo.png" alt="Github Card" /></div>
        <h3>Github Card</h3>
        <span class="desc">精美 Github Card 生成器，生成精美的 Github 贡献数据卡片，支持 contribute 和 linktree 两种风格，根据贡献数据计算评级（S+\S\A\B\C\D），情绪价值拉满。</span>
      </a>
    </li>
    <li>
      <a href="https://tracesr.github.io/" title="觅迹导航" target="_blank">
        <img
          src="https://refined-x.com/asset/tracesr.png" alt="Tracesr logo">
        <h3>觅迹寻路</h3>
        <span class="desc">觅迹，轻量级室内导航解决方案。应用于商超、景点、园区等区域寻路场景，结合使用场景可以扩展全局消息、商户消息等多样化营销功能。</span>
      </a>
    </li>
    <li>
      <a href="https://mp.weixin.qq.com/s/CVQWLJ5Wn9gcAP4NCEhNqw" title="成长助理" target="_blank">
        <div class="logo_wrap"><img src="https://refined-x.com/asset/baby_assistant2.png" alt="成长助理"></div>
        <h3>宝贝成长助理（小程序）</h3><span class="desc">引用世界卫生组织儿童生长标准数据，测算宝宝的成长健康状态，预防婴幼儿肥胖，辅助调节宝宝喂养。</span>
      </a>
    </li>
  </ul>
</div>

## 开源作品

<div class="comp-cards">
  <ul>
    <li><a href="https://cutting-mat.github.io/" title="CuttingMat" target="_blank"><img
          src="https://refined-x.com/asset/cutting-mat-logo.png" alt="cutting-mat-logo">
        <h3>CuttingMat</h3><span class="desc">为大中型前端项目/团队提供灵活、可靠、统一、规范的研发解决方案，助你的Vue项目一臂之力。</span>
      </a></li>
    <li><a href="//refined-x.com/HybridStart/" title="HybridStart" target="_blank"><img
          src="https://refined-x.com/asset/hybridstart-logo.jpg" alt="HybridStart logo">
        <h3>HybridStart</h3><span class="desc">基于APICloud的混合应用开发框架，可能是开发这类混合应用的最佳实践。</span>
      </a></li>
    <li><a href="https://github.com/tower1229/Vue-Access-Control" title="vue-access-control" target="_blank"><img
          src="https://refined-x.com/asset/vsc-logo.png" alt="vue-access-control logo">
        <h3>vue-access-control</h3><span class="desc">Vue权限管理解决方案，最早引入动态路由方案的权限框架。</span>
      </a></li>
    <li><a href="https://github.com/tower1229/Vue-Tree-Chart" title="vue-tree-chart" target="_blank"><img
          src="https://refined-x.com/asset/vtc-logo.png" alt="vue-tree-chart logo">
        <h3>vue-tree-chart</h3><span class="desc">Vue组织结构图组件，功能比较轻量，但架不住性能好啊。</span>
      </a></li>
    <li><a href="https://github.com/tower1229/weapp-plugin-dashboard" title="weapp-plugin-dashboard"
        target="_blank"><img src="https://refined-x.com/asset/weapp-plugin-dashboard.png"
          alt="weapp-plugin-dashboard preview">
        <h3>weapp-plugin-dashboard</h3><span class="desc">微信小程序动态指针仪表盘组件。</span>
      </a></li>
    <li><a href="//flow-ui.github.io/" title="Flow-UI" target="_blank"><img
          src="https://refined-x.com/asset/flow-ui-logo.jpg" alt="Flow-UI logo">
        <h3>Flow-UI</h3><span class="desc">Flow-UI 可能是jQuery技术栈中定制性最强，加载性能最优的UI框架，基于Seajs/jQuery构建。</span>
      </a></li>
    <li><a href="//flow-ui.github.io/Flow-CLI/" title="Flow-CLI" target="_blank"><img
          src="https://refined-x.com/asset/flow-cli-logo.jpg" alt="Flow-CLI logo">
        <h3>Flow-CLI</h3><span class="desc">基于Nodejs/Gulp的前端自动化工具，Flow-UI专用。</span>
      </a></li>
  </ul>
</div>

## 代码随笔

- [videojs 视频源切换插件](https://github.com/tower1229/videojs-plugin-source-switcher)

> **videojs-plugin-source-switcher**: 集成界面 UI 的视频源切换，实现清晰度选择、剧集选择等。[项目预览](http://refined-x.com/videojs-plugin-source-switcher/)

- [videojs 视频打点插件](https://github.com/tower1229/videojs-plugin-marker)

> **videojs-plugin-marker**: 视频打点，支持动态更新，支持点击事件。[项目预览](http://refined-x.com/videojs-plugin-marker/)

- [静态页组件管理系统](https://github.com/tower1229/WidgetsPlayground)

> 前端组件的管理、编辑、预览、应用一体化方案。[项目预览](https://refined-x.com/WidgetsPlayground/)

- [HTML5 拖拽布局](https://refined-x.com/projects/codes/startmenu.html)

> 基于 HTML5 拖拽 API 模拟 Window10 菜单拖拽效果

- [HTML5 文件编辑保存](https://github.com/tower1229/htm5-file-operations)

> 基于 HTML5 File-API 实现本地文件的读取、编辑、保存。[项目预览](https://refined-x.com/htm5-file-operations/)

- [贪吃蛇小游戏](https://refined-x.com/projects/codes/snake.html)

> 突发奇想的一个贪吃蛇实现思路，然而实际上并没有什么特别

- [前端人脸识别-提取-合成](https://github.com/tower1229/frontend-face-detection)

> 纯前端的人脸识别应用，一次有趣的尝试，虽然效果一言难尽[项目预览](https://refined-x.com/frontend-face-detection/)

- [照片压缩&方向修正工具](https://github.com/tower1229/ios-photo-repair)

> 一个 IOS 拍照方向修复工具，可以修复 File 对象，也可以修复 Image 节点，上传前修复 File 对象时，还可以顺便压缩图片尺寸.

- [星座配对·小程序](https://github.com/tower1229/weapp-star)

> 小程序上手项目，基本应用，没啥特别的

- [Nodejs 爬虫 for cnBeta](https://github.com/tower1229/crawler)

> 尝试做一个爬虫，还是很好玩的

- [WEB-OTA·前端热更新](https://github.com/tower1229/WEB-OTA)

> 对本地缓存应用潜力的深度挖掘，效果惊艳，不过使用场景有限

- [AJAX-Cache·请求缓存插件](https://github.com/tower1229/AJAX-Cache)

> 可能是市面上最好的 jQuery.ajax()缓存扩展插件，需要的人自然懂

- [复利计算器](http://refined-x.com/projects/codes/interest.html)

> 一个复利计算小工具，用来模拟年缴保费的支出情况，衡量重疾险的保费扛杆，可以用来做保险产品的性价比横向比较

- [Vue-Giant-Tree](https://github.com/tower1229/Vue-Giant-Tree)

> 🌳 巨树：基于 ztree 封装的 Vue 树形组件，轻松实现海量数据的高性能渲染。[项目预览](https://refined-x.com/Vue-Giant-Tree/)

## [](#前端工程师简历 "前端工程师简历")前端工程师简历

想了解更多？参见[《不入流前端工程师简历》](https://refined-x.com/about/)
