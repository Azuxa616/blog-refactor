'use client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFilterProps {
  categories: (Category & { articleCount: number })[];
  selectedCategory?: string;
  searchTerm?: string;
  sortType?: string;
}

const categoryColors = [
  'text-blue-600',
  'text-green-600',
  'text-purple-600',
  'text-red-600',
  'text-orange-600',
  'text-teal-600',
  'text-pink-600',
  'text-indigo-600',
  'text-cyan-600',
  'text-emerald-600',
];

export default function CategoryFilter({
  categories,
  selectedCategory = 'all',
  searchTerm,
  sortType
}: CategoryFilterProps) {
  const sortedCategories = [...categories].sort((a, b) => b.articleCount - a.articleCount);

  const minFontSize = 14;
  const maxFontSize = 24;

  const maxCount = Math.max(...sortedCategories.map(c => c.articleCount));
  const minCount = Math.min(...sortedCategories.map(c => c.articleCount));

  const getFontSize = (count: number): number => {
    if (maxCount === minCount) return (minFontSize + maxFontSize) / 2;
    const ratio = (count - minCount) / (maxCount - minCount);
    return minFontSize + ratio * (maxFontSize - minFontSize);
  };

  const buildUrl = (categoryId: string) => {
    const params = new URLSearchParams();

    if (searchTerm) params.set('search', searchTerm);
    if (sortType && sortType !== 'latest') params.set('sort', sortType);

    if (categoryId !== 'all') {
      params.set('category', categoryId);
    }

    const queryString = params.toString();
    const url = queryString ? `/articles?${queryString}` : '/articles';
    return url;
  };

  return (
    <div className="relative flex bg-card-background backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 mb-6 flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">分类</h3>
        {selectedCategory !== 'all' && selectedCategory && (
          <a
            href={buildUrl('all')}
            className="px-3 py-1 text-sm bg-primary text-white hover:bg-gray-200 hover:text-gray-800 rounded-full"
          >
            重置筛选
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {sortedCategories.map((category, index) => {
          const fontSize = getFontSize(category.articleCount);
          const colorClass = categoryColors[index % categoryColors.length];
          const isSelected = selectedCategory === category.id;

          return (
            <a
              key={category.id}
              href={buildUrl(category.id)}
              className={`font-bold transition-all duration-200 hover:opacity-80 px-2 py-1 rounded-full ${
                isSelected
                  ? 'text-white bg-primary'
                  : `${colorClass} hover:text-opacity-80`
              }`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.2'
              }}
            >
              {category.name} ({category.articleCount})
            </a>
          );
        })}
      </div>
    </div>
  );
}
