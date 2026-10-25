import { Carousel, CarouselSkeleton, CAROUSEL_MIN_ITEMS } from '@/components/ui/Carousel';
import { BlogCard, BlogCardSkeleton } from './BlogCard';
import type { BlogCard as BlogCardData } from './api';

/** Up to this many posts are shown as a plain grid instead of a carousel. */
export const CAROUSEL_MIN_POSTS = CAROUSEL_MIN_ITEMS;

const renderSkeleton = () => <BlogCardSkeleton />;

/** Skeleton row with the carousel's / grid's card boxes. */
export function FeaturedCarouselSkeleton() {
  return <CarouselSkeleton renderSkeleton={renderSkeleton} />;
}

/** Featured posts on the home page: the generic `Carousel` with blog cards (#113). */
export function FeaturedCarousel({ posts }: { posts: BlogCardData[] }) {
  return (
    <Carousel
      items={posts}
      getKey={(post) => post.id}
      renderItem={(post, { sizes }) => <BlogCard post={post} headingLevel="h3" sizes={sizes} />}
      label="Featured articles"
      prevLabel="Previous articles"
      nextLabel="Next articles"
      trackTestId="featured-track"
    />
  );
}
