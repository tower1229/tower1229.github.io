---
title: 基于Vue实现动态组织结构图
date: 2018-08-03 10:34:28
tags: [Vue, Vue-Tree-Chart]
---

基于Vue实现动态组织结构图

<!-- more -->

## [](#Vue-Tree-Chart "Vue-Tree-Chart")Vue-Tree-Chart

最近一个项目里有个前端绘制家谱图的需求，大概是下面这个样子：

![](https://refined-x.com/asset/vue-tree-chart.png)

点击节点会弹出操作菜单，实现增删改查等操作，查阅网上资料发现，现有案例基本都是基于[orgchart](http://www.getorgchart.com/)这个jQuery插件实现的，我们的项目是基于Vue的，不希望因为这个功能引入jQuery，所以就基于Vue实现了一个简易版的树形图/组织结构图组件：[Vue-Tree-Chart](https://github.com/tower1229/Vue-Tree-Chart)。

[Vue-Tree-Chart](https://github.com/tower1229/Vue-Tree-Chart)实现了最核心的组织结构图动态绘制和点击节点回调，基于这两点已经可以满足绝大多数相关需求了，例如前端动态增删改，无非是编辑组件数据，利用Vue的数据驱动特性界面就会自动更新；服务端增删改就更简单了，前端只管请求操作接口，操作结束后拉取最新数据同步给组件就行了；组件默认界面非常简单，只引入了图表呈现所必须的少量样式，后期非常方便自定义风格；至于拖动、缩放、导出等不太普遍的需求，组件没有内置，但是在源码基础上实现这些扩展也都比较简单。

## [](#如何绘制结构图 "如何绘制结构图")如何绘制结构图

### [](#不靠谱的思路 "不靠谱的思路")不靠谱的思路

拿到这个需求后我首先想到的思路是用DIV布局+JS动态计算实现，如果不考虑节点连线的话，这个思路其实勉强也能应付，大致实现分为三步：

#### [](#一、将数据按“代”拆分 "一、将数据按“代”拆分")一、将数据按“代”拆分

原始数据格式只能是层层深入的JSON对象：

```json
{
    name: 'root',
    children: [{
        name: 'child',
        children: [{
            name: 'grandchild',
            ...
        }]
    }]
}
```

按“代”拆分后成为这样：  

```js
[
    [{
        id: 0,
        name: 'root
    }],
    [{
        id: 1,
        name: 'child',
        pid: 0
    }],
    [{
        id: 2
        name: 'grandchild',
        pid: 1
    }]
]
```

形象一点，我想要的其实是这种结构：

![](https://refined-x.com/asset/nodes-1.png)

#### [](#二、按“代”绘制节点 "二、按“代”绘制节点")二、按“代”绘制节点

有了上一步的数据，再将每一代的节点从上到下生成出来简直不要太容易，然后居中一下，树形结构基本就出来了：

![](https://refined-x.com/asset/nodes-2.png)

这时节点的间距是相同的，我们需要在下一步中计算并更新节点间距，使他们呈现出正确的归属关系。

#### [](#三、计算节点间距 "三、计算节点间距")三、计算节点间距

我们需要的是这样的效果：

![](https://refined-x.com/asset/nodes-3.png)

观察图形得知，除了初代节点始终居中之外，其他节点所占空间应该等于后代节点所占空间，所以我们需要从最后一代节点开始遍历，依次向上得到父级节点应该占据的空间，从而计算出其需要的左右`marin`值，将所有包含子节点的节点应用正确的`margin`后，应该就可以得到上图的效果。

另外，家谱图还需要节点间连线，如果仍然按照这个思路，用div模拟画线也可以，但这样一来计算逻辑的复杂度就比较大了，这时候已经明显感觉思路不对了，必须换方向。

### [](#Table的妙用 "Table的妙用")Table的妙用

后来参考orgchart的实现，打开调试工具一看，怎么里面一大堆`<table>`标签，心想这是什么骚操作，后来仔细研究DEMO的标签结构，原来orgchart非常巧妙的利用了Table标签的特性，只要合理嵌套Table，浏览器就会自然渲染出我们需要的结果。

这里补充一下Table的背景知识，在DIV+CSS刚刚盛行的年代，Table布局因为渲染慢和代码冗余被所有前端集体唾弃，Table布局渲染慢的原因是，TD是唯一一个先进入文档可能被后进入文档影响到自身尺寸的标签，如果按照普通的页面渲染逻辑加载整页Table，就会随着TD标签的载入频繁触发页面重绘，浏览器为了避免这种情况所以会对Table采用特殊的绘制逻辑，也就是等整个Table标签全部加载完，再集中一次绘制到页面上。这样的结果就是当页面完全使用Table布局的时候，整个页面加载过程是空白的，加载完之后页面会一次性突然呈现，这在弱网情况下的用户体验非常差，因此不使用Table布局成了对前端开发最基本的要求。

Table的这种特性虽然不适合用来布局，但却使Table成了HTML中“最强大”的标签，比如前面我们梳理的树形插件的实现思路，其实就是对Table特性的拙劣模仿，一个多代组织结构关系完全可以只用Table标签完美实现，甚至连CSS都不需要：

```html
<table>
    <tr>
        <td colspan="2">
            root
        </td/>
    </tr>
    <tr>
        <td>
            <table>
                <tr>
                    <td>
                        children1
                    </td>
                    <td>
                        <table>
                            <tr>
                                <td colspan="2">
                                    children2
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    grandchild1
                                </td>
                                <td>
                                    grandchild2
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
```

虽然结构很罗嗦，但确实能实现需求。

节点连线的实现同样是利用了Table的自适应性，只不过实现的更加精妙：

![](https://refined-x.com/asset/nodes-4.png)

上下级的连线分成两行（TR）实现，第一行实现一个连结父节点的居中竖线，第二行实现连接每个子节点的竖线及横向连线，第一行比较简单这里不提，第二行的实现非常有意思，上图中画红框的部分分别是实现效果和标签结构。

首先按照子节点数量X2来生成TD标签，然后”rightLine”、”leftLine”交替为每个TD添加class，”rightLine”为TD显示1px的右边线，”leftLine”为TD显示1px的左边线，六根一右一左的线两两合并在一起，正好呈现出三条连接每个子节点正中的2px竖线；然后除了第一个和最后一个TD标签以外，全部添加”topLine”的class，为他们添加2px的上边线，这样会呈现出一条正好连接三条竖线的横线，再拼上第一行TR的居中竖线，上下级的连线就实现出来了。

看到这部分时，反正我是感觉自己的智商被碾压了。（这部分在1.1.0版本中被重构掉了，因为用伪元素实现连线更方便）

基于这个思路用Vue实现了一遍，独立成组件后[整个文件](https://github.com/tower1229/Vue-Tree-Chart/blob/master/lib/components/TreeChart.vue)代码不过百行左右。

另外知识的活学活用真的非常重要，这里面的知识点一个入门前端就应该掌握，但开发的时候却完全没有想到这个思路，可能跟近几年的工作大量依赖js有关系，对HTML和CSS的敏感性降低了。总是使用自己熟悉的方式解决问题是人的共性，但这一点对开发者来说绝对不是个好习惯，需要反省。

## [](#二次开发 "二次开发")二次开发

Vue-Tree-Chart已经发布到npm，默认可以通过包管理工具将其添加到项目：

```js
npm i vue-tree-chart --save

```

但npm安装的是编译后的版本，如果希望比较灵活的在项目中做二次开发，可以直接将`'lib/components/TreeChart.vue'`文件下载到项目的组件目录（`'src/components/'`），直接修改`TreeChart.vue`文件就可以了。

## [](#vue-cli-3-0-构建库 "vue-cli 3.0 构建库")vue-cli 3.0 构建库

最后提一下vue-cli 3.0的[构建目标](https://cli.vuejs.org/zh/guide/build-targets.html#%E5%BA%94%E7%94%A8)功能，为了方便组件开发者，vue-cli 3.0在常规构建之外单独提供了针对库和Web Components组件两种构建模式，现在开发Vue插件/组件再也不需要手动修改webpack配置了，只要为构建命令传入`target\name\entry`，就能自动将入口文件编译成库，并输出CommonJS、浏览器环境所需要的一系列文件。

例如Vue-Tree-Chart的package.json文件：

```json
"main": "./dist/TreeChart.common.js",
"scripts": {
    "build-bundle": "vue-cli-service build --target lib --name TreeChart ./lib/index.js",
    ...
```

执行`npm run build-bundle`就会在`'/dist'`目里下生成一系列产出文件，其中`"TreeChart.common.js"`是webpack环境下需要的CommonJS包，将这个文件配置为`'main'`，就可以在项目中这样使用:

```js
import TreeChart from "vue-tree-chart";

```

导入的TreeChart对象就是一个Vue Component，可以作为全局组件或者局部组件挂载使用。

## [](#附 "附")附

Vue-Tree-Chart项目地址：[https://github.com/tower1229/Vue-Tree-Chart](https://github.com/tower1229/Vue-Tree-Chart)
