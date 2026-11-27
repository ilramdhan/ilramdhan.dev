import { Navigate, useParams } from 'react-router';
import { ProfileTab } from '@/pages/admin/ProfileTab';
import { ResumeTab } from '@/pages/admin/ResumeTab';
import { ServicesTab } from '@/pages/admin/ServicesTab';
import { ProjectsTab } from '@/pages/admin/ProjectsTab';
import { BlogTab } from '@/pages/admin/BlogTab';
import { MessagesTab } from '@/pages/admin/MessagesTab';
import { CommentsTab } from '@/pages/admin/CommentsTab';
import { CertificatesTab } from '@/pages/admin/CertificatesTab';
import { TechStackTab } from '@/pages/admin/TechStackTab';
import { AdminLayout, type AdminNavItem } from '@/pages/admin/AdminLayout';

/**
 * The one nav config: every dashboard tab is `/admin/<id>` (overview = `/admin`). The whole dashboard is one lazy
 * chunk, never in a public route's JS. ponytail: tabs are not split per tab; eight tab chunks cost +5.5 KiB of the
 * JS total (over its 1625 KiB cap) for ~1 KiB each. Split them (React.lazy per entry) if one tab grows heavy.
 */
const ADMIN_NAV: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    Tab: ProfileTab,
  },
  {
    id: 'resume',
    label: 'Resume',
    Tab: ResumeTab,
  },
  {
    id: 'services',
    label: 'Services',
    Tab: ServicesTab,
  },
  {
    id: 'projects',
    label: 'Projects',
    Tab: ProjectsTab,
  },
  {
    id: 'blog',
    label: 'Blog',
    Tab: BlogTab,
  },
  {
    id: 'messages',
    label: 'Messages',
    Tab: MessagesTab,
  },
  {
    id: 'comments',
    label: 'Comments',
    Tab: CommentsTab,
  },
  {
    id: 'certificates',
    label: 'Certificates',
    Tab: CertificatesTab,
  },
  {
    id: 'techstack',
    label: 'Tech Stack',
    Tab: TechStackTab,
  },
];

/** `/admin/:tab?` (behind AdminRoute): the tab from the URL. `/admin/overview` and unknown tabs go to `/admin`. */
export default function AdminPage() {
  const { tab: id } = useParams();
  const item = id ? ADMIN_NAV.find((t) => t.id === id && t.id !== 'overview') : ADMIN_NAV[0];
  return item ? <AdminLayout nav={ADMIN_NAV} item={item} /> : <Navigate to="/admin" replace />;
}
