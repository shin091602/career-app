import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { NovelBankPage } from './pages/NovelBankPage';
import { NovelAdPage } from './pages/NovelAdPage';
import { TaskBankPage } from './pages/TaskBankPage';
import { TaskAdPage } from './pages/TaskAdPage';
import { NotFoundPage } from './pages/NotFoundPage';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/novel-bank', element: <NovelBankPage /> },
  { path: '/novel-ad', element: <NovelAdPage /> },
  { path: '/task-bank', element: <TaskBankPage /> },
  { path: '/task-ad', element: <TaskAdPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
