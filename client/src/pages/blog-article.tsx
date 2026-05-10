import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ArrowLeft, Clock, Calendar, User, ArrowRight, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageUrl: string;
  author: string;
  authorTitle: string;
  readMinutes: number;
  tags: string[];
}

const BASE_URL = "https://ossaiproapp.com";
const SITE_NAME = "O.S.S - Smart Hotel System";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ArticleSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-4/5" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="w-full h-72 rounded-2xl" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}

export default function BlogArticle() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ["/api/blog", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/${params.slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  const handleShare = async () => {
    const url = `${BASE_URL}/blog/${params.slug}`;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link kopyalandı!" });
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-foreground">Məqalə tapılmadı</h1>
        <p className="text-muted-foreground">Bu məqalə mövcud deyil və ya silinib.</p>
        <Button onClick={() => navigate("/blog")} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Bloga Qayıt
        </Button>
      </div>
    );
  }

  const canonicalUrl = `${BASE_URL}/blog/${params.slug}`;
  const fullTitle = post ? `${post.title} | ${SITE_NAME}` : SITE_NAME;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {post && (
        <Helmet>
          <title>{fullTitle}</title>
          <meta name="description" content={post.excerpt} />
          <link rel="canonical" href={canonicalUrl} />
          <meta name="robots" content="index, follow" />

          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={post.excerpt} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:image" content={post.imageUrl} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:locale" content="az_AZ" />

          <meta property="article:published_time" content={post.date} />
          <meta property="article:author" content={post.author} />
          {post.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={fullTitle} />
          <meta name="twitter:description" content={post.excerpt} />
          <meta name="twitter:image" content={post.imageUrl} />

          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "image": post.imageUrl,
              "datePublished": post.date,
              "dateModified": post.date,
              "url": canonicalUrl,
              "author": {
                "@type": "Organization",
                "name": post.author,
                "url": BASE_URL,
              },
              "publisher": {
                "@type": "Organization",
                "name": SITE_NAME,
                "logo": {
                  "@type": "ImageObject",
                  "url": `${BASE_URL}/icon-512.png`,
                },
              },
              "keywords": post.tags.join(", "),
              "inLanguage": "az",
            })}
          </script>
        </Helmet>
      )}

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-blog"
          >
            <ArrowLeft className="w-4 h-4" />
            Bloq
          </button>
          <div className="flex items-center gap-2">
            {post && (
              <button
                onClick={handleShare}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                data-testid="btn-share"
                aria-label="Paylaş"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {isLoading ? (
        <ArticleSkeleton />
      ) : post ? (
        <>
          {/* Hero image */}
          <div className="w-full h-64 md:h-[420px] overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          <main className="max-w-3xl mx-auto px-4 py-10">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs px-2.5 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-5">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span data-testid="text-author">{post.author}</span>
                <span className="text-muted-foreground/60">· {post.authorTitle}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readMinutes} dəqiqəlik oxu
              </span>
            </div>

            {/* Article body */}
            <div
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:text-[15px]
                prose-p:mb-4 prose-lead:text-lg prose-lead:text-foreground/90
                prose-ul:my-4 prose-li:text-foreground/85 prose-li:text-[15px]
                prose-strong:text-foreground prose-strong:font-semibold"
              dangerouslySetInnerHTML={{ __html: post.content }}
              data-testid="article-content"
            />

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Bu məqaləni paylaşın</p>
                <p className="text-xs text-muted-foreground">Faydalı olduğunu düşünürsünüzsə, paylaşın.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2 rounded-full"
                data-testid="btn-share-bottom"
              >
                <Share2 className="w-4 h-4" />
                Paylaş
              </Button>
            </div>

            {/* CTA */}
            <div className="mt-10 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">O.S.S. ilə Sınayın</h3>
              <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
                14 gün pulsuz sınaq ilə otel və ya restoranınızı O.S.S. ilə idarə edin. Kredit kartı tələb olunmur.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/register-hotel")} className="rounded-full gap-2 text-sm" data-testid="btn-cta-hotel">
                  Otel üçün Başlayın <ArrowRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => navigate("/register-restaurant")} variant="outline" className="rounded-full gap-2 text-sm" data-testid="btn-cta-restaurant">
                  Restoran üçün Başlayın
                </Button>
              </div>
            </div>

            {/* Back */}
            <div className="mt-8 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/blog")}
                className="gap-2 text-muted-foreground hover:text-foreground"
                data-testid="btn-back-blog"
              >
                <ArrowLeft className="w-4 h-4" />
                Bütün məqalələrə qayıt
              </Button>
            </div>
          </main>
        </>
      ) : null}

      <footer className="border-t border-border mt-4 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} O.S.S. Smart Hotel & Restaurant System</span>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/blog")} className="hover:text-foreground transition-colors">Bloq</button>
            <button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition-colors">Məxfilik</button>
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Ana Səhifə</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
