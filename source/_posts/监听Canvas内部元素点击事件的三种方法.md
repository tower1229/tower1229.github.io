---
title: 监听Canvas内部元素点击事件的三种方法
date: 2019-04-27 16:23:22
tags: [canvas]
---

canvas内部元素不能像DOM元素一样方便的添加交互事件监听，因为canvas内不存在“元素”这个概念，他们仅仅是canvas绘制出来的图形。这对于交互开发来说是一个必经障碍，想要监听图形的点击事件思路很简单，只要监听canvas元素本身的点击事件，再判断点击坐标位于哪一个图形内部，就变相实现了图形点击事件。本文将介绍三种方法，判断坐标点是否位于某个canvas图形内部。

<!-- more -->

## [](#约定 "约定")约定

本文介绍的三种方法适用于识别canvas内形状不规则而且位置无规律的图形点击事件，对于形状规则或者位置有规律的场景，肯定有更简便的实现，这里不做讨论。

## [](#像素法 "像素法")像素法

像素检测法的思路是，将canvas中的多个图形（如果有多个的话）分别离屏绘制，并用`getImageData()`方法分别获取到像素数据保存起来。当canvas元素监听到点击事件时，通过点击坐标可以直接推算出点击发生在canvas上的第几个像素，然后遍历前面保存的图形数据，看看这个像素的alpha值是不是0，如果是0说明落点不在当前图形内，否则就说明点到了这个图形。

根据点击坐标得到所点击的像素序号的方法：

```bash
像素序号 = (纵坐标-1) * canvas宽度 + 横坐标

```

比如在宽度为 5 的画布上点击坐标`(3,3)`，根据上述公式得到像素序号是`(3-1) * 5 + 3 = 13`，如图所示：

![坐标与像素点关系](https://refined-x.com/asset/a/point-center.png)

因为canvas导出的图形数据是将每个像素以`rgba`的顺序存成4个数字组成的数组，所以想访问指定像素的alpha值，只要读取这个数组的第`pIndex * 4 + 3`个值就可以了，如果这个值不为0，说明该像素可见，也就是点击到了该图形。

这个方法是我认为思路最直接、结果最准确、而且对图形形状没有任何要求的方法，但这个方法有一个致命的局限，当图形需要在画布上移动时，要频繁的创建数据缓存才能保证检测结果准确，受到画布尺寸和图形数量的影响，`getImageData()`方法的性能会成为严重的瓶颈。所以如果canvas图形是静态的，这个方法非常适合，否则就不适合用这个方法了。

## [](#角度法 "角度法")角度法

角度判断法的原理很容易理解，如果一个点在多边形内部，则该点与多边形所有顶点两两构成的夹角，相加应该刚好等于360°。

![角度判断法](https://refined-x.com/asset/a/checkPointIn1.png)

计算过程可以转变为以下三个步骤：

1.  已知多边形顶点和已知坐标，将坐标与顶点两两组合成三点队列
2.  已知三点求夹角，可以使用[余玄定理](https://baike.baidu.com/item/%E4%BD%99%E5%BC%A6%E5%AE%9A%E7%90%86/957460?fromtitle=%E4%BD%99%E7%8E%84%E5%AE%9A%E7%90%86&fromid=7376698&fr=aladdin)
3.  判断夹角之和是否360°

每一步都很简单，实现如下：

```js
//计算两点距离
const getDistence = function (p1, p2) {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
};
//角度法判断点在多边形内部
const checkPointInPolyline = (point, polylinePoints) => {
    let totalA = 0;
    const A = point;
    for (let i = 0; i < polylinePoints.length; i++) {
        let B, C;
        if (i === polylinePoints.length - 1) {
            B = {
                x: polylinePoints[i][0],
                y: polylinePoints[i][1]
            };
            C = {
                x: polylinePoints[0][0],
                y: polylinePoints[0][1]
            };
        } else {
            B = {
                x: polylinePoints[i][0],
                y: polylinePoints[i][1]
            };
            C = {
                x: polylinePoints[i + 1][0],
                y: polylinePoints[i + 1][1]
            };
        }
        //计算角度
        const angleA = Math.acos((Math.pow(getDistence(A, C), 2) + Math.pow(getDistence(A, B), 2) - Math.pow(getDistence(B, C), 2)) / (2 * getDistence(A, C) * getDistence(A, B)))

        totalA += angleA
    }
    //判断角度之和
    return totalA === 2 * Math.PI
}
```

这个方法有一个局限性，就是图形必须是**凸多边形**。如果不是凸多边形需要先切割成凸多边形再计算，这就比较复杂了。

类似的思路还有面积法，如果一个点在多边形内部，那么该点与多边形所有顶点两两构成的三角形，面积相加应该等于多边形的面积，首先计算多边形的面积就很麻烦，所以这种方法可以直接pass掉。

## [](#射线法 "射线法")射线法

射线法是一个我讲不清道理但非常好用的方法，只要判断点与多边形一侧的交点个数为奇数，则点在多边形内部。需要注意的是，只要数任何一侧的焦点个数就可以，比如左侧。这个方法不限制多边形的类型，凸多边形、凹多边形甚至环形都可以。

![射线判断法](https://refined-x.com/asset/a/checkPointIn2.png)

实现起来也非常简单：

```js
const checkPointInPolyline = (point, polylinePoints) => {
    //射线法
  let leftSide = 0;
  const A = point;
  for (let i = 0; i < polylinePoints.length; i++) {
    let B, C;
    if (i === polylinePoints.length - 1) {
      B = {
        x: polylinePoints[i][0],
        y: polylinePoints[i][1]
      };
      C = {
        x: polylinePoints[0][0],
        y: polylinePoints[0][1]
      };
    } else {
      B = {
        x: polylinePoints[i][0],
        y: polylinePoints[i][1]
      };
      C = {
        x: polylinePoints[i + 1][0],
        y: polylinePoints[i + 1][1]
      };
    }
    //判断左侧相交
    let sortByY = [B.y, C.y].sort((a,b) => a-b)
    if (sortByY[0] < A.y && sortByY[1] > A.y){
      if(B.x<A.x || C.x < A.x){
        leftSide++
      }
    }
  }

  return leftSide % 2 === 1
}
```

射线法有一种特殊情况，当点在多变形的一条边上时需要特殊处理。但在工程中我认为也可以不处理，因为如果用户刚好点在图形的边界上，那么程序认为他没有点到也讲的过去。

## [](#总结 "总结")总结

以上三种方法都可以实现canvas中不规则图形的点击检测。其中，像素法的优势在于不挑形状，而且在静态场景中有一定的性能优势；角度法应该说只有理论价值，实用性不佳；工程中最实用的当属射线法，局限性小，实现简单，多数时候只需要知道射线法就可以了。
