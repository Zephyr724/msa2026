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
      {
        element: <RequireAuth />,
        children: [
          { path: '/passport', element: <PassportPage /> },
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
