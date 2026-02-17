import { useEffect } from 'react';

interface MetaOptions {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

const SITE_NAME = 'Ilham Ramadhan';
const DEFAULT_DESCRIPTION = "Ilham Ramadhan's personal portfolio website showcasing projects, skills, and blog posts.";
const DEFAULT_OG_IMAGE = '/logo.png';

function setMetaTag(property: string, content: string, isName = false) {
  const selector = isName
    ? `meta[name="${property}"]`
    : `meta[property="${property}"]`;
  let element = document.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    if (isName) {
      element.setAttribute('name', property);
    } else {
      element.setAttribute('property', property);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function useDocumentMeta({
  title,
  description,
  ogImage,
  ogUrl,
  ogType = 'website',
}: MetaOptions = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Web Developer & Portfolio`;
    const metaDescription = description || DEFAULT_DESCRIPTION;
    const metaImage = ogImage || DEFAULT_OG_IMAGE;
    const metaUrl = ogUrl || window.location.href;

    // Update document title
    document.title = fullTitle;

    // Update meta description
    setMetaTag('description', metaDescription, true);

    // Open Graph
    setMetaTag('og:title', fullTitle);
    setMetaTag('og:description', metaDescription);
    setMetaTag('og:image', metaImage);
    setMetaTag('og:url', metaUrl);
    setMetaTag('og:type', ogType);
    setMetaTag('og:site_name', SITE_NAME);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image', true);
    setMetaTag('twitter:title', fullTitle, true);
    setMetaTag('twitter:description', metaDescription, true);
    setMetaTag('twitter:image', metaImage, true);

    return () => {
      // Reset to defaults when component unmounts
      document.title = `${SITE_NAME} | Web Developer & Portfolio`;
    };
  }, [title, description, ogImage, ogUrl, ogType]);
}
