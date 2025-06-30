import { Article } from '@/constants/article';
import { getArticles } from '@/lib/appwrite';
import { useEffect, useMemo, useState } from 'react';

interface UseArticlesResult {
  articles: Article[];
  loading: boolean;
  error: string | null;
  // Kita tidak lagi mengekspor fungsi search, karena akan ditangani oleh hook
}

// Hook sekarang menerima query dan kategori sebagai argumen
export const useArticles = (query: string, category: string): UseArticlesResult => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedArticles = await getArticles();
        const publishedArticles = (fetchedArticles as unknown as Article[]).filter(
          article => article.isPublished
        );
        setArticles(publishedArticles);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Gagal memuat artikel. Coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Hanya dijalankan sekali saat komponen dimuat

  // Gunakan useMemo untuk memfilter artikel secara efisien
  // Ini hanya akan berjalan kembali jika `articles`, `query`, atau `category` berubah
  const filteredArticles = useMemo(() => {
    let tempArticles = articles;

    // 1. Filter berdasarkan kategori
    if (category && category !== "Semua") {
      tempArticles = tempArticles.filter(article => 
        article.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 2. Filter berdasarkan query pencarian
    if (query && query.trim() !== "") {
      const searchQuery = query.toLowerCase().trim();
      tempArticles = tempArticles.filter((article) => {
        const titleMatch = article.title.toLowerCase().includes(searchQuery);
        const descriptionMatch = article.description.toLowerCase().includes(searchQuery);
        const contentMatch = article.content.toLowerCase().includes(searchQuery);
        const tagsMatch = article.tags.some(tag => 
          tag.toLowerCase().includes(searchQuery)
        );
        return titleMatch || descriptionMatch || contentMatch || tagsMatch;
      });
    }
    
    return tempArticles;

  }, [articles, query, category]);

  // Kembalikan data yang sudah difilter
  return { articles: filteredArticles, loading, error };
};