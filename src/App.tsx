import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import NotFound from './pages/NotFound'
import ProtectedRoute from './router/ProtectedRoute'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import CasesList from './routes/CasesList'
import CaseForm from './routes/CaseForm'
import CaseDetail from './routes/CaseDetail'
import Sectors from './routes/Catalogs/Sectors.tsx'
import SectorDetail from './routes/Catalogs/SectorDetail.tsx'
import SectorEdit from './routes/Catalogs/SectorEdit.tsx'
import Staff from './routes/Catalogs/Staff.tsx'
import StaffDetail from './routes/Catalogs/StaffDetail.tsx'
import StaffEdit from './routes/Catalogs/StaffEdit.tsx'
import SeedPage from './routes/Dev/Seed'
import Metrics from './routes/metrics/Metrics'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/cases" replace /> },
          { path: 'cases', element: <CasesList /> },
          { path: 'cases/new', element: <CaseForm /> },
          { path: 'cases/:id', element: <CaseDetail /> },
          { path: 'cases/:id/edit', element: <CaseForm /> },
          { path: 'catalogs/sectors', element: <Sectors /> },
          { path: 'catalogs/sectors/:id', element: <SectorDetail /> },
          { path: 'catalogs/sectors/:id/edit', element: <SectorEdit /> },
          { path: 'catalogs/staff', element: <Staff /> },
          { path: 'catalogs/staff/:id', element: <StaffDetail /> },
          { path: 'catalogs/staff/:id/edit', element: <StaffEdit /> },
          { path: 'metrics', element: <Metrics /> },
          { path: 'dev/seed', element: <SeedPage /> },
          // Alias solicitados
          { path: 'sectors', element: <Sectors /> },
          { path: 'sectors/:id', element: <SectorDetail /> },
          { path: 'staff', element: <Staff /> },
          { path: 'staff/:id', element: <StaffDetail /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
