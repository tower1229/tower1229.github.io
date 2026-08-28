---
title: "了解 Openclaw 的模型上下文"
description: "大模型没有记忆，连续对话本质是上下文重传。本文深入拆解 Openclaw 的上下文组装机制、Cache Boundary 缓存边界与 Project Context 的预算分配规则，为构建私人 Agent 建立清晰的底层心智模型。"
pubDate: 2026-08-28T01:48:00.000Z
tags: ["Agent","Openclaw","模型上下文","Prompt Cache"]
---

## 背景知识

本文是 Agent 基础系列文章的第一篇，开始之前需要先铺垫一些背景知识。

### 模型的本质

模型的本质是一个函数，即便拥有高达数十亿个参数，即便拥有随机采样机制，但本质仍然是一个跟 `x=a+b` 一样的函数。所谓模型训练，基本可以理解为设计一个函数结构，反复在测试集数据中进行运算，根据运算结果微调参数组合，以提高与目标函数的拟合程度。所谓模型的智能，就蕴藏在函数的结构及其海量的参数组合中。这也是为什么每次新模型发布都要强调参数的规模，因为理论上参数规模越大就可以对目标函数进行更高精度的模拟，比如最新发布的开源模型 Kimi K3 就拥有 2.8T（两万八千亿）的参数。

![示意模型通过海量参数微调向目标函数高精度拟合](/asset/openclaw-context-01-function-fitting.png)

理解了模型的本质就比较容易理解很多模型的特性。比如，为什么模型总是忘记我说过的话？其实不是模型总忘记，而是模型从来就没记住过。因为函数本就没有记忆能力，每一次运算对函数来说都是全新的、独立的，函数的世界没有先后、没有时间，当然也没有记忆。我还见过有人担心，问模型蠢问题会不会污染模型数据？这是对模型拟人化的误解，模型从训练结束的那一刻起就随参数固化了，无论多少次对函数的调用都不会改变函数，自然也就不会影响模型的智力。

### 上下文的本质

既然模型没有记忆，那 ChatGPT 这类 Agent 为什么能实现像下面这种连续对话，表现得好像有记忆？

```text
我：你好，我是张三
Agent：你好，张三
我：我叫什么？
Agent：你叫张三
```

答案一点都不神奇，甚至还会让你大跌眼镜，因为这其中的方法可谓是简单粗暴。关键在于会话中“我”的第二句输入，虽然在视觉上我只输入了一句“我叫什么？”，但实际上 Agent 应用在背后是将之前的历史对话也一并发给了大模型，也就是说模型实际收到的是类似这样一个输入：

```text
├─History Conversation:
│  ├─我：你好，我是张三
│  └─Agent：你好，张三
└─ User Prompt：
   └─我叫什么？
```

相当于模型的每一次回答，都要完整地读一遍历史对话，因而才能做出好像有记忆的回答。而对人类来说，一串看上去连续的 Agent 对话，实际上每次回答你的都是一次全新的函数运算，所谓的连续对话只是假象。总之，这就是模型“记忆”的来源，而每次发给模型的这个包含各种背景信息的结构化内容，就是模型的上下文。

![示意连续对话的本质：每一轮独立函数运算重传完整历史上下文](/asset/openclaw-context-02-context-replay.png)

上下文的本质是模型函数的输入，其长度不是无限大的，具体长度取决于函数的设计和训练。上下文长度直接决定了模型能处理的最大信息量，或者连续对话的长度，其实这二者是一回事。上下文长度能为模型带来的收益非常直观且可量化，所以也是日常衡量模型的重要指标，比如目前的一线模型基本都有 1M 的上下文。

ChatGPT 通过设计一个携带历史会话的上下文结构，就让模型拥有了记忆。那么上下文肯定不止这一种设计方法。想要让 Agent 拥有更复杂、更精细的表现，关键就在于上下文的设计。下面我们就来深入了解 Openclaw 的模型上下文设计。

## Openclaw 的上下文组装机制

Openclaw 作为一个可定制的个人助理型 Agent，其上下文设计承载了多种复杂功能，因此了解 Openclaw 的上下文结构和组装机制，是实现 Agent 定制的必要前提。

### 上下文整体结构

首先建立正确的总体模型。一个普通 OpenClaw 回合发送给模型的完整 context，是这样一个结构：

```text
模型输入
├─ System Prompt
│  ├─ OpenClaw 固定运行规则
│  ├─ 工具与技能说明
│  ├─ Memory Recall 工具使用说明
│  ├─ Workspace 信息
│  ├─ Project Context：AGENTS / SOUL / USER / MEMORY 等
│  └─ 当前渠道、心跳、运行环境等动态信息
│
├─ Conversation History
│  ├─ 历史 user 消息
│  ├─ 历史 assistant 消息
│  ├─ tool calls / tool results
│  └─ compaction summary
│
├─ Current User Turn
│  ├─ 渠道与发送者上下文
│  ├─ 特定情况下的 startupContext 最近记忆
│  └─ 用户当前消息
│
└─ Tool Schemas
   └─ 独立 JSON schema，不一定显示在 system prompt 文本里
```

其中 System Prompt 定义整个 Agent 的核心特性，会持续地、直接地对 Agent 行为产生全局性影响，是我们需要重点了解的部分。

Conversation History 负责为 Agent 提供记忆连续性，包括历史对话和渠道信息等背景资料，其中的内容会被标记为不可信指令，对 Agent 行为的影响力较小。这是合理的，否则 Agent 就会呈现出阿兹海默的症状，分不清记忆和现实。

Current User Turn 包含用户当下发出的指令以及消息所属渠道等信息，是驱动 Agent 给出新一轮反应的直接动力。

除了用户当前消息之外，最后剩下的工具类信息则是惰性信息，只在模型决定读取时才会使用，对 Agent 的当下行为几乎没有直接干扰。

每一轮对话 Openclaw 的底层模型都会收到上述这样一个庞大的消息结构体，因此 Openclaw 才能展示出细腻而惊艳的效果，当然，消耗的 token 数也同样惊艳。

### Cache Boundary 与缓存分界

在 Openclaw 中，上述那一大段 prompt 并不是一次性组装的，而是从结构上被分成两部分：稳定前缀和动态后缀。至于为什么做这样的拆分，那就必须了解 `Cache Boundary`（缓存边界）。

`Cache Boundary` 是 Openclaw 为了充分利用大模型服务商的提示词缓存（Prompt Cache），而为系统提示词设计的一条**缓存分界线**，以此平衡性能与成本。

大模型服务商的 Prompt Cache 通常要求：从提示词开头起，一段内容必须与上一次请求完全一致，才能复用缓存。

假设完整提示词是：

```text
A + B + C + D
```

这次只有 `D` 发生变化，如果 `A+B+C` 被标记为可缓存前缀，模型服务可以直接复用它，只计算新的 `D`。

但如果变化发生在 `B`：

```text
A + B' + C + D
```

那么从 `B` 开始，后面的缓存通常都会失效。

因此 OpenClaw 会尽量把：
- 不经常变化、体积较大的内容放在边界之前，形成稳定前缀；
- 每轮都可能变化的内容放在边界之后，形成动态后缀。

这样动态信息的变化就不会频繁击穿前面的大段缓存。

![示意 Cache Boundary 分界线如何阻断动态变动对稳定前缀缓存的击穿](/asset/openclaw-context-03-cache-boundary.png)

### 稳定前缀

Openclaw 的稳定前缀主要是比较稳定的系统环境，包括以下内容：

- Agent 身份与工具说明
- 安全规则
- Skills 索引
- Memory 工具使用规则
- Workspace 路径和文档说明
- 项目上下文（Project Context）
  - `AGENTS.md`
  - `SOUL.md`
  - `IDENTITY.md`
  - `USER.md`
  - `TOOLS.md`
  - `BOOTSTRAP.md`
  - `MEMORY.md`

可以发现基本上就是 System Prompt 的主体内容。这些文件虽然有一些也会发生变动（比如 skills 索引会随 skill 的安装和卸载而变化，项目上下文文件直接开放给用户随意修改），但这种变动不会很频繁，至少不会每条消息都变，因此适合进入可缓存前缀。

### 动态后缀

除了稳定前缀之外的内容都会拼装成动态后缀内容，具体结构如下：

```text
# Dynamic Project Context

## /workspace/HEARTBEAT.md
...

[Exec approval guidance]

[Authorized senders / user identity]

[WebChat canvas]

## Messaging

## Voice

## Conversation Context
当前渠道、群聊、发送者、回复模式等

## Reactions

[Provider dynamicSuffix]

## Heartbeats

## Runtime
agent / session / host / OS / model / thinking / channel
```

Heartbeats（心跳）虽然在定义上属于 System Prompt，但仍被拼接到动态部分，就是因为心跳内容会随时间频繁变动。如果把它放在稳定前缀里，每轮心跳都会直接击穿缓存。

在整个 System Prompt 中，大部分系统内容是相对固定的，我们真正可以自主修改的部分其实只有 Project Context。

## 如何个性化定制 Openclaw

Project Context 是专门暴露在 Openclaw 工作区的可编辑文件，用以实现对 Agent 各个层面的表现进行定制。这几个文件以及他们在 system prompt 中出现的顺序是：

```text
1. AGENTS.md
2. SOUL.md
3. IDENTITY.md
4. USER.md
5. TOOLS.md
6. MEMORY.md
```

### 各文件职责分工

#### AGENTS.md
定义 Agent 的工作方法、决策流程、工具使用、记忆规则、权限边界、任务优先级。它是当前 Agent 的操作宪法。适合放：
- 回答前应做哪些判断；
- 何时必须检索 memory；
- 当前状态和历史资料冲突时如何处理；
- 如何区分事实、推断和未知；
- 私密资料的使用边界；
- 工具调用、审批和外部行动规则。

注意：子 Agent 仅会保留 `AGENTS.md` 和 `TOOLS.md`，因此希望子 Agent 也遵循的规则必须放在 `AGENTS.md`。

#### SOUL.md
定义 Agent 的语气、人格、观点、分寸感、默认简洁程度、如何提出异议。

官方明确建议：SOUL 应放“交流感受”相关内容，不应变成人生故事、变更日志、安全政策或无行为效果的气氛描述；应保持简短、锐利、可执行。

#### IDENTITY.md
结构化定义 Agent 的名称、身份、自称、性别、象征与 vibe。

应保持极短，基于默认模板格式修改填空即可。

#### USER.md
定义用户是谁、如何称呼、长期偏好、稳定目标和当前重要背景。适合记录：
- 称呼与沟通偏好；
- 稳定职业和技术背景；
- 长期目标；
- 对 Agent 的基本期待；
- 重要但低敏感度的长期约束。

#### TOOLS.md
环境与工具补充说明。普通用户通常无需手动配置，由系统或插件自动管理。

#### MEMORY.md
长期稳定事实、偏好、决策和短摘要。会持久稳定地在每轮对话中发挥作用，因此只适合存放 Agent 每轮都必须知道的信息。

### 文件预算与截断限制

Openclaw 默认对 Project Context 各文件有明确的预算限制：

- 单个文件默认最多注入 20,000 字符（配置项 `agents.defaults.bootstrapMaxChars`）
- 全部 Project Context 文件合计默认最多注入 60,000 字符（配置项 `agents.defaults.bootstrapTotalMaxChars`）

这两项限制决定了文件编写的两条硬规则：

1. **整体超出截断**：如果文件总字符数超过 `bootstrapTotalMaxChars`，会严格按加载顺序（`AGENTS.md` → `SOUL.md` → ... → `MEMORY.md`）注入。配额耗尽后，排在后面的文件（通常是 `MEMORY.md`）将完全无法进入上下文。
2. **单文件超出截断**：如果单个文件超过 `bootstrapMaxChars`，Openclaw 会采用头部分配 75%、尾部分配 25% 的方式，掐头去尾地对文件做截断处理，中间的内容会被直接丢弃。

## 总结：从物理限制理解上下文

至此，我们可以彻底理清私人 Agent 的底层心智模型：
- **模型本质是无状态的数学函数**：它没有时间概念，也没有主观记忆；
- **记忆的本质是上下文重传**：连续对话和历史记忆，全部依赖应用层在每轮会话中重新组装并打包发送；
- **Prompt Cache 决定了工程边界**：通过 Cache Boundary 区分稳定前缀与动态后缀，才让大上下文 Agent 在经济和性能上成为可能；
- **Project Context 是带预算的精密配置**：了解 6 个文件的加载顺序与截断规则，才能把思考规则、人格语气与核心事实放在正确的位置。

搞清楚了上下文这个容器的物理法则，你就不会盲目地往文件里乱塞规则。在理清了上下文这个舞台的骨架之后，下一篇，我们来探讨那个大家最关心的问题：属于你的私人 Agent，究竟该如何建立并管理它真正的**记忆系统**。
