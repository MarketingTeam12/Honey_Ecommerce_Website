import { useState } from 'react';
import { Calendar, User, Tag, Search, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
}

export function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visiblePosts, setVisiblePosts] = useState(6);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: 'Understanding Certified Translation: What You Need to Know',
      excerpt: 'Certified translations are crucial for legal documents, immigration applications, and international business. Learn when you need them, how they differ from standard translations, and what makes a translation officially certified.',
      content: 'Certified translations are essential for official documents that need to be submitted to government authorities, educational institutions, or legal entities...',
      author: 'Sarah Mitchell',
      date: 'February 18, 2026',
      category: 'Translation Services',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'MEA Apostille Services: Complete Guide for Document Authentication',
      excerpt: 'Navigate the MEA Apostille process with confidence. This comprehensive guide covers document requirements, processing times, fees, and step-by-step procedures for getting your documents authenticated for international use.',
      content: 'MEA Apostille is a certification provided by the Ministry of External Affairs that authenticates documents for use in foreign countries...',
      author: 'Rajesh Kumar',
      date: 'February 15, 2026',
      category: 'Apostille Services',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
      readTime: '7 min read'
    },
    {
      id: 3,
      title: 'Top 10 Languages for Global Business Translation in 2026',
      excerpt: 'Discover which languages drive international commerce in 2026. From Mandarin to Spanish, learn why these languages are essential for global expansion and how professional translation services can help your business succeed worldwide.',
      content: 'As businesses expand globally, the need for accurate translation services has never been greater. Here are the top 10 languages...',
      author: 'Maria Garcia',
      date: 'February 12, 2026',
      category: 'Industry Insights',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop',
      readTime: '6 min read'
    },
    {
      id: 4,
      title: 'How to Prepare Your Documents for Professional Translation',
      excerpt: 'Proper document preparation saves time and ensures accuracy. Follow our expert tips for scanning quality, file formats, and document organization to streamline your translation project and avoid costly delays.',
      content: 'Proper document preparation ensures faster turnaround times and more accurate translations. Follow these essential steps...',
      author: 'David Chen',
      date: 'February 8, 2026',
      category: 'Tips & Guides',
      image: 'https://images.unsplash.com/photo-1673515335152-f2589ba8bb7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N1bWVudHMlMjBwcmVwYXJhdGlvbiUyMHRyYW5zbGF0aW9uJTIwcGFwZXJ3b3JrfGVufDF8fHx8MTc3MjAxNDI2NXww&ixlib=rb-4.1.0&q=80&w=1080',
      readTime: '4 min read'
    },
    {
      id: 5,
      title: 'Canadian Immigration: Translation Requirements for 2026',
      excerpt: 'Planning to immigrate to Canada? Understand the latest translation and notarization requirements for immigration documents, including birth certificates, marriage certificates, educational credentials, and employment records.',
      content: 'Canada has specific requirements for translated documents in immigration applications. Understanding these requirements...',
      author: 'Emily Thompson',
      date: 'February 5, 2026',
      category: 'Immigration',
      image: 'https://images.unsplash.com/photo-1545013806-8e1d077550ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDYW5hZGElMjBwYXNzcG9ydCUyMGltbWlncmF0aW9uJTIwdmlzYXxlbnwxfHx8fDE3NzIwMTQyNjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      readTime: '8 min read'
    },
    {
      id: 6,
      title: 'Certified vs. Sworn Translation: Key Differences Explained',
      excerpt: 'Not all official translations are the same. Understand the critical differences between certified and sworn translations, when each is required, and how to choose the right service for your legal or business needs.',
      content: 'Many people confuse certified and sworn translations. While both are official forms of translation, they serve different purposes...',
      author: 'James Anderson',
      date: 'February 1, 2026',
      category: 'Translation Services',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
      readTime: '5 min read'
    }
  ];

  const categories = ['All', 'Translation Services', 'Apostille Services', 'Industry Insights', 'Tips & Guides', 'Immigration'];

  const categoryImages: Record<string, string> = {
    'All': 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=100&fit=crop',
    'Translation Services': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=100&fit=crop',
    'Apostille Services': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=100&fit=crop',
    'Industry Insights': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=100&fit=crop',
    'Tips & Guides': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=100&fit=crop',
    'Immigration': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=100&fit=crop',
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-[#0a1247] to-[#1a2457] text-white py-16"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1247]/90 to-[#1a2457]/90"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h1 className="text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Stay updated with the latest insights, tips, and news about translation services, 
            apostille, immigration, and international documentation.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Posts
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a1247] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`relative w-full text-left px-4 py-2 rounded-md transition-colors overflow-hidden ${
                        selectedCategory === category
                          ? 'text-white font-medium'
                          : 'text-white'
                      }`}
                      style={{
                        backgroundImage: `url(${categoryImages[category]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <span className={`absolute inset-0 ${
                        selectedCategory === category
                          ? 'bg-[#0a1247]/80'
                          : 'bg-gray-900/50 hover:bg-[#0a1247]/70'
                      } transition-colors`}></span>
                      <span className="relative z-10">{category}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Posts */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
                <div className="space-y-4">
                  {blogPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="group cursor-pointer">
                      <h4 className="text-sm font-medium text-gray-900 group-hover:text-[#0a1247] transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{post.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredPosts.length}</span> {filteredPosts.length === 1 ? 'post' : 'posts'}
                {selectedCategory !== 'All' && (
                  <span> in <span className="font-semibold text-[#0a1247]">{selectedCategory}</span></span>
                )}
              </p>
            </div>

            {/* Blog Posts Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPosts.slice(0, visiblePosts).map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow group">
                    {/* Featured Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#0a1247] text-white px-3 py-1 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#0a1247] transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Read Time and Read More */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{post.readTime}</span>
                        <button 
                          onClick={() => setSelectedPost(post)}
                          className="flex items-center gap-2 text-[#0a1247] hover:text-[#1a2457] font-medium text-sm group-hover:gap-3 transition-all"
                        >
                          Read More
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}

            {/* Load More Button */}
            {filteredPosts.length > visiblePosts && (
              <div className="mt-12 flex justify-center">
                <button
                  className="px-8 py-3 bg-[#0a1247] text-white rounded-md font-medium hover:bg-[#1a2457] transition-colors"
                  onClick={() => setVisiblePosts(visiblePosts + 6)}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blog Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 pr-8">{selectedPost.title}</h2>
              <button 
                onClick={() => setSelectedPost(null)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Featured Image */}
              <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-6">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#0a1247] text-white px-3 py-1 rounded-full text-xs font-medium">
                    {selectedPost.category}
                  </span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedPost.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{selectedPost.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{selectedPost.readTime}</span>
                </div>
              </div>

              {/* Post Content */}
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {selectedPost.excerpt}
                </p>
                <div className="text-gray-700 leading-relaxed">
                  {selectedPost.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default BlogPage;
