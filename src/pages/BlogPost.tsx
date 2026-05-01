import { useEffect, useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_html: string;
  tags: string[];
  reading_minutes: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["blog-related", post?.id, post?.tags],
    queryFn: async () => {
      if (!post) return [];
      const tags = post.tags?.length ? post.tags : null;
      let query = supabase
        .from("blog_posts")
        .select("id, slug, title, cover_image_url, published_at, reading_minutes")
        .eq("is_published", true)
        .neq("id", post.id)
        .order("published_at", { ascending: false })
        .limit(3);
      if (tags) query = query.overlaps("tags", tags);
      const { data } = await query;
      return data ?? [];
    },
    enabled: !!post,
  });

  const sanitized = useMemo(() => sanitizeHtml(post?.content_html ?? ""), [post?.content_html]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return <Navigate to="/blog" replace />;
  }

  const url = typeof window !== "undefined" ? window.location.href : "";
  const seoTitle = post.seo_title || post.title;
  const seoDesc = post.seo_description || post.excerpt || "Insights from Enny Event.";
  const ogImage = post.cover_image_url || undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: seoDesc,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    author: { "@type": "Organization", name: "Enny Event" },
    publisher: {
      "@type": "Organization",
      name: "Enny Event",
      logo: { "@type": "ImageObject", url: "https://enny-event-space.lovable.app/og-image.jpg" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.tags?.join(", "),
  };

  return (
    <>
      <SEO title={seoTitle} description={seoDesc} image={ogImage} type="article" url={url} />
      <Helmet>
        {post.published_at && (
          <meta property="article:published_time" content={post.published_at} />
        )}
        {post.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main id="main-content" className="pt-24 pb-16">
          <article className="container mx-auto px-4 max-w-3xl">
            <Button asChild variant="ghost" size="sm" className="mb-6">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to blog
              </Link>
            </Button>

            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-lg text-muted-foreground mb-4">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(post.published_at), "MMMM d, yyyy")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.reading_minutes} min read
                </span>
              </div>
            </motion.header>

            {post.cover_image_url && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-10 rounded-xl overflow-hidden"
              >
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              </motion.div>
            )}

            <div
              className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          </article>

          {related.length > 0 && (
            <section className="container mx-auto px-4 mt-16 max-w-5xl">
              <h2 className="font-display text-2xl font-semibold mb-6">Related articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((r: any) => (
                  <Link key={r.id} to={`/blog/${r.slug}`}>
                    <Card className="overflow-hidden h-full hover:shadow-elegant transition-all">
                      <AspectRatio ratio={16 / 9}>
                        {r.cover_image_url ? (
                          <img src={r.cover_image_url} alt={r.title} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary" />
                        )}
                      </AspectRatio>
                      <CardContent className="p-4">
                        <h3 className="font-display font-semibold line-clamp-2 mb-2">{r.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {r.published_at && (
                            <span>{format(new Date(r.published_at), "MMM d, yyyy")}</span>
                          )}
                          <span>{r.reading_minutes} min</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BlogPost;
