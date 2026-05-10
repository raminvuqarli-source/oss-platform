import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, Calendar, BookOpen, ArrowLeft } from "lucide-react";

interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  imageUrl: string;
  author: string;
  authorTitle: string;
  readMinutes: number;
  tags: string[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <Skeleton className="w-full h-52" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-8 w-28 mt-2" />
      </div>
    </div>
  );
}

export default function BlogList() {
  const [, navigate] = useLocation();

  const { data: posts = [], isLoading } = useQuery<BlogPostMeta[]>({
    queryKey: ["/api/blog"],
  });

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Bloq — Otelçilik və Restoran İdarəetməsi"
        description="O.S.S. bloqu: otel gəlir strategiyaları, restoran POS, ağıllı texnologiyalar, qonaq təcrübəsi və daha çox mövzuda ekspert məqalələri."
        path="/blog"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "O.S.S. Bloq",
          "url": "https://ossaiproapp.com/blog",
          "description": "Otelçilik və restoran idarəetməsi üzrə ekspert məqalələri",
          "publisher": {
            "@type": "Organization",
            "name": "O.S.S.",
            "logo": {
              "@type": "ImageObject",
              "url": "https://ossaiproapp.com/icon-512.png"
            }
          }
        }}
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            O.S.S.
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium tracking-wide uppercase">
            Bloq
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Otelçilik & Restoran<br className="hidden md:block" /> İdarəetməsi üzrə Bilik
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Gəlir strategiyaları, ağıllı texnologiyalar, qonaq təcrübəsi və daha çox mövzuda ekspert məqalələri.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">

        {/* Featured post */}
        {isLoading ? (
          <div className="mb-14">
            <div className="rounded-2xl overflow-hidden border border-border bg-card flex flex-col md:flex-row">
              <Skeleton className="w-full md:w-1/2 h-64 md:h-80" />
              <div className="flex-1 p-8 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
          </div>
        ) : featured ? (
          <article
            className="mb-14 group rounded-2xl overflow-hidden border border-border bg-card flex flex-col md:flex-row cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            onClick={() => navigate(`/blog/${featured.slug}`)}
            data-testid={`featured-post-${featured.slug}`}
          >
            <div className="md:w-[45%] shrink-0 overflow-hidden">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
            </div>
            <div className="flex-1 p-7 md:p-10 flex flex-col justify-center gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border-0 text-xs font-medium">Seçilmiş</Badge>
                {featured.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed line-clamp-3">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(featured.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {featured.readMinutes} dəq oxu
                </span>
              </div>
              <div>
                <Button
                  size="sm"
                  className="gap-2 rounded-full"
                  data-testid={`btn-read-featured-${featured.slug}`}
                >
                  Oxu <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </article>
        ) : null}

        {/* Grid */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Bütün Məqalələr
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <BlogCardSkeleton key={i} />)
              : rest.map((post) => (
                  <article
                    key={post.slug}
                    className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                    data-testid={`card-post-${post.slug}`}
                  >
                    <div className="overflow-hidden h-48 shrink-0">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">{tag}</Badge>
                        ))}
                      </div>
                      <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 text-[15px]">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readMinutes} dəq
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </article>
                ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-10 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-3">Platformamızı Sınayın</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            14 gün pulsuz sınaq ilə otel və ya restoranınızı O.S.S. ilə idarə edin. Kredit kartı tələb olunmur.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/register-hotel")} className="rounded-full gap-2" data-testid="btn-cta-hotel">
              Otel üçün Başlayın <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate("/register-restaurant")} variant="outline" className="rounded-full gap-2" data-testid="btn-cta-restaurant">
              Restoran üçün Başlayın <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} O.S.S. Smart Hotel & Restaurant System</span>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition-colors">Məxfilik</button>
            <button onClick={() => navigate("/terms-of-service")} className="hover:text-foreground transition-colors">Şərtlər</button>
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Ana Səhifə</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
