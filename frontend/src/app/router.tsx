import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage.tsx';
import QuestListPage from '../pages/QuestListPage.tsx';
import QuestDetailPage from '../pages/QuestDetailPage.tsx';
import NotFoundPage from '../pages/NotFoundPage.tsx';
import LoginPage from '../pages/LoginPage.tsx';
import RegisterPage from '../pages/RegisterPage.tsx';
import OrganizerQuestListPage from '../pages/OrganizerQuestListPage.tsx';
import OrganizerQuestCreatePage from '../pages/OrganizerQuestCreatePage.tsx';
import OrganizerQuestEditPage from '../pages/OrganizerQuestEditPage.tsx';
import RequireManagementAccess from '../components/organizer/RequireManagementAccess.tsx';
import RequireAuth from '../components/RequireAuth.tsx';
import PassportPage from '../pages/PassportPage.tsx';
import MyQuestsPage from '../pages/MyQuestsPage.tsx';
import LeaderboardPage from '../pages/LeaderboardPage.tsx';
import AppShell from './AppShell.tsx';
import {
  ChangePasswordPage, CheckEmailPage, ConfirmEmailPage,
  ForgotPasswordPage, ResetPasswordPage,
} from '../pages/AccountLifecyclePages.tsx';
import AdminReviewPage from '../pages/AdminReviewPage.tsx';
import ShareCardBuilderPage from '../pages/ShareCardBuilderPage.tsx';
import PassportSharePage from '../pages/PassportSharePage.tsx';
import ProfileSettingsPage from '../pages/ProfileSettingsPage.tsx';
import CommunityPage from '../pages/CommunityPage.tsx';
import SocialPostDetailPage from '../pages/SocialPostDetailPage.tsx';
import PublicPassportPage from '../pages/PublicPassportPage.tsx';

const developmentRoutes = import.meta.env.DEV
  ? [{
      path: '/dev/rewards',
      lazy: async () => {
        const module = await import('../pages/RewardLabPage.tsx');
        return { Component: module.default };
      },
    }]
  : [];

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/quests', element: <QuestListPage /> },
      { path: '/quests/:questId', element: <QuestDetailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/check-email', element: <CheckEmailPage /> },
      { path: '/confirm-email', element: <ConfirmEmailPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/leaderboard', element: <LeaderboardPage /> },
      { path: '/community', element: <CommunityPage /> },
      { path: '/community/posts/:postId', element: <SocialPostDetailPage /> },
      { path: '/p/:shareId', element: <PublicPassportPage /> },
      ...developmentRoutes,
      {
        element: <RequireAuth />,
        children: [
          { path: '/passport', element: <PassportPage /> },
          { path: '/passport/share', element: <PassportSharePage /> },
          { path: '/passport/share/completion', element: <ShareCardBuilderPage /> },
          { path: '/settings/profile', element: <ProfileSettingsPage /> },
          { path: '/settings/password', element: <ChangePasswordPage /> },
          { path: '/admin/reviews', element: <AdminReviewPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [{ path: '/my-quests', element: <MyQuestsPage /> }],
      },
      {
        element: <RequireManagementAccess />,
        children: [
          { path: '/organizer/quests', element: <OrganizerQuestListPage /> },
          { path: '/organizer/quests/new', element: <OrganizerQuestCreatePage /> },
          { path: '/organizer/quests/:questId/edit', element: <OrganizerQuestEditPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
