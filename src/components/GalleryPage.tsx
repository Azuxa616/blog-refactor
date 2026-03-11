import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ImageDetailModal from '@/components/ImageDetailModal'
import UploadModal from '@/components/UploadModal'

interface BlobInfo {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
  contentType?: string | null
}

interface ApiResponse {
  success: boolean
  data?: {
    blobs: Array<{
      url: string
      pathname: string
      size: number
      uploadedAt: string
      contentType?: string | null
    }>
    total: number
    cursor?: string
    hasMore?: boolean
  }
  error?: string
  message?: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<BlobInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<BlobInfo | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const fetchImages = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/blobs', {
        method: 'GET',
        credentials: 'include',
      })

      const data: ApiResponse = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          window.location.href = '/admin/login?redirect=/admin/gallery'
          return
        }
        throw new Error(data.error || '获取图片列表失败')
      }

      if (data.data?.blobs) {
        const formattedImages = data.data.blobs.map((blob) => ({
          ...blob,
          uploadedAt: new Date(blob.uploadedAt),
        }))
        setImages(formattedImages)
      }
    } catch (err) {
      console.error('获取图片列表错误:', err)
      setError(err instanceof Error ? err.message : '获取图片列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleImageClick = (image: BlobInfo) => {
    setSelectedImage(image)
    setIsDetailModalOpen(true)
  }

  const handleUploadSuccess = () => {
    fetchImages()
  }

  const handleDelete = async (image: BlobInfo) => {
    if (!confirm('确定要删除这张图片吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await fetch(`/api/blobs?pathname=${encodeURIComponent(image.pathname)}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data: ApiResponse = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          window.location.href = '/admin/login?redirect=/admin/gallery'
          return
        }
        throw new Error(data.error || '删除失败')
      }

      setImages(images.filter(img => img.pathname !== image.pathname))
    } catch (err) {
      console.error('删除图片错误:', err)
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="rounded-3xl border border-slate-200/40 bg-white/80 px-8 py-10 text-center shadow-xl shadow-slate-900/5">
          <svg className="mx-auto h-10 w-10 animate-spin text-[var(--admin-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-sm font-medium text-slate-600">正在加载图片...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="图床管理"
        description="管理所有上传的图片资源"
        actions={
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="rounded-2xl bg-[var(--admin-primary)] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[var(--admin-primary-hover)]"
          >
            上传图片
          </button>
        }
      />

      {error && (
        <div className="rounded-3xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm font-medium text-red-700 shadow-sm shadow-red-200/50">
          {error}
        </div>
      )}

      {images.length === 0 && !loading ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white/90 p-16 text-center shadow-xl shadow-slate-900/5">
          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">暂无图片</h3>
          <p className="mt-2 text-slate-500">点击"上传图片"按钮开始上传您的第一张图片</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={`${image.pathname}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <img
                src={image.url}
                alt={image.pathname}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleImageClick(image)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(image)
                }}
                className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 p-2 bg-red-500/90 rounded-lg backdrop-blur-sm hover:bg-red-600"
                title="删除"
              >
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0118.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6l6 6" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white pointer-events-none">
                <p className="text-xs truncate">{image.pathname}</p>
                <p className="text-xs text-white/80">{formatFileSize(image.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          image={selectedImage}
        />
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
