import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage?: number
  totalPages?: number
  basePath?: string
  searchParams?: Record<string, string>
  className?: string
}

function Pagination({
  currentPage = 1,
  totalPages = 1,
  basePath = '',
  searchParams = {},
  className = '',
}: PaginationProps) {
  const [page, setPage] = useState(currentPage)

  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return []

    const delta = 2
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }, [page, totalPages])

  const buildUrl = (newPage: number): string => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    const queryString = params.toString()
    return `${basePath}${queryString ? `?${queryString}` : ''}`
  }

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
    window.location.href = buildUrl(newPage)
  }

  if (totalPages <= 1) return null

  return (
    <div className={cn('flex justify-center items-center gap-2', className)}>
      <button
        onClick={() => handleChangePage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200"
        aria-label="上一页"
      >
        上一页
      </button>

      {visiblePages.map((pageNum, index) =>
        typeof pageNum === 'string' ? (
          <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => handleChangePage(pageNum)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              page === pageNum
                ? 'bg-primary text-white shadow-lg mt-[-10px]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
            aria-label={`第 ${pageNum} 页`}
            aria-current={page === pageNum ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ),
      )}

      <button
        onClick={() => handleChangePage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200"
        aria-label="下一页"
      >
        下一页
      </button>
    </div>
  )
}

export default Pagination
