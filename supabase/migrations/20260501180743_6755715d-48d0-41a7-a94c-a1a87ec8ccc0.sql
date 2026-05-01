
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  content_html TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  reading_minutes INTEGER NOT NULL DEFAULT 3,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_published ON public.blog_posts (is_published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING GIN (tags);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
ON public.blog_posts FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can view all posts"
ON public.blog_posts FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert posts"
ON public.blog_posts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update posts"
ON public.blog_posts FOR UPDATE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete posts"
ON public.blog_posts FOR DELETE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sanitize/validate inputs (length caps, trim) before save
CREATE OR REPLACE FUNCTION public.validate_blog_post_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.title := TRIM(COALESCE(NEW.title, ''));
  IF LENGTH(NEW.title) = 0 THEN
    RAISE EXCEPTION 'Title cannot be empty';
  END IF;
  IF LENGTH(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Title must be 200 characters or fewer';
  END IF;

  NEW.slug := LOWER(TRIM(COALESCE(NEW.slug, '')));
  IF NEW.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug must be lowercase letters, numbers, and hyphens only';
  END IF;
  IF LENGTH(NEW.slug) > 120 THEN
    RAISE EXCEPTION 'Slug must be 120 characters or fewer';
  END IF;

  IF NEW.excerpt IS NOT NULL AND LENGTH(NEW.excerpt) > 500 THEN
    RAISE EXCEPTION 'Excerpt must be 500 characters or fewer';
  END IF;
  IF NEW.seo_title IS NOT NULL AND LENGTH(NEW.seo_title) > 70 THEN
    RAISE EXCEPTION 'SEO title must be 70 characters or fewer';
  END IF;
  IF NEW.seo_description IS NOT NULL AND LENGTH(NEW.seo_description) > 200 THEN
    RAISE EXCEPTION 'SEO description must be 200 characters or fewer';
  END IF;

  -- Auto-set published_at when toggled to published
  IF NEW.is_published = true AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_blog_post_input_trigger
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.validate_blog_post_input();
