---
title: "高阶函数和柯里化"
slug: gao-jie-han-shu-he-ke-li-hua-2
description: "高阶函数和柯里化 > 快速记忆 > - 核心定义：高阶函数（Higher-Order Function，HOF）至少满足“接收函数作为参数”或“返回一个函数”之一；柯里化把多参数函数改造成按参数逐步调"
publishDate: 2026-07-22
category: tech
tags: []
---

# 高阶函数和柯里化

> **快速记忆**
>
> - **核心定义**：高阶函数（Higher-Order Function，HOF）至少满足“接收函数作为参数”或“返回一个函数”之一；柯里化把多参数函数改造成按参数逐步调用的函数链。
> - **关键机制**：函数在 JavaScript 中是一等对象，可以被传递、保存和返回；柯里化通过闭包保存已收集的参数。
> - **常见用途**：数组处理、函数组合、配置函数工厂、限制调用次数和延迟执行。
> - **易混概念**：柯里化强调参数拆分；部分应用强调先固定部分参数，两者都可能返回新函数，但目标不同。

## 一、高阶函数

### 1. 定义与特征

- **接收函数**：例如 `map`、`filter`、`reduce` 接收回调函数，对集合执行统一操作。
- **返回函数**：例如函数工厂、`once`、`debounce` 返回一个带有新行为的函数。
- **本质**：HOF 是一种函数使用方式，不是特定的内置 API，也不要求同时满足两种特征。

```js
const numbers = [1, 2, 3, 4, 5];
const squaredNumbers = numbers.map((number) => number * number);

console.log(squaredNumbers); // [1, 4, 9, 16, 25]
```

### 2. 典型 HOF：`once`

- **作用**：无论返回函数被调用多少次，原函数最多执行一次。
- **闭包状态**：`called` 和 `result` 被返回的函数保留，用于记录执行状态和结果。

```js
function once(fn) {
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }

    return result;
  };
}

const initialize = once(() => "initialized");
console.log(initialize()); // initialized
console.log(initialize()); // initialized，原函数不会再次执行
```

## 二、柯里化

### 1. 定义

- **定义**：把 `f(a, b, c)` 转换为 `f(a)(b)(c)`，每次调用接收一个或一组参数，直到参数数量满足要求后再执行原函数。
- **参数收集**：中间函数通过闭包保存已经收到的参数，并继续返回收集函数。
- **调用形式**：具体实现可以只允许每次传一个参数，也可以允许一次传入多个参数；关键是分步收集、达到条件后执行。

```mermaid
flowchart LR
    A[原函数 sum a b c] --> B[收集 a]
    B --> C[收集 b]
    C --> D[收集 c]
    D --> E[执行并返回结果]
```

### 2. 通用实现

```js
function curry(fn, arity = fn.length, collectedArgs = []) {
  return function curried(...nextArgs) {
    const allArgs = [...collectedArgs, ...nextArgs];

    if (allArgs.length >= arity) {
      return fn.apply(this, allArgs);
    }

    return curry(fn, arity, allArgs);
  };
}

function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3)); // 6
console.log(curriedSum(1, 2)(3)); // 6
```

- **`fn.length`**：表示函数声明时、位于第一个带默认值参数之前的形参数量；使用通用 `curry` 时，默认参数、剩余参数或参数重载会使它不适合作为可靠的终止条件，此时应显式传入 `arity`。
- **上下文传递**：示例用 `fn.apply(this, allArgs)` 保留调用时的 `this`；如果实现始终使用箭头函数，`this` 则不会被动态绑定。

## 三、柯里化与部分应用

- **柯里化**：改变函数的调用形式，把参数拆成多个阶段，例如 `f(a, b, c)` → `f(a)(b)(c)`。
- **部分应用**：提前固定部分参数，得到参数更少的新函数，例如 `add(10, x)` → `addTen(x)`；剩余参数可以一次传入，不要求逐个拆分。
- **关系**：柯里化后的函数可以用于部分应用，但“返回函数”本身不能证明它就是柯里化。

```js
function multiply(a, b) {
  return a * b;
}

const double = (number) => multiply(2, number); // 部分应用的常见写法
console.log(double(4)); // 8
```

## 四、常见应用

### 1. 函数组合

- **组合**：把多个小函数连接起来，让前一个函数的输出成为后一个函数的输入。
- **价值**：将复杂逻辑拆成职责单一的步骤，减少重复代码和中间变量。
- **方向差异**：`compose` 通常从右向左执行，`pipe` 通常从左向右执行；项目中应明确约定。

```js
const trim = (value) => value.trim();
const toUpperCase = (value) => value.toUpperCase();
const normalize = (value) => toUpperCase(trim(value));

console.log(normalize("  hello  ")); // HELLO
```

### 2. 配置函数工厂与延迟执行

- **函数工厂**：先传入稳定配置，再返回处理具体数据的函数，例如 `multiplyBy(2)` 返回“乘以 2”的函数。
- **延迟执行**：柯里化或部分应用本身只负责收集参数、生成新函数；是否延迟执行取决于实现，不能把两者简单等同。
- **典型场景**：权限判断器、格式化器、请求函数、事件处理器和高阶组件。

## 五、注意事项与面试要点

- **可读性**：短小、重复的逻辑适合 HOF；层层嵌套的柯里化可能降低可读性，应结合团队习惯选择。
- **性能**：每次分步调用通常会创建闭包和参数数组；一般不是瓶颈，但在高频热路径中应避免无意义的函数创建。
- **`this`**：普通函数的 `this` 由调用方式决定；箭头函数没有自己的 `this`。需要保留上下文时，可使用 `apply`、`bind` 或箭头函数，并明确预期。
- **参数边界**：通用 `curry` 需要处理空调用、一次多参、默认参数和剩余参数等约束，面试时应先说明支持范围。
- **常考实现**：`once`、`compose/pipe`、`debounce/throttle`、基础版 `curry`，以及解释它们与闭包、`this` 和参数收集的关系。
