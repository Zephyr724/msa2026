import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage.tsx';
import QuestListPage from '../pages/QuestListPage.tsx';
import QuestDetailPage from '../pages/QuestDetailPage.tsx';
import NotFoundPage from '../pages/NotFoundPage.tsx';
import LoginPage from '../pages/LoginPage.tsx';
import RegisterPage from '../pages/RegisterPage.tsx';
import AppShell from './AppShell.tsx';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/quests', element: <QuestListPage /> },
      { path: '/quests/:questId', element: <QuestDetailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
