---
title: Vue2.0开发风格指南
date: 2017-11-16 09:41:37
tags: [Vue]
---

本文是对Vue官方风格指南的注解，过滤了极少数我认为重要性很低的项目，并将其余项按照作用相关性重新归类，便于读者针对性的选择某一方面进行参考。

<!-- more -->

## [](#框架或规范约束 "框架或规范约束")框架或规范约束

1. 组件名推荐统一使用`kebab-case`(连字符式)，因为HTML对大小写不敏感，无法识别`PascalCase`(驼峰式)。
2. 组件的 `data` 属性的值必须是返回一个对象的函数，如果直接用一个数据对象，则组件的多个实例之间会产生数据污染，导致失去复用价值。
3. 组件的`Prop`在声明时推荐使用`PascalCase`(驼峰式)，但在模板中必须使用`kebab-case`(连字符式)，原因同样是因为HTML对大小写不敏感。

## [](#性能相关 "性能相关")性能相关

1. `v-for`必须配合`key`使用，可以提高部分情况下Vue的渲染性能。
2. `scoped` 样式中避免使用元素选择器，因为遍历元素的效率通常很低。

## [](#健壮性相关 "健壮性相关")健壮性相关

1. 组件名必须为多个单词，避免与未来的HTML元素冲突，配合**框架或规范约束**第一条理解。
2. 组件样式必须设置作用域，避免样式冲突，单文件组件可以选择使用`scope`特性，通用组件可以选择基于class的规则，例如[BEM](http://getbem.com/)。
3. 对于混合到Vue对象中的全局资源使用`$_`前缀，避免与未来版本的Vue属性冲突，必要时可以再添加一个命名空间，避免与其他插件属性冲突。
4. 组件命名规则：基础组件加特定前缀预示复用性，例如`Base`；单例组件用`The`前缀标识预示唯一性；耦合组件中的子组件使用父组件名做前缀预示耦合关系，例如`TodoList`和`TodoListItem`；相关组件命名用一般性描述单词开头，用修饰性单词结尾，例如`ColorPicker`、`ColorPickerMulti`、`ColorPickerQuery`。
5. 组件模板应该只包含简单的表达式，复杂的表达式则应该重构为计算属性或方法，因为计算属性和方法利于复用和重构，而且模板也会看起来也更清晰易懂。

## [](#可读性相关 "可读性相关")可读性相关

1. 组件的`Prop` 定义应该尽量详细，至少要定义类型，利于开发期间调试和提高组件代码可读性。
2. 推荐用单文件的方式组织组件，利于提高单个组件的编辑查阅效率，即使不使用构建工具，也可以[变通的使用单文件组件开发方式](//refined-x.com/2017/10/28/%E5%A6%82%E4%BD%95%E4%B8%8D%E7%94%A8%E6%9E%84%E5%BB%BA%E5%B7%A5%E5%85%B7%E5%BC%80%E5%8F%91Vue%E5%85%A8%E5%AE%B6%E6%A1%B6%E9%A1%B9%E7%9B%AE/)。
3. 组件文件的命名推荐`kebab-case`(连字符式)，与组件名写法一致。
4. 在除了DOM模板以外的任何地方使用自闭合组件写法，使代码更简洁，例如`<my-component/>`。
5. 组件命名应使用完整单词，避免歧义。
6. 拥有多个特性的元素应该分多行撰写，每个特性一行。
7. 指令缩写要么一直用要么一直不用，提高模板可读性。
8. 项目中的组件/实例选项声明顺序保持一致，推荐的顺序如下：`el,name,parent,functional,delimiters,comments,components,directives,filters,extends,mixins,inheritAttrs,model,props/propsData,data,computed,watch,lifeCircleHooks,methods,template/render,renderError`。
9. 项目中的元素属性书写顺序保持一致。

## [](#最后 "最后")最后

指南中的绝大多数优化项都是针对代码健壮性和可读性提出的，基本也都是比较普遍的最佳实践方式，对于有一定经验的开发者来说应该都是很熟悉的内容，或者早已形成了自己的一套习惯，如果部分条目与你所熟知的方式相违背，也不需要过于纠结，只要明确了选择背后的利弊，那就是你的“最佳实践”。
