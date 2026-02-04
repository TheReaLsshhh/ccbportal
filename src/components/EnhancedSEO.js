import React from 'react';
import { Helmet } from 'react-helmet-async';
import { generateMetaTags, generateStructuredData, generateOrganizationSchema } from '../utils/SEOEnhancer';

const EnhancedSEO = ({ 
  pageData, 
  structuredData = [], 
  breadcrumbs = [],
  customSchema = [] 
}) => {
  const metaTags = generateMetaTags(pageData);
  const organizationSchema = generateOrganizationSchema();
  
  // Combine all structured data
  const allStructuredData = [
    organizationSchema,
    ...structuredData,
    ...customSchema,
    ...(breadcrumbs.length > 0 ? [generateStructuredData('BreadcrumbList', {
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    })] : [])
  ];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      {metaTags.keywords && <meta name="keywords" content={metaTags.keywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={metaTags.canonical} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={metaTags.openGraph.title} />
      <meta property="og:description" content={metaTags.openGraph.description} />
      <meta property="og:url" content={metaTags.openGraph.url} />
      <meta property="og:type" content={metaTags.openGraph.type} />
      <meta property="og:locale" content={metaTags.openGraph.locale} />
      <meta property="og:site_name" content={metaTags.openGraph.siteName} />
      <meta property="og:image" content={metaTags.openGraph.image.url} />
      <meta property="og:image:width" content={metaTags.openGraph.image.width} />
      <meta property="og:image:height" content={metaTags.openGraph.image.height} />
      <meta property="og:image:alt" content={metaTags.openGraph.image.alt} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={metaTags.twitter.card} />
      <meta name="twitter:title" content={metaTags.twitter.title} />
      <meta name="twitter:description" content={metaTags.twitter.description} />
      <meta name="twitter:image" content={metaTags.twitter.image} />
      <meta name="twitter:site" content={metaTags.twitter.site} />
      
      {/* Additional Meta Tags */}
      {metaTags.additional.map((tag, index) => {
        if (tag.httpEquiv) {
          return <meta key={index} httpEquiv={tag.httpEquiv} content={tag.content} />;
        }
        return <meta key={index} name={tag.name} content={tag.content} />;
      })}
      
      {/* Structured Data */}
      {allStructuredData.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {schema}
        </script>
      ))}
      
      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      
      {/* Preconnect for Critical Resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#2d5a2d" />
      <meta name="msapplication-TileColor" content="#2d5a2d" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      
      {/* Content Security Policy (for production) */}
      {process.env.NODE_ENV === 'production' && (
        <meta httpEquiv="Content-Security-Policy" content="
          default-src 'self';
          script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          font-src 'self' https://fonts.gstatic.com;
          img-src 'self' data: https:;
          connect-src 'self' https://api.brevo.com;
          frame-src 'none';
        " />
      )}
    </Helmet>
  );
};

export default EnhancedSEO;
