import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage.tsx';
import QuestListPage from '../pages/QuestListPage.tsx';
import QuestDetailPage from '../pages/QuestDetailPage.tsx';
import NotFoundPage from '../pages/NotFoundPage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/quests',
    element: <QuestListPage />,
  },
  {
    path: '/quests/:questId',
    element: <QuestDetailPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
