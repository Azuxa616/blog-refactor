import { getPostPath } from '@/lib/utils/posts'
import type { PostWithSlug } from '@/lib/utils/posts'
import { getSectionName } from '@/lib/utils/section-names'

export interface TreeNode {
  name: string
  slugPath: string
  postCount: number
  children: TreeNode[]
  posts: PostWithSlug[]
}

interface MutableTreeNode extends TreeNode {
  childMap: Map<string, MutableTreeNode>
}

export interface BreadcrumbItem {
  name: string
  slugPath: string
  href: string
}

function createNode(name: string, slugPath: string): MutableTreeNode {
  return { name, slugPath, postCount: 0, children: [], posts: [], childMap: new Map() }
}

function toTreeNode(node: MutableTreeNode): TreeNode {
  const children = Array.from(node.childMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    .map(toTreeNode)

  return {
    name: node.name,
    slugPath: node.slugPath,
    postCount: node.postCount,
    children,
    posts: [...node.posts],
  }
}

// 按文章的完整 path 建树，目录文章数包含整棵子树。
export function buildTree(posts: PostWithSlug[]): TreeNode[] {
  const root = createNode('', '')

  for (const post of posts) {
    const segments = getPostPath(post).split('/').filter(Boolean)
    let current = root
    current.postCount += 1

    for (const segment of segments.slice(0, -1)) {
      let child = current.childMap.get(segment)
      if (!child) {
        const slugPath = current.slugPath
          ? `${current.slugPath}/${segment}`
          : segment
        child = createNode(segment, slugPath)
        current.childMap.set(segment, child)
      }
      child.postCount += 1
      current = child
    }

    current.posts.push(post)
  }

  return Array.from(root.childMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    .map(toTreeNode)
}

export function getTopSections(posts: PostWithSlug[]): TreeNode[] {
  return buildTree(posts)
}

export function getSubtree(
  posts: PostWithSlug[],
  slugPath: string,
): TreeNode | undefined {
  const segments = slugPath.split('/').filter(Boolean)
  if (segments.length === 0) return undefined

  let nodes = buildTree(posts)
  let current: TreeNode | undefined

  for (const segment of segments) {
    current = nodes.find((node) => node.name === segment)
    if (!current) return undefined
    nodes = current.children
  }

  return current
}

export function getBreadcrumbs(slugPath: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: '文章', slugPath: '', href: '/articles' },
  ]
  const segments = slugPath.split('/').filter(Boolean)
  const traversed: string[] = []

  for (const segment of segments) {
    traversed.push(segment)
    const currentPath = traversed.join('/')
    breadcrumbs.push({
      name: getSectionName(segment),
      slugPath: currentPath,
      href: `/articles/${currentPath.split('/').map(encodeURIComponent).join('/')}`,
    })
  }

  return breadcrumbs
}
