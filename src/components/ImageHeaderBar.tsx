'use client'

import { useState, useEffect } from "react";

interface ImageHeaderBarProps {
    src: string;
    title?: string;
    subtitle?: string;
    mode?: 'default' | 'article';
    articleTitle?: string;
    publishedAt?: string;
    author?: {
        username: string;
        avatar: string;
    };
    readTime?: number;
    category?: {
        name: string;
        color: string;
    };
}

export default function ImageHeaderBar({
    src,
    title,
    subtitle,
    mode = 'default',
    articleTitle,
    publishedAt,
    author,
    readTime,
    category
}: ImageHeaderBarProps) {
    const [currentSrc, setCurrentSrc] = useState(src);
    const fallbackSrc = '/imgs/404.jpg';

    useEffect(() => {
        setCurrentSrc(src);
    }, [src]);

    const handleImageError = () => {
        if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
        }
    };

    if (mode === 'article') {
        return (
            <div className="relative w-full h-64 md:h-96 overflow-hidden">
                <img
                    src={currentSrc}
                    alt={articleTitle || "article cover"}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end md:p-10 z-10">
                    <div className="text-white max-w-4xl">
                        {category && (
                            <div className="mb-4">
                                <span
                                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                                    style={{
                                        backgroundColor: category.color + '40',
                                        color: category.color,
                                        border: `1px solid ${category.color}60`
                                    }}
                                >
                                    {category.name}
                                </span>
                            </div>
                        )}

                        <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                            {articleTitle}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                            {author && (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={author.avatar || '/imgs/avatar.jpg'}
                                        alt={author.username}
                                        width={24}
                                        height={24}
                                        className="rounded-full border border-white/20"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (target.src !== '/imgs/avatar.jpg') {
                                                target.src = '/imgs/avatar.jpg';
                                            }
                                        }}
                                    />
                                    <span>{author.username}</span>
                                </div>
                            )}

                            {publishedAt && (
                                <>
                                    <span>•</span>
                                    <span>{new Date(publishedAt).toLocaleDateString('zh-CN')}</span>
                                </>
                            )}

                            {readTime && (
                                <>
                                    <span>•</span>
                                    <span>{readTime} 分钟阅读</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-100 overflow-hidden">
            <img
                src={currentSrc}
                alt="articles"
                className="absolute inset-0 w-full h-full object-cover object-center blur-lg"
                onError={handleImageError}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-none bg-opacity-40 z-10">
                <h1 className="text-4xl font-bold text-[#254889]">{title}</h1>
                <p className="text-lg text-[#254889]">{subtitle}</p>
            </div>
        </div>
    );
}
