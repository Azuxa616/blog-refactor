---
title: Hooks
slug: hooks-2
description: "1. useState () 基本用法 相关问题 - 为什么不直接用变量而用 useState ()? - 修改变量本身不会让 React 框架感知 - setState(C+1) 为什么不会立即修改"
publishDate: 2026-07-22
category: uncategorized
tags: []
---

## 1. useState ()

#### 基本用法

```ts
const [state, setState] = useState(initialState);
```

#### 相关问题

- 为什么不直接用变量而用 useState ()?
  - 修改变量本身不会让 React 框架感知
- setState(C+1) 为什么不会立即修改？
  - setState 结束后进入更新队列，函数结束后才进行更新（批量更新减少重复渲染）
  - 正确使用： `setState (c=>c+1)` 函数式更新
  - React 把每一次渲染（render）都看成一个**不可变的快照（snapshot）**。

## 2. useEffect ()

#### 基本用法

```ts
useEffect(() => {
	// 与外部系统同步
	return () => {
		// 清理副作用
	};
}, [dependencies]);
```

#### 相关问题

- useEffect 的执行时机是什么？
  - React 提交 DOM 更新后执行，通常不会阻塞浏览器绘制
  - 它适合请求数据、订阅事件、定时器等“与外部系统同步”的操作
- 依赖数组分别代表什么？
  - 不传依赖数组：每次提交后执行
  - 传空数组 `[]`：组件挂载后执行，卸载时清理
  - 传 `[a, b]`：挂载后执行，并在依赖变化后重新执行
  - React 使用 `Object.is` 比较新旧依赖
- 清理函数什么时候执行？
  - 组件卸载时执行
  - Effect 重新执行前，先用旧值执行上一次的清理函数
- 为什么开发环境中 Effect 可能执行两次？
  - `StrictMode` 会在开发环境额外执行一次“创建 → 清理 → 创建”，用于发现缺少清理逻辑的问题
  - 生产环境不会因为 `StrictMode` 额外执行这一次
- 为什么不能随意省略依赖？
  - Effect 内使用的响应式值都应声明为依赖，否则容易产生闭包读取旧值的问题
  - 对象或函数每次渲染都可能是新引用，可将其移入 Effect、用 `useMemo` / `useCallback` 稳定引用，或重新设计逻辑
- 可以直接把 Effect 回调写成 `async` 吗？
  - 不可以。Effect 回调只能返回清理函数或不返回内容，而 `async` 函数一定返回 Promise
  - 应在 Effect 内定义异步函数，并在清理函数中忽略过期结果或取消请求

## 3. useLayoutEffect ()

#### 基本用法

```ts
useLayoutEffect(() => {
	const rect = ref.current.getBoundingClientRect();
	setPosition(rect);
}, []);
```

#### 相关问题

- useLayoutEffect 和 useEffect 有什么区别？
  - `useLayoutEffect` 在 DOM 更新后、浏览器绘制前同步执行
  - `useEffect` 通常在浏览器绘制后执行，不阻塞页面展示
- 什么场景使用 useLayoutEffect？
  - 读取布局并立即修正，例如测量元素尺寸、设置浮层位置，避免页面闪烁
  - 它会阻塞绘制，能用 `useEffect` 时应优先使用 `useEffect`
- 服务端渲染时要注意什么？
  - 服务端没有布局信息，`useLayoutEffect` 只会在客户端运行
  - 依赖布局的组件通常应仅在客户端渲染，或改用 `useEffect`

## 4. useRef ()

#### 基本用法

```ts
const inputRef = useRef<HTMLInputElement | null>(null);
const countRef = useRef(0);
```

#### 相关问题

- useRef 有什么作用？
  - 获取 DOM 节点或组件暴露的命令式句柄
  - 保存跨渲染周期不丢失、但变化时不需要触发渲染的数据
- useRef 和 useState 有什么区别？
  - 修改 `ref.current` 不会触发重新渲染
  - State 用于影响 UI 的数据，Ref 用于渲染不需要展示的数据
- 为什么不能在渲染期间随意读写 ref？
  - 渲染函数应保持纯函数特性，读写 ref 会让结果依赖调用顺序，在并发渲染下可能出现不可预测行为
  - 惰性初始化且结果稳定的场景可以例外处理
- useRef 能解决闭包读取旧值的问题吗？
  - 可以把最新值同步到 `ref.current`，供异步回调读取
  - 但如果该值影响页面展示，仍应使用 State，不能用 Ref 绕过渲染

## 5. useMemo ()

#### 基本用法

```ts
const filteredList = useMemo(
	() => filterList(list, keyword),
	[list, keyword],
);
```

#### 相关问题

- useMemo 的作用是什么？
  - 缓存一次计算结果，依赖没有变化时复用上次结果
  - 常用于昂贵计算，或为 `memo` 子组件提供稳定的对象、数组引用
- useMemo 是否越多越好？
  - 不是。它本身有依赖比较、保存结果和增加代码复杂度的成本
  - 应先确认存在性能问题，再通过性能分析决定是否使用
- useMemo 能保证结果永远不被丢弃吗？
  - 不能。它是性能优化手段，不是语义保证，React 在特定情况下可能丢弃缓存
  - 程序不应依赖 `useMemo` 才能保证逻辑正确
- useMemo 回调中可以执行副作用吗？
  - 不可以。回调在渲染期间执行，必须保持纯函数；副作用应放在事件处理函数或 Effect 中

## 6. useCallback ()

#### 基本用法

```ts
const handleSubmit = useCallback(() => {
	submitForm(productId);
}, [productId]);
```

#### 相关问题

- useCallback 的作用是什么？
  - 缓存函数本身，在依赖不变时保持函数引用稳定
  - 常与 `memo` 配合，或用于稳定其他 Hook 的函数依赖
- useCallback 和 useMemo 有什么区别？
  - `useCallback(fn, deps)` 缓存函数
  - `useMemo(() => value, deps)` 缓存计算结果
  - `useCallback(fn, deps)` 可理解为 `useMemo(() => fn, deps)`
- 使用 useCallback 后子组件一定不会渲染吗？
  - 不一定。还需要子组件使用 `memo`，并且其他 Props 也没有变化
  - 子组件自身 State 或读取的 Context 变化时仍会渲染
- 如何减少回调对 State 的依赖？
  - 如果新 State 只依赖旧 State，应使用函数式更新，例如 `setTodos(todos => [...todos, newTodo])`

## 7. useContext ()

#### 基本用法

```ts
const theme = useContext(ThemeContext);
```

#### 相关问题

- useContext 解决什么问题？
  - 让组件读取上层最近的 Context Provider 提供的数据，避免逐层传递 Props
- Context 变化时哪些组件会更新？
  - Provider 的 `value` 发生变化时，读取该 Context 的消费组件会重新渲染
  - `memo` 不能阻止组件因所读取的 Context 变化而重新渲染
- 如何减少 Context 导致的不必要渲染？
  - 避免每次渲染都创建新的 `value` 对象，可根据实际情况使用 `useMemo`
  - 将频繁变化和很少变化的数据拆分成不同 Context
  - 将读取 Context 的组件下沉，并通过 Props 把必要数据传给被 `memo` 包裹的子组件
- Context 能完全替代状态管理库吗？
  - 不能简单等同。Context 负责跨层级传值，本身不提供选择器、细粒度订阅、中间件等能力

## 8. useReducer ()

#### 基本用法

```ts
const [state, dispatch] = useReducer(reducer, initialState);

function reducer(state, action) {
	switch (action.type) {
		case 'increment':
			return { ...state, count: state.count + 1 };
		default:
			return state;
	}
}
```

#### 相关问题

- useReducer 适合什么场景？
  - State 结构复杂、多个字段联动，或下一状态依赖不同类型的操作时
  - 将状态变更逻辑集中到 Reducer，便于测试和维护
- useReducer 和 useState 如何选择？
  - 简单、独立的状态优先使用 `useState`
  - 状态转换规则复杂或需要明确 Action 语义时使用 `useReducer`
- Reducer 为什么必须是纯函数？
  - 相同的 State 和 Action 应得到相同结果，不能请求数据、操作 DOM 或修改外部变量
  - 不能直接修改原 State，应返回新对象，否则 React 可能使用 `Object.is` 判断状态未变化并跳过更新
- dispatch 的引用会变化吗？
  - `dispatch` 的引用稳定，通常可以安全省略在 Effect 依赖之外；即使写入依赖数组也不会导致 Effect 重跑

## 9. useImperativeHandle ()

#### 基本用法

```ts
useImperativeHandle(ref, () => ({
	focus() {
		inputRef.current?.focus();
	},
}), []);
```

#### 相关问题

- useImperativeHandle 的作用是什么？
  - 自定义父组件通过 Ref 能访问的内容，只暴露必要的命令式方法，而不是整个 DOM 节点
- 为什么不推荐大量使用？
  - React 更推荐通过 Props 描述 UI；命令式调用会增加组件耦合
  - 它适合聚焦、滚动、文本选择、动画等难以完全声明式表达的操作
- ref 如何传入子组件？
  - React 19 中函数组件可以把 `ref` 作为 Prop 接收
  - React 18 及更早版本通常需要使用 `forwardRef`

## 10. useId ()

#### 基本用法

```ts
const id = useId();

return <input id={id} aria-describedby={`${id}-hint`} />;
```

#### 相关问题

- useId 的主要用途是什么？
  - 生成服务端和客户端一致的唯一 ID，常用于表单标签和无障碍属性关联
- 为什么不用随机数或自增变量生成 ID？
  - 服务端渲染和客户端 Hydration 可能生成不同结果，导致不匹配
- useId 可以作为列表的 key 吗？
  - 不可以。列表 Key 应来自数据本身，用于标识业务数据的稳定身份

## 11. useTransition ()

#### 基本用法

```ts
const [isPending, startTransition] = useTransition();

function selectTab(nextTab) {
	startTransition(() => {
		setTab(nextTab);
	});
}
```

#### 相关问题

- useTransition 解决什么问题？
  - 把非紧急更新标记为 Transition，使输入、点击等紧急更新可以优先响应
  - `isPending` 可用于展示过渡中的等待状态
- Transition 会让更新延迟固定时间吗？
  - 不会。它是更新优先级调度，不是防抖或节流
  - 过渡渲染可被更高优先级更新打断，然后使用最新数据重新渲染
- 为什么不能用 Transition 控制文本输入值？
  - 输入框受控值需要同步响应用户输入，应保持高优先级
  - 可以同步更新输入值，再用 Transition 更新依赖该值的复杂结果区域
- `startTransition` 中包含 `await` 时有什么注意点？
  - `await` 之后的 State 更新目前需要再次使用 `startTransition` 包裹，才能继续被标记为 Transition

## 12. useDeferredValue ()

#### 基本用法

```ts
const deferredKeyword = useDeferredValue(keyword);
const result = useMemo(
	() => searchList(deferredKeyword),
	[deferredKeyword],
);
```

#### 相关问题

- useDeferredValue 的作用是什么？
  - 延迟更新某个值，让界面先响应紧急更新，再在后台渲染依赖该值的较慢部分
- useDeferredValue 和 useTransition 有什么区别？
  - `useTransition` 包裹并控制产生更新的代码
  - `useDeferredValue` 延迟一个已经得到的值，适合无法直接控制更新来源的情况
- useDeferredValue 是防抖吗？
  - 不是。它没有固定延迟，React 会根据渲染调度尽快处理后台更新
  - 它不会减少网络请求，若要减少请求次数仍需防抖或缓存
- 为什么通常还要配合 memo？
  - 父组件仍会因原值变化而渲染；慢子组件使用 `memo` 后，才能在延迟值未变化时跳过渲染

## 13. useSyncExternalStore ()

#### 基本用法

```ts
const snapshot = useSyncExternalStore(
	store.subscribe,
	store.getSnapshot,
	store.getServerSnapshot,
);
```

#### 相关问题

- useSyncExternalStore 用于什么场景？
  - 订阅 React 外部的数据源，例如第三方状态容器、浏览器 API 或自定义 Store
  - 普通业务组件通常不直接使用，更多用于状态库封装
- 为什么不直接用 useEffect 订阅外部 Store？
  - `useSyncExternalStore` 能与并发渲染和服务端渲染正确配合，避免读取到前后不一致的数据
- getSnapshot 有什么要求？
  - Store 未变化时必须返回缓存的同一份快照，不能每次都创建新对象
  - `subscribe` 最好定义在组件外部，避免每次渲染都重新订阅

## 18. Hooks 通用规则与面试考点

#### 基本规则

- 只能在 React 函数组件或自定义 Hook 中调用 Hook
- 除 `use` 外，Hook 必须在组件顶层调用，不能放在条件、循环、嵌套函数或 `try...catch` 中
- 自定义 Hook 名称应以 `use` 开头

#### 相关问题

- 为什么 Hook 不能条件调用？
  - React 依赖每次渲染时 Hook 的调用顺序来对应内部状态
  - 条件调用会改变顺序，导致不同 Hook 读取到错误的状态
- 自定义 Hook 会共享 State 吗？
  - 不会。自定义 Hook 共享的是状态逻辑，每次调用拥有独立 State
  - 如果需要共享同一份状态，应将 State 提升、使用 Context 或订阅外部 Store
- Hook 中为什么容易出现闭包旧值问题？
  - 每次渲染都会创建新的变量和函数，异步回调捕获的是创建它那次渲染的快照
  - 可根据场景使用正确依赖、函数式更新、Ref，或在 Effect 中重新建立订阅
- 如何判断逻辑应该放在事件处理函数还是 Effect？
  - 用户具体操作触发的逻辑放在事件处理函数中
  - 因组件展示而需要与外部系统保持同步的逻辑放在 Effect 中
