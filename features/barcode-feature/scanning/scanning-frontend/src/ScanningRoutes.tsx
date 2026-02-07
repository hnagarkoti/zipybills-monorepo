import { Suspense } from 'react';
import { Route, Routes } from 'react-router';
import ScannerPage from './pages/ScannerPage';

/**
 * Scanning Routes - Handles all camera scanning related routes
 * This can be mounted at any path in the main app router
 */
export default function ScanningRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ScannerPage />} />
      <Route path="/scanner" element={<ScannerPage />} />
    </Routes>
  );
}
