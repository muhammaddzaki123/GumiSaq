import { Article } from '@/constants/article';
import { getArticles } from '@/lib/appwrite';
import { useEffect, useState } from 'react';

interface UseArticlesResult {
  articles: Article[];
  loading: boolean;
  error: string | null;
  searchArticles: (query: string) => void;
  filteredArticles: Article[];
}

export const useArticles = (): UseArticlesResult => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedArticles = await getArticles();
        const publishedArticles = (fetchedArticles as Article[]).filter(
          article => article.isPublished
        );
        setArticles(publishedArticles);
        setFilteredArticles(publishedArticles);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const searchArticles = (query: string) => {
    if (!query.trim()) {
      setFilteredArticles(articles);
      return;
    }

    const searchQuery = query.toLowerCase().trim();
    const filtered = articles.filter((article) => {
      const titleMatch = article.title.toLowerCase().includes(searchQuery);
      const descriptionMatch = article.description.toLowerCase().includes(searchQuery);
      const contentMatch = article.content.toLowerCase().includes(searchQuery);
      const categoryMatch = article.category.toLowerCase().includes(searchQuery);
      const tagsMatch = article.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery)
      );

      return titleMatch || descriptionMatch || contentMatch || categoryMatch || tagsMatch;
    });

    setFilteredArticles(filtered);
  };

  return { articles, loading, error, searchArticles, filteredArticles };
};