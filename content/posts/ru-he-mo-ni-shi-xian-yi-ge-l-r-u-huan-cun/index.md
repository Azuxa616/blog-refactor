---
title: "手撕 LRU 缓存"
slug: ru-he-mo-ni-shi-xian-yi-ge-l-r-u-huan-cun
path: interview/misc/ru-he-mo-ni-shi-xian-yi-ge-l-r-u-huan-cun
sourcePath: "面试/其他/如何模拟实现一个LRU缓存.md"
description: "实现固定容量 LRU 缓存：哈希表 + 双向链表的设计思路、get/put 操作流程与手撕代码要点。"
publishDate: 2026-11-03T08:13:38.145Z
---

>核心目标： 实现一个固定容量的缓存，当缓存满了以后，淘汰“最久没有被使用”的数据。

## 1. 实现思路
- LRU 需要满足两个操作：
	- `get(key)`
	- `put(key, value)`
所以需要使用**哈希表+双向链表**

- 我们约定： head <-> 最近使用<--> ...<--> 最久未使用<->tail

- 每次 get () /put () : 都把访问的元素移到 head 后面
- 缓存满了：删除 tail 前面的节点

## 2. 手撕代码
#### 2.1 JS
```js
class Node { 
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}
class LRUCache {
  constructor(capacity) { 
    this.capacity = capacity;
    this.cache = new Map();
    this.head = new Node(null, null);
    this.tail = new Node(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    const node = this.map.get(key)
    if (!node) { 
      return -1
    }
    //访问过，变成最近使用
    this.remove(node)
    this.insertToHead(node)
    return node.value
  }

  put(key, value) {
    // 如果存在，更新值并移动到头部
    if (this.cache.has(key)) {
      const node = this.cache.get(key)
      node.value = value
      this.remove(node)
      this.insertToHead(node)
      return
    }
    // 如果不存在，就添加到头部
    const node  = new Node(key, value)
    this.insertToHead(node)
    this.cache.set(key, node)
    // 检查容量，超容就删掉tail 前节点
    if (this.cache.size > this.capacity) {
      const lastNode = this.tail.perv
      this.remove(lastNode)
      this.cache.delete(lastNode.key)
    }
  }
  remove(node) {
    node.next.prev = node.prev
    node.prev.next = node.next
  }
  insertToHead(node) {
    // 先连好新节点，再拆旧节点
    node.prev = this.head
    node.next = this.head.next

    this.head.next.prev = node
    this.head.next = node
  }
}

```

## 3. 模拟运行
```

//模拟运行
const cache = new LRUCache(2)

cache.put(1, 1) // 1
cache.put(2, 2) // 2 1

console.log(cache.get(1)) //1 2

cache.put(3, 3) // 3 1

console.log(cache.get(2)) // -1 

cache.put(4, 4) // 4 3

console.log(cache.get(1)) // -1
console.log(cache.get(3)) // 3
console.log(cache.get(4)) // 4
```
