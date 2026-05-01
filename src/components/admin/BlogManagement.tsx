import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, Loader2, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "./RichTextEditor";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { slugify, estimateReadingMinutes } from "@/lib/blog-utils";

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_html: string;
  tags: string[];
  reading_minutes: number;
  is_published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
}

const emptyPost: Partial<BlogPostRow> = {
  slug: "",
  title: "",
  excerpt: "",
  cover_image_url: "",
  content_html: "",
  tags: [],
  is_published: false,
  seo_title: "",
  seo_description: "",
};

const BlogManagement = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<BlogPostRow> | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPostRow[];
    },
  });

  const openNew = () => {
    setEditing({ ...emptyPost });
    setTagInput("");
    setOpen(true);
  };

  const openEdit = (post: BlogPostRow) => {
    setEditing(post);
    setTagInput("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setEditing(null), 200);
  };

  const updateField = <K extends keyof BlogPostRow>(key: K, value: BlogPostRow[K]) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleTitleChange = (title: string) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const next = { ...prev, title };
      // Auto-generate slug for new posts (when slug is empty or matches old title-derived slug)
      if (!prev.id && (!prev.slug || prev.slug === slugify(prev.title ?? ""))) {
        next.slug = slugify(title);
      }
      return next;
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    setEditing((prev) => {
      if (!prev) return prev;
      const tags = Array.from(new Set([...(prev.tags ?? []), t]));
      return { ...prev, tags };
    });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setEditing((prev) => prev ? { ...prev, tags: (prev.tags ?? []).filter((t) => t !== tag) } : prev);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setCoverUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `blog/cover-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("event-images").getPublicUrl(path);
      updateField("cover_image_url", data.publicUrl);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const slug = (editing.slug?.trim() || slugify(editing.title)).toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast({
        title: "Invalid slug",
        description: "Use lowercase letters, numbers, and hyphens only.",
        variant: "destructive",
      });
      return;
    }

    const cleanContent = sanitizeHtml(editing.content_html ?? "");
    const reading = estimateReadingMinutes(cleanContent);

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        slug,
        title: editing.title.trim(),
        excerpt: editing.excerpt?.trim() || null,
        cover_image_url: editing.cover_image_url?.trim() || null,
        content_html: cleanContent,
        tags: editing.tags ?? [],
        reading_minutes: reading,
        is_published: !!editing.is_published,
        seo_title: editing.seo_title?.trim() || null,
        seo_description: editing.seo_description?.trim() || null,
        author_id: user?.id ?? null,
      };

      if (editing.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Article updated" });
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
        toast({ title: "Article created" });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-public"] });
      handleClose();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post: BlogPostRow) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ is_published: !post.is_published })
      .eq("id", post.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: post.is_published ? "Article unpublished" : "Article published" });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-public"] });
    }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Article deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-public"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold">Blog</h2>
          <p className="text-sm text-muted-foreground">
            Write SEO-friendly articles to attract organic traffic.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          New article
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-secondary/50 animate-pulse rounded-md" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No articles yet. Create your first post to start ranking on Google.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-xs text-muted-foreground">/{post.slug}</div>
                    </TableCell>
                    <TableCell>
                      {post.is_published ? (
                        <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(post.tags ?? []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(post.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {post.is_published && (
                          <Button asChild variant="ghost" size="icon" aria-label="View live">
                            <Link to={`/blog/${post.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublish(post)}
                          aria-label={post.is_published ? "Unpublish" : "Publish"}
                        >
                          {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(post)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete article?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{post.title}" will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePost(post.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(o) : handleClose())}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit article" : "New article"}</DialogTitle>
            <DialogDescription>
              Write engaging, keyword-rich content. Posts are sanitized before saving.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={editing.title ?? ""}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    maxLength={200}
                    placeholder="10 Wedding Venue Tips for Lagos Couples"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="slug">URL slug</Label>
                  <Input
                    id="slug"
                    value={editing.slug ?? ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="wedding-venue-tips-lagos"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground">/blog/{editing.slug || "your-slug"}</p>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={editing.excerpt ?? ""}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    placeholder="Short teaser shown on the blog list and social previews."
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Cover image</Label>
                  {editing.cover_image_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img src={editing.cover_image_url} alt="Cover" className="w-full max-h-60 object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => updateField("cover_image_url", "")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                      {coverUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {coverUploading ? "Uploading…" : "Upload cover image (max 5MB)"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="weddings, planning, lagos…"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(editing.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Content *</Label>
                  <RichTextEditor
                    value={editing.content_html ?? ""}
                    onChange={(html) => updateField("content_html", html)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO title</Label>
                  <Input
                    id="seo_title"
                    value={editing.seo_title ?? ""}
                    onChange={(e) => updateField("seo_title", e.target.value)}
                    maxLength={70}
                    placeholder="Falls back to title"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(editing.seo_title?.length ?? 0)}/70 — keep under 60 for best display.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_description">SEO description</Label>
                  <Input
                    id="seo_description"
                    value={editing.seo_description ?? ""}
                    onChange={(e) => updateField("seo_description", e.target.value)}
                    maxLength={200}
                    placeholder="Falls back to excerpt"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(editing.seo_description?.length ?? 0)}/200 — aim for 150–160.
                  </p>
                </div>

                <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="publish" className="text-base">Publish</Label>
                    <p className="text-xs text-muted-foreground">When on, the article appears at /blog and is indexable.</p>
                  </div>
                  <Switch
                    id="publish"
                    checked={!!editing.is_published}
                    onCheckedChange={(v) => updateField("is_published", v)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing?.id ? "Save changes" : "Create article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
