import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

const SITE_URL = "https://enny-event-space.lovable.app";

const defaultMeta = {
  title: "Eventify — Premium Event Planning & Venue Booking in Nigeria",
  description:
    "Book stunning venues, premium catering, and elegant decorations for weddings and events across Nigeria with Eventify.",
  image: "/og-image.jpg",
  siteName: "Eventify",
};

const SEO = ({
  title,
  description = defaultMeta.description,
  image = defaultMeta.image,
  url,
  type = "website",
  noIndex = false,
}: SEOProps) => {
  const pageTitle = title
    ? `${title} | Eventify`
    : defaultMeta.title;

  const currentUrl = url
    ? (url.startsWith("http") ? url : `${SITE_URL}${url}`)
    : (typeof window !== "undefined" ? `${SITE_URL}${window.location.pathname}` : SITE_URL);
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content="event planning, venue booking, wedding venues, corporate events, catering services, event decorations, Lagos events, Nigeria events, party planning, hall booking" />
      <meta name="author" content="Eventify" />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={defaultMeta.siteName} />
      <meta property="og:locale" content="en_NG" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Additional SEO */}
      <meta name="theme-color" content="#d97706" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
};

export default SEO;
