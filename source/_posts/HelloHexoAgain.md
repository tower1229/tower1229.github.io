---
title: Hello Hexo Again
tag: [Hexo]
---


这个博客是用Hexo构建的，最近换电脑Hexo博文源文件全部丢失了，这才发现像Hexo这种构建工具需要特别注意源文件备份，否则数据风险还挺高的。如果像我一样源文件已然丢失，其实也没有什么好的恢复方法，只能手动再配置一遍主题，再将博文搬运过来。

这个过程非常需要html转markdown工具，比如我用的[这个](https://devtool.tech/html-md)，如果文章数量不太多，其实也花不了太多时间。而且这个重建博客的过程中往往我们会解决很多之前不完美而又懒得解决的问题。本文主要记录一下这两天我遇到的问题和解决过程。

<!-- more -->

## Hexo博客怎么备份源文件

Hexo博客默认部署方式会将构建后文件也就是`public/`文件夹，直接部署到目标仓库的master分支，如果想连源文件一起交由github管理，部署方式需要改成分支部署，比如另建一个`page`分支用于发布构建后文件，将Hexo的部署配置改为：

```yml
deploy:
  type: git
  repo: https://github.com/tower1229/tower1229.github.io # 你的git仓库地址
  branch: page  # 你的GitHubPage发布分支
```

配合github-page在source中选择`page`分支，就可以实现Hexo博客的分支发布了。此时就可以将博客目录整体提交到master分支，别忘了忽略`public/`。

## Hexo博客自定义layout页面

我的博客里有很多单页，比如个人简介，项目介绍这种，这些单页其实类似文章详情页，但是内容区域不要展示页面的title和发布信息之类的，也不希望展示评论组件，现有的layout都满足不了，需要自己创建一个新的layout。

方法也很简单，

- 复制`themes\next\layout\post.swig`到`themes\next\layout\blank.swig`
- 复制`themes\next\layout\_macro\post.swig`到`themes\next\layout\_macro\blank.swig`
- 删掉`themes\next\layout\blank.swig`中不需要的文章标题之类的内容，修改`{{ partial('_macro/post.swig', {post: page}) }}`为`{{ partial('_macro/blank.swig', {post: page}) }}`

然后配置主题配置增加博客导航菜单，并在`source/`文件夹创建对应的文件，比如`source/about/index.md`。页面配置更换layout，并关掉评论：

```markdown
---
title: 前端简历
layout: blank
comments: false
---
```

## Hexo博客自定义文章底部

做过SEO的应该知道文章内容里是需要一定的关键词密度的，简单的做法在头部底部插入一段包含指定关键词的文案，重点在于这个插入段落必须在“文章正文”的部分，比如我用的`NexT`主题，正文就是`<div class="post-body">...</div>`这个元素里，想在这里插入内容需要修改`themes\next\layout\_macro\post.swig`这个文件，根据注释文章内容开始结束位置插入你想要的内容。

注意修改的时候加上非首页判断，因为NexT主题的首页和文章详情共用这个模板。

```swig
{%- if not is_index %}

{%- endif %}
```

重新构建，所有的文章都会带上自定义底部了。但还有个小问题，如果像本站一样希望在文章末尾加一个转载地址链接，在Hexo文档里找到`page.permalink`变量作为锚文本的话，会出现中文自动编码的情况，而我们希望锚文本是可读的，这个Hexo并没有现成的变量可以实现，需要手动拼接网站域名和文章路径，像这样：

```html
<p>前端路上原创技术文章，转载请注明出处：<a href="{{ page.permalink }}">{{ config.url }}/{{ page.path }}</a></p>
```

## Hexo首页展示文章摘要

默认使用NexT主题会发现首页把文章全文都展示出来了，我们通常希望首页展示少量摘要就好，这样可以一屏内展示更多的内容，我记得之前我用的版本是可以自动生成摘要的，其实也简单，就是自动提取内容跟的前200字符，不过最新版的NexT主题没有这个功能，想要使用摘要最方便的办法就是在正文插入more标签：

```html
<!-- more -->
```

标签之前的内容会作为摘要展示在首页列表上，行吧，这样也有好处，就是摘要的内容一定程度上可以自由控制，不会出现断句的情况，习惯之后也不算麻烦，文章都写了，还差多写一个标签么。

## Hexo不需要全局安装

其实Hexo作为一个博客生成器，本来就没必要全局安装，只要在博客根目录的`package.json`配置好依赖和npm脚本，也可以像普通前端项目一样，拉下源码执行一下`npm install`就可以继续开发了。

```json
"scripts": {
    "build": "hexo generate",
    "clean": "hexo clean",
    "deploy": "hexo deploy",
    "serve": "hexo server",
    "algolia": "hexo algolia",
    "new": "hexo new post Artical"
  },
  "hexo": {
    "version": "5.4.0"
  },
  "dependencies": {
    "hexo": "^5.4.0",
    "hexo-algolia": "^1.3.2",
    "hexo-deployer-git": "^3.0.0",
    "hexo-generator-archive": "^1.0.0",
    "hexo-generator-baidu-sitemap": "^0.1.9",
    "hexo-generator-category": "^1.0.0",
    "hexo-generator-index": "^2.0.0",
    "hexo-generator-sitemap": "^2.2.0",
    "hexo-generator-tag": "^1.0.0",
    "hexo-renderer-ejs": "^2.0.0",
    "hexo-renderer-marked": "^4.1.0",
    "hexo-renderer-stylus": "^2.0.1",
    "hexo-server": "^2.0.0"
  }
```

## Hexo博客必备插件

- **hexo-deployer-git** GitHubPage部署
- **hexo-generator-sitemap** 自动生成站点地图
- **hexo-generator-baidu-sitemap** 同上，不过是百度版本

## Hexo博文字数统计的bug

在当前版本`Hexo v5.4.0 + hexo-theme-next v7.8.0`下，安装NexT主题默认继承的字数统计插件`hexo-symbols-count-time v0.7.1`会出现统计不出字数和阅读时间的问题，原因是模板里调用字数统计方法时，传的参数不符合预期，需要修改`themes\next\layout\_macro\post.swig`：

```swig
<span>{{ symbolsCount(post) }}</span>
改为：
<span>{{ symbolsCount(post.content) }}</span>

<span>{{ symbolsTime(post, 
改为：
<span>{{ symbolsTime(post.content, 
```

以上就是重建博客我觉得值得记录的点，好了我要去搬运博文了 — —
