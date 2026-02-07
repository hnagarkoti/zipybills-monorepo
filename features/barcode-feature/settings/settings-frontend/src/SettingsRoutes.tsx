import { Route, Routes } from 'react-router';
import SettingsPage from './pages/SettingsPage';

export default function SettingsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SettingsPage />} />
    </Routes>
  );
}
