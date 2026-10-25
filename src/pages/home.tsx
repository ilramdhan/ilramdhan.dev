import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Code, Smartphone, Cloud, Terminal, Layout, Database } from 'lucide-react';
// Synchronous renderer on home (T-58): its blurbs sit inside motion components whose
// async feature load (LazyMotion) would race the lazy renderer's hydration (React #421).
import Markdown from '@/components/ui/MarkdownRenderer';
import { MotionScope, Reveal } from '@/components/motion';
import { Hero } from '@/features/hero-3d/Hero';
import { ProjectCard, ProjectCardSkeleton } from '@/features/projects/ProjectCard';
import { ContactForm } from '@/features/messages/ContactForm';
import { TechBadge } from '@/components/ui/TechBadge';
import { Navbar } from '@/app/layouts/Navbar';
import { profileQueries } from '@/features/profile/queries';
import { projectQueries } from '@/features/projects/queries';
import { blogQueries } from '@/features/blog/queries';
import { FeaturedCarousel, FeaturedCarouselSkeleton } from '@/features/blog/FeaturedCarousel';
import { Carousel, CarouselSkeleton } from '@/components/ui/Carousel';
import { techStackQueries } from '@/features/tech-stack/queries';
import { serviceQueries } from '@/features/services/queries';
import { Seo } from '@/components/seo/Seo';
import { useInView } from '@/lib/hooks';

const renderProjectSkeleton = () => <ProjectCardSkeleton />;

const IconMap: { [key: string]: React.ElementType } = {
  code: Code,
  smartphone: Smartphone,
  cloud: Cloud,
  terminal: Terminal,
  layout: Layout,
  database: Database,
};

export default function Page() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInView = useInView(marqueeRef);

  // Not read here, but keeps the shared ['profile'] query subscribed on the home page.
  useQuery(profileQueries.detail());

  const {
    data: featuredProjects,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
  } = useQuery(projectQueries.featured());

  const {
    data: featuredBlogs,
    isLoading: isLoadingBlogs,
    isError: isErrorBlogs,
  } = useQuery(blogQueries.featured());

  const { data: techStack } = useQuery(techStackQueries.list());

  const { data: services, isPending: isPendingServices } = useQuery(serviceQueries.list());

  return (
    <MotionScope>
      <Seo description="Ilham Ramadhan's personal portfolio — showcasing projects, skills, certifications, and blog posts." />
      <Navbar />
      <main className="min-h-screen">
        <Hero />

        {/* Services Section */}
        {/* Sections render their shell straight away with skeletons of the final size,
            so content arriving later never pushes the page down (T-26). */}
        {(isPendingServices || (services && services.length > 0)) && (
          <section className="py-20 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  What I Do
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  I offer a range of services to help you build your next digital product.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isPendingServices &&
                  [0, 1, 2].map((i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="bg-white border border-slate-200 dark:bg-slate-900/50 dark:border-white/5 p-8 rounded-2xl flex flex-col items-center"
                    >
                      <div className="h-14 w-14 rounded-full bg-indigo-50 dark:bg-slate-800 mb-6" />
                      <div className="h-7 w-1/2 mb-3 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-[46px] w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                    </div>
                  ))}
                {services?.map((service, idx) => {
                  const Icon = service.icon_name ? IconMap[service.icon_name] || Code : Code;
                  return (
                    <Reveal
                      key={service.id}
                      index={idx}
                      className="bg-white border border-slate-200 dark:bg-slate-900/50 dark:border-white/5 p-8 rounded-2xl flex flex-col items-center text-center hover:border-indigo-500/30 transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5 hover:shadow-md shadow-sm dark:shadow-none group"
                    >
                      <div className="h-14 w-14 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                        {service.title}
                      </h3>
                      <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed prose prose-sm dark:prose-invert">
                        <Markdown>{service.description || ''}</Markdown>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Tech Stack Marquee */}
        <section className="py-12 bg-white border-y border-slate-200 dark:bg-slate-900/50 dark:border-white/5 overflow-hidden backdrop-blur-sm transition-colors">
          <div className="max-w-7xl mx-auto px-4 mb-8">
            <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-wider">
              Technologies I work with
            </p>
          </div>
          <div
            ref={marqueeRef}
            data-paused={!marqueeInView}
            className="marquee relative flex overflow-x-hidden"
            style={{
              maskImage:
                'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            }}
          >
            <div className="marquee-track flex whitespace-nowrap min-h-[4.25rem]">
              <div className="flex-shrink-0 flex items-center justify-center gap-24 py-4 px-6">
                {techStack?.map((tech, i) => (
                  <TechBadge key={`tech-a-${i}`} name={tech.name} iconUrl={tech.icon_url} />
                ))}
              </div>
              <div
                aria-hidden="true"
                className="flex-shrink-0 flex items-center justify-center gap-24 py-4 px-6"
              >
                {techStack?.map((tech, i) => (
                  <TechBadge key={`tech-b-${i}`} name={tech.name} iconUrl={tech.icon_url} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Projects Section */}
        <section id="projects" className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Featured Projects
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Some of my recent work</p>
              </div>
              <Link
                to="/projects"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-1"
              >
                View All Projects &rarr;
              </Link>
            </div>

            {isLoadingProjects && (
              <>
                <span className="sr-only" role="status">
                  Loading projects...
                </span>
                <CarouselSkeleton renderSkeleton={renderProjectSkeleton} />
              </>
            )}
            {isErrorProjects && !featuredProjects && (
              <p className="text-red-500 text-center py-10">Error loading projects.</p>
            )}
            {featuredProjects && featuredProjects.length > 0 && (
              <Carousel
                items={featuredProjects}
                getKey={(project) => project.id}
                renderItem={(project, { sizes, index }) => (
                  <ProjectCard project={project} index={index} sizes={sizes} className="h-full" />
                )}
                label="Featured projects"
                prevLabel="Previous projects"
                nextLabel="Next projects"
                trackTestId="featured-projects-track"
              />
            )}
            {featuredProjects?.length === 0 && !isLoadingProjects && (
              <p className="text-slate-500 text-center py-10">No featured projects yet.</p>
            )}
          </div>
        </section>

        {/* Latest Blog Section */}
        <section
          id="blog"
          className="py-20 bg-slate-50 border-y border-slate-200 dark:bg-slate-900/30 dark:border-white/5 backdrop-blur-sm transition-colors"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Featured Articles
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Thoughts on development and tech
                </p>
              </div>
              <Link
                to="/blog"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-1"
              >
                Read Blog &rarr;
              </Link>
            </div>

            {isLoadingBlogs && (
              <>
                <span className="sr-only" role="status">
                  Loading posts...
                </span>
                <FeaturedCarouselSkeleton />
              </>
            )}
            {isErrorBlogs && !featuredBlogs && (
              <p className="text-red-500 text-center py-10">Error loading posts.</p>
            )}
            {featuredBlogs && featuredBlogs.length > 0 && (
              <FeaturedCarousel posts={featuredBlogs} />
            )}
            {featuredBlogs?.length === 0 && !isLoadingBlogs && (
              <p className="text-slate-500 text-center py-10">No featured blog posts.</p>
            )}
          </div>
        </section>

        {/* Contact Section */}
        {/* Static CSS mesh gradient (replaces the Vanta WebGL globe, T-25). */}
        <section
          id="contact"
          className="relative overflow-hidden bg-slate-50 dark:bg-slate-900 bg-[radial-gradient(ellipse_60%_50%_at_20%_30%,rgba(89,155,250,0.18),transparent),radial-gradient(ellipse_50%_60%_at_80%_70%,rgba(42,109,170,0.18),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_20%_30%,rgba(89,155,250,0.16),transparent),radial-gradient(ellipse_50%_60%_at_80%_70%,rgba(42,109,170,0.22),transparent)]"
        >
          <div className="relative z-10 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Get In Touch
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Have a project in mind or just want to chat? Feel free to send me a message. I'm
                  currently open for new opportunities.
                </p>
              </div>

              <div className="bg-white/80 border border-slate-200 dark:bg-slate-900/80 dark:border-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-xl mx-auto shadow-lg dark:shadow-none">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
    </MotionScope>
  );
}
