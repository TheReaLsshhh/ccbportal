import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { DeferredNavRoutes } from './components/DeferredNavRoutes';
import PerformanceDashboard from './components/PerformanceDashboard';
import Admin from './admin/admin';
import './App.css';

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

function lazyPage(LazyComponent, pageName) {
  return (
    <Suspense fallback={<LoadingSpinner message={`Loading ${pageName}...`} />}>
      <LazyComponent />
    </Suspense>
  );
}

const homeElement = lazyPage(HomePage, 'home');
const academicsElement = lazyPage(AcademicPrograms, 'Academic Programs');
const studentsElement = lazyPage(Students, 'Students');
const facultyElement = lazyPage(FacultyStaff, 'Faculty & Staff');
const aboutElement = lazyPage(AboutUs, 'About Us');
const admissionsElement = lazyPage(Admissions, 'Admissions');
const newsElement = lazyPage(NewsEvents, 'News & Events');
const downloadsElement = lazyPage(Downloads, 'Downloads');
const contactElement = lazyPage(ContactUs, 'Contact');
const logoElement = lazyPage(CCBlogo, 'Logo');

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <DeferredNavRoutes>
            <Route path="/" element={homeElement} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/academics" element={academicsElement} />
            <Route path="/students" element={studentsElement} />
            <Route path="/faculty" element={facultyElement} />
            <Route path="/about" element={aboutElement} />
            <Route path="/admissions" element={admissionsElement} />
            <Route path="/news" element={newsElement} />
            <Route path="/downloads" element={downloadsElement} />
            <Route path="/contact" element={contactElement} />
            <Route path="/ccb-logo" element={logoElement} />
          </DeferredNavRoutes>
          <PerformanceDashboard />
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
