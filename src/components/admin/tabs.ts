/**
 * Admin tab navigation config — single source of truth for tab labels,
 * icons, and their on-click side effects (e.g. fetching data when a tab
 * is first opened).
 *
 * Previously, 11 tab buttons were copy-pasted inline in admin/page.tsx.
 * Now they're rendered from this array, making it trivial to add/remove
 * tabs or change their labels.
 */

import type { AdminTab } from './types';

export interface TabConfig {
  id: AdminTab;
  label: string;
  icon: string;
  /** Optional side-effect to run when this tab is activated. */
  onSelect?: () => void;
}

// Helper to build the tab config with lazy-fetch callbacks.
// Called from the admin page so it can wire up the fetch functions.
export function buildTabConfig(callbacks: {
  fetchProgress: () => void;
  fetchModules: (courseFilter: string) => void;
  modulesCourseFilter: string;
  fetchQuotes: () => void;
  fetchTeam: () => void;
  fetchServices: () => void;
  fetchProjects: () => void;
  fetchCourses: () => void;
  fetchTests: () => void;
  analytics: unknown;
  setAnalytics: (data: unknown) => void;
}): TabConfig[] {
  return [
    { id: 'enrollments', label: 'Enrollments', icon: 'fa-solid fa-user-plus' },
    { id: 'users', label: 'Users', icon: 'fa-solid fa-users' },
    {
      id: 'progress',
      label: 'Progress',
      icon: 'fa-solid fa-chart-line',
      onSelect: callbacks.fetchProgress,
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: 'fa-solid fa-layer-group',
      onSelect: () => callbacks.fetchModules(callbacks.modulesCourseFilter),
    },
    {
      id: 'quotes',
      label: 'Quotes',
      icon: 'fa-solid fa-file-invoice',
      onSelect: callbacks.fetchQuotes,
    },
    {
      id: 'team',
      label: 'Team',
      icon: 'fa-solid fa-people-group',
      onSelect: callbacks.fetchTeam,
    },
    {
      id: 'services',
      label: 'Services',
      icon: 'fa-solid fa-concierge-bell',
      onSelect: callbacks.fetchServices,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'fa-solid fa-folder-open',
      onSelect: callbacks.fetchProjects,
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: 'fa-solid fa-graduation-cap',
      onSelect: callbacks.fetchCourses,
    },
    {
      id: 'tests',
      label: 'Tests',
      icon: 'fa-solid fa-clipboard-question',
      onSelect: callbacks.fetchTests,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'fa-solid fa-chart-pie',
      onSelect: () => {
        if (!callbacks.analytics) {
          fetch('/api/admin/analytics')
            .then((r) => r.json())
            .then((d) => callbacks.setAnalytics(d))
            .catch(() => {});
        }
      },
    },
  ];
}
