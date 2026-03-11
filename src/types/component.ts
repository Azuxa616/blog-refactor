// src/types/component.ts
// 组件相关类型定义
// 添加中文注释

/**
 * 头像组件属性
 */
export interface AvatarProps {
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 模态框组件属性
 */
export interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

/**
 * 分页组件属性
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

/**
 * 打字机效果组件属性
 */
export interface TypewriterProps {
  initialText?: string;
  repeatedTextList?: string[];
  initialTypingSpeed?: number;
  repeatedTypingSpeed?: number;
  gapInterval?: number;
  loop?: boolean;
  deleteSpeed?: number;
  cursor?: string;
  cursorBlinkInterval?: number;
  className?: string;
}

/**
 * 博客文章卡片组件属性
 */
export interface BlogItemProps {
  coverImage: string;
  title: string;
  description: string;
  category: {
    name: string;
    color?: string;
  };
  publishDate: string;
}

/**
 * 分类筛选器组件属性
 */
export interface CategoryFilterProps {
  categories: Array<{
    name: string;
    slug: string;
    data: {
      color: string;
    };
    articleCount?: number;
  }>;
  selectedCategory: string;
  searchTerm: string;
  sortType: string;
}

/**
 * 图片头部栏组件属性
 */
export interface ImageHeaderBarProps {
  src: string;
  title: string;
  subtitle: string;
}

/**
 * 菜单按钮组件属性
 */
export interface MenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * 页面头部组件属性
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
}

/**
 * 卡片组件属性
 */
export interface CardProps {
  showDecorativeBg?: boolean;
  className?: string;
}

/**
 * 浮动操作按钮组件属性
 */
export interface FloatingActionButtonProps {
  icon?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * 骨架屏组件属性
 */
export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

/**
 * 技能卡片组件属性
 */
export interface SkillsCardProps {
  skills: Array<{
    name: string;
    level: number;
  }>;
}

/**
 * 网站统计数据卡片组件属性
 */
export interface WebStatisticDataCardProps {
  title: string;
  value: number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * 分类卡片组件属性
 */
export interface CategoryCardProps {
  category: {
    name: string;
    slug: string;
    color: string;
    articleCount?: number;
  };
  href?: string;
}

/**
 * 名片卡片组件属性
 */
export interface BusinessCardProps {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

/**
 * GitHub 用户卡片组件属性
 */
export interface GithubUserCardProps {
  avatar?: string;
  name: string;
  bio?: string;
  followers?: number;
  following?: number;
  repos?: number;
}

/**
 * GitHub 仓库卡片组件属性
 */
export interface GithubRepoCardProps {
  name: string;
  description?: string;
  language?: string;
  languageColor?: string;
  stars?: number;
  forks?: number;
  url?: string;
}

/**
 * GitHub 仓库列表组件属性
 */
export interface GithubRepoListProps {
  repos: GithubRepoCardProps[];
  limit?: number;
}

/**
 * 主视觉区组件属性
 */
export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
}

/**
 * 向下滚动按钮组件属性
 */
export interface ArrowDownButtonProps {
  onClick?: () => void;
}

/**
 * GitHub 展示区组件属性
 */
export interface GithubSectionProps {
  username?: string;
}

/**
 * 页脚组件属性
 */
export interface FooterBarProps {
  copyright?: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
}
