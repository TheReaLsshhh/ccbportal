import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import PerformanceDashboard from './components/PerformanceDashboard';
import Admin from './admin/admin';
import './App.css';

// Enhanced code splitting with prefetching
const HomePage = lazy(() => import(
  /* webpackChunkName: "home" */ 
  /* webpackPrefetch: true */
  './HomePage'
));
const AcademicPrograms = lazy(() => import(
  /* webpackChunkName: "academics" */
  './academicprogram'
));
const Students = lazy(() => import(
  /* webpackChunkName: "students" */
  './students'
));
const FacultyStaff = lazy(() => import(
  /* webpackChunkName: "faculty" */
  './faculty_staff'
));
const AboutUs = lazy(() => import(
  /* webpackChunkName: "about" */
  './aboutus'
));
const Admissions = lazy(() => import(
  /* webpackChunkName: "admissions" */
  './admissions'
));
const NewsEvents = lazy(() => import(
  /* webpackChunkName: "news" */
  './news_events'
));
const Downloads = lazy(() => import(
  /* webpackChunkName: "downloads" */
  './downloads'
));
const ContactUs = lazy(() => import(
  /* webpackChunkName: "contact" */
  './contactuss'
));
const CCBlogo = lazy(() => import(
  /* webpackChunkName: "logo" */
  './CCBlogo'
));

// Enhanced loading component with skeleton
const PageLoader = ({ pageName }) => (
  <LoadingSpinner message={`Loading ${pageName}...`} />
);

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <Suspense fallback={<PageLoader pageName="application" />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<Admin />} />
              <Route 
                path="/academics" 
                element={
                  <Suspense fallback={<PageLoader pageName="Academic Programs" />}>
                    <AcademicPrograms />
                  </Suspense>
                } 
              />
              <Route 
                path="/students" 
                element={
                  <Suspense fallback={<PageLoader pageName="Students" />}>
                    <Students />
                  </Suspense>
                } 
              />
              <Route 
                path="/faculty" 
                element={
                  <Suspense fallback={<PageLoader pageName="Faculty & Staff" />}>
                    <FacultyStaff />
                  </Suspense>
                } 
              />
              <Route 
                path="/about" 
                element={
                  <Suspense fallback={<PageLoader pageName="About Us" />}>
                    <AboutUs />
                  </Suspense>
                } 
              />
              <Route 
                path="/admissions" 
                element={
                  <Suspense fallback={<PageLoader pageName="Admissions" />}>
                    <Admissions />
                  </Suspense>
                } 
              />
              <Route 
                path="/news" 
                element={
                  <Suspense fallback={<PageLoader pageName="News & Events" />}>
                    <NewsEvents />
                  </Suspense>
                } 
              />
              <Route 
                path="/downloads" 
                element={
                  <Suspense fallback={<PageLoader pageName="Downloads" />}>
                    <Downloads />
                  </Suspense>
                } 
              />
              <Route 
                path="/contact" 
                element={
                  <Suspense fallback={<PageLoader pageName="Contact" />}>
                    <ContactUs />
                  </Suspense>
                } 
              />
              <Route 
                path="/ccb-logo" 
                element={
                  <Suspense fallback={<PageLoader pageName="Logo" />}>
                    <CCBlogo />
                  </Suspense>
                } 
              />
            </Routes>
          </Suspense>
          {/* Performance Dashboard for Development */}
          <PerformanceDashboard />
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
