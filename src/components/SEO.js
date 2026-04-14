import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for dynamic meta tags
 * @param {Object} props - SEO configuration
 * @param {string} props.title - Page title (will be appended to site name)
 * @param {string} props.description - Meta description
 * @param {string} props.keywords - Meta keywords (optional)
 * @param {string} props.image - Open Graph image URL (optional)
 * @param {string} props.url - Canonical URL (optional, defaults to current path)
 * @param {string} props.type - Open Graph type (default: 'website')
 */
const SEO = ({ 
  title = 'City College of Bayawan',
  description = 'City College of Bayawan - Honor and Excellence for the Highest Good. Quality education in Bayawan City, Negros Oriental.',
  keywords = 'City College of Bayawan, CCB, Bayawan City, Negros Oriental, Higher Education, College, University, Academic Programs',
  image = '/images/ccb-logo.png',
  url,
  type = 'website'
}) => {
  const siteName = 'City College of Bayawan';
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = url ? `${siteUrl}${url}` : (typeof window !== 'undefined' ? window.location.href : '');
  const ogImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content={siteName} />
    </Helmet>
  );
};

export default SEO;

