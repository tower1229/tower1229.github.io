---
title: HTML5实现文件读取、编辑、保存
date: 2018-09-03 10:43:11
tags:
---

最近自己捣鼓了一个好玩的项目[觅迹导航](https://github.com/tracesr)，核心功能已经开发完成，后续会抽时间完善一下细节，并开放使用。做这个项目的过程中涉及到本地文件的读写，而且项目的定位不涉及兼容性问题，所以就直接用HTML5实现了，这里将实现过程以及涉及到的知识点整理一下。

<!-- more -->

## [](#HTML5读取文件 "HTML5读取文件")HTML5读取文件

HTML5读取文件主要利用的就是[FileReader](https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader)这个API，它的使用需要从一个构造函数开始：

```js
var reader = new FileReader();  // 返回一个FileReader实例

```

返回的实例具有以下3个属性：

+ FileReader.result
+ FileReader.readyState
+ FileReader.error

其中result属性是文件读取成功后的读取结果，数据的格式取决于使用哪个方法来启动读取操作。

FileReader实例具有以下4个方法：

+ FileReader.readAsText()
+ FileReader.readAsDataURL()
+ FileReader.readAsArrayBuffer()
+ FileReader.abort()

前3个方法分别是以文本、图片、其他格式读取内容，读取的对象可以是[Bolb](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)或[File](https://developer.mozilla.org/zh-CN/docs/Web/API/File)，在读取本地文件的场景下，我们读取的实际上就是File。

```js
reader.readAsText(file);    //读取文本文件

```

FileReader.abort()方法不需要说了，就是中断文件读取。

同时FileReader实例具有以下6个事件：

+ FileReader.onprogress
+ FileReader.onloadend
+ FileReader.onloadstart
+ FileReader.onload
+ FileReader.onerror
+ FileReader.onabort

其中onload事件是我们最关心的一个，该事件将在读取操作完成时触发，在这个事件中我们才能访问到FileReader.result属性，得到读取结果。

```js
reader.onload = function() {
    console.log(this.result);       //文本内容
};
```

使用FileReader读取文件的整个流程就是这样，File对象我们可以通过`<input type="file" >`获取。

## [](#HTML5保存文件 "HTML5保存文件")HTML5保存文件

保存文件的关键是生成文件对象，可以使用[URL.createObjectURL()](https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL)方法实现，该方法能返回给定对象的URL，用在`<a>`标签的`href`属性上就可以创建可下载的文件链接。

```js
let DownloadDom = document.getElementById("Download");      // a标签
DownloadDom.href = window.URL.createObjectURL(myBlob);      // 生成下载链接

```

createObjectURL()方法的参数可以是File对象或者Blob对象，前端保存文件通常是希望将已有“内容”保存成文件，这种场景我们需要的是Blob对象。

Blob构造函数可以根据传入的数组数据返回Blob对象，数组可以是ArrayBuffer、ArrayBufferView、Blob、DOMString，假如我们希望将一段JSON字符串保存成JSON文件，那么可以这么做：

```js
let myBlob = new Blob(['{"hello":"world"}'], { type: "application/json" });     //Blob对象

```

关于Blob构造函数的详细用法可以从[这里](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob/Blob)了解。

有了createObjectURL和Blob，实际上，我们就可以封装一个方法，将任意字符串保存成文件，并点击链接下载：

```js
let saveFile = function(fileText) {
    let DownloadDom = document.getElementById("Download");
    if (this.DownloadDom) {
        let myBlob = new Blob([fileText], { type: "application/json" });
        this.DownloadDom.href = window.URL.createObjectURL(myBlob);
        console.log('下载文件已就绪')
    }
},
```

结合HTML5读取文本文件功能，我们还可以实现对文本文件的编辑功能，比如JSON文件压缩，实际上就是拿到文本内容后，对内容过滤空字符：

```js
let fileText = reader.result;
fileText.replace(/\s/g, "");
saveFile(fileText)
```

再补充一点内容，createObjectURL()方法还有一个对应的[URL.revokeObjectURL()](https://developer.mozilla.org/zh-CN/docs/Web/API/URL/revokeObjectURL)方法，用来释放生成的URL对象，用法是这样的：

```js
var obj_url = window.URL.createObjectURL(blob);
var iframe = document.getElementById('viewer');
iframe.setAttribute('src', obj_url);
window.URL.revokeObjectURL(obj_url);
```

当obj\_url已经赋值给图片之后，就可以释放这个URL对象。这里的关键在于确定URL对象已经使用完了，在我们的例子中如果也这么做，实际上是不行的，当用户点击下载链接的时候会提示网络错误，因为href指向的链接已经失效了。猜测原因是，图片加载并显示的时候已经将数据载入内存了，这时候释放URL不会影响到图片的显示；而链接地址属于“引用”，点击瞬间会去访问URL对象，如果这时候对象已经释放了就会导致链接失效。

## [](#小结 "小结")小结

HTML5实现文件读取、编辑、保存其实非常简单，只不过涉及到的API兼容性都比较堪忧，以上示例仅在chrome里测试过。

完整的示例代码地址：  
[https://github.com/tower1229/htm5-file-operations](https://github.com/tower1229/htm5-file-operations)

演示地址:  
[https://refined-x.com/htm5-file-operations/](https://refined-x.com/htm5-file-operations/)
