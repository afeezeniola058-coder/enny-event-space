import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";

interface BlogPostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  reading_minutes: number;
  published_at: string | null;
}

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("All");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image_url, tags, reading_minutes, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as BlogPostCard[];
    },
    staleTime: 60_000,
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesTag = activeTag === "All" || p.tags?.includes(activeTag);
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.excerpt ?? "").toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q));
      return matchesTag && matchesSearch;
    });
  }, [posts, search, activeTag]);

  return (
    <>
      <SEO
        title="Event Planning Blog — Tips, Trends & Inspiration"
        description="Expert advice on weddings, corporate events, catering, and venue planning in Nigeria. Get inspired by real events, budgeting tips, and decor trends from Enny Event."
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main id="main-content" className="pt-24 pb-16">
          {/* Hero */}
          <section className="container mx-auto px-4 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4">Insights & Inspiration</Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                The Enny Event Blog
              </h1>
              <p className="text-muted-foreground text-lg">
                Practical tips, planning checklists, and design inspiration to help you host
                unforgettable weddings, corporate events, and celebrations.
              </p>
            </motion.div>
          </section>

          {/* Search + Tags */}
          <section className="container mx-auto px-4 mb-8 space-y-4">
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {allTags.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeTag === tag
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Posts grid */}
          <section className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((post, idx) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link to={`/blog/${post.slug}`} aria-label={post.title}>
                      <Card className="overflow-hidden cursor-pointer group hover:shadow-elegant transition-all duration-300 h-full flex flex-col">
                        <AspectRatio ratio={16 / 9}>
                          {post.cover_image_url ? (
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                              <span className="font-display text-2xl text-primary/60">Enny Event</span>
                            </div>
                          )}
                        </AspectRatio>
                        <CardContent className="p-5 flex-1 flex flex-col">
                          {post.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <h2 className="font-display text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                            {post.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(post.published_at), "MMM d, yyyy")}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.reading_minutes} min read
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {posts.length === 0
                    ? "No articles published yet. Check back soon!"
                    : "No articles match your search."}
                </p>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
