---
title: "防抖和节流"
slug: fang-dou-he-jie-liu-2
description: "防抖和节流 > 快速记忆 > - 核心区别：防抖关注“连续触发结束后执行”，节流关注“连续触发期间按频率执行”。 > - 防抖（debounce）：每次触发都重新计时，只有停止触发达到等待时间后才执行"
publishDate: 2026-07-22
category: uncategorized
tags: []
---

# 防抖和节流

> **快速记忆**
>
> - **核心区别**：防抖关注“连续触发结束后执行”，节流关注“连续触发期间按频率执行”。
> - **防抖（debounce）**：每次触发都重新计时，只有停止触发达到等待时间后才执行。
> - **节流（throttle）**：限制一段时间内最多执行一次，持续触发时仍会周期性响应。
> - **常见场景**：搜索联想、窗口缩放适合防抖；滚动监听、拖拽移动适合节流。
> - **易错点**：防抖不是全程只执行一次，节流是否执行首次或末次调用取决于具体实现。

## 核心区别

| 对比项 | 防抖 | 节流 |
| --- | --- | --- |
| **控制目标** | 控制执行时机 | 控制执行频率 |
| **高频触发时** | 不断重新计时 | 按限定频率执行 |
| **停止触发后** | 通常执行最后一次调用 | 是否补执行最后一次取决于实现 |
| **适用需求** | 只关心用户最终状态 | 需要持续但不过于频繁地反馈 |

## 防抖（debounce）

### 工作机制

- **定义**：事件被连续触发时，每次触发都会取消上一次计时并重新计时；只有在等待时间内不再触发，目标函数才会执行。
- **执行次数**：默认的尾触发防抖在**每一轮连续触发结束后**执行一次，而不是整个生命周期只执行一次。
- **常见变体**：
  - **尾触发（trailing）**：停止触发后执行，是搜索联想等场景的常见默认行为。
  - **首触发（leading）**：第一次触发时立即执行，等待期间忽略后续触发。

### 手写实现

```js
function debounce(fn, delay) {
  let timerId = null;

  return function debounced(...args) {
    const context = this;

    // 每次触发都取消旧计时，从当前时刻重新等待。
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn.apply(context, args); // 保留调用时的 this 和参数。
    }, delay);
  };
}
```

- **实现关键**：`timerId` 保存在闭包中，多次调用返回函数时共享同一个计时器状态。
- **参数与上下文**：使用剩余参数和 `apply`，避免丢失事件参数及调用时的 `this`。
- **执行时机**：该实现是**尾触发防抖**；持续触发且始终没有停顿时，目标函数不会执行。

### 常见业务场景

- **搜索联想**：用户停止输入一段时间后再发起请求，减少无效请求。
- **窗口缩放**：`resize` 结束后再重新计算布局，避免频繁计算。
- **表单校验**：用户暂停输入后再执行格式校验，减少界面抖动。

## 节流（throttle）

### 工作机制

- **定义**：无论事件触发多频繁，目标函数在指定时间间隔内最多执行一次。
- **持续响应**：连续触发时仍会按限定频率执行，因此适合需要实时反馈但计算成本较高的场景。
- **常见变体**：
  - **首触发（leading）**：时间段开始时立即执行。
  - **尾触发（trailing）**：时间段结束时补执行最近一次调用。
  - 是否启用首触发或尾触发由具体实现决定，因此“至少执行一次”不是所有节流函数的固有保证。

### 手写实现

下面的实现同时支持**首触发**和**尾触发**，尾触发会使用等待期间最近一次调用的参数：

```js
function throttle(fn, interval) {
  let lastExecutionTime = 0;
  let timerId = null;
  let latestArgs;
  let latestContext;

  return function throttled(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastExecutionTime);

    // 始终记录最近一次调用，供尾触发使用。
    latestArgs = args;
    latestContext = this;

    if (remaining <= 0) {
      // 已达到执行间隔：立即执行，并清除可能存在的尾触发计时器。
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }

      lastExecutionTime = now;
      const argsToUse = latestArgs;
      const contextToUse = latestContext;
      latestArgs = latestContext = null;
      fn.apply(contextToUse, argsToUse);
      return;
    }

    if (timerId === null) {
      // 间隔内只安排一次尾触发，后续调用只更新参数和上下文。
      timerId = setTimeout(() => {
        timerId = null;
        lastExecutionTime = Date.now();
        const argsToUse = latestArgs;
        const contextToUse = latestContext;
        latestArgs = latestContext = null;
        fn.apply(contextToUse, argsToUse);
      }, remaining);
    }
  };
}
```

- **时间状态**：`lastExecutionTime` 用于计算剩余等待时间。
- **尾触发状态**：`timerId` 保证一个间隔内最多只安排一个延迟任务。
- **最新调用**：`latestArgs` 和 `latestContext` 持续更新，确保尾触发处理最近一次事件。

### 常见业务场景

- **页面滚动**：处理图片懒加载、滚动位置上报或“返回顶部”按钮显隐。
- **拖拽移动**：限制 `mousemove` 的处理频率，减少布局计算和绘制压力。
- **指针跟随**：在保持视觉反馈的同时，降低高频事件处理开销。

## 如何选择

- **只关心最终结果**：选择防抖，例如用户输入完成后搜索、窗口缩放完成后重新布局。
- **需要持续反馈**：选择节流，例如滚动期间更新位置、拖拽期间更新元素坐标。
- **避免重复提交**：不能只依赖防抖或节流；还应禁用按钮、记录提交状态，并在服务端使用幂等机制。
- **搜索请求竞态**：防抖只能减少请求数量，不能保证响应顺序；必要时应取消旧请求或用序号忽略过期响应。

## 常见误区

- **“防抖只执行一次”**：错误。它通常是每轮连续触发结束后执行一次。
- **“节流一定周期性执行”**：不严谨。只有事件持续触发时才可能周期性执行，具体行为还取决于首触发和尾触发配置。
- **“节流一定执行最后一次”**：错误。只有支持尾触发的实现才会补执行最后一次调用。
- **“设置计时器就能降低事件触发频率”**：错误。事件仍会照常触发，防抖和节流限制的是**事件处理函数的执行频率或时机**。
