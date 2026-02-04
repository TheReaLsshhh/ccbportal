import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import Admin from './admin/admin';
const HomePage = lazy(() => import('./HomePage'));
const AcademicPrograms = lazy(() => import('./academicprogram'));
const Students = lazy(() => import('./students'));
const FacultyStaff = lazy(() => import('./faculty_staff'));
const AboutUs = lazy(() => import('./aboutus'));
const Admissions = lazy(() => import('./admissions'));
const NewsEvents = lazy(() => import('./news_events'));
const Downloads = lazy(() => import('./downloads'));
const ContactUs = lazy(() => import('./contactuss'));
const CCBlogo = lazy(() => import('./CCBlogo'));

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <Suspense fallback={<div style={{padding:'2rem',textAlign:'center'}}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/academics" element={<AcademicPrograms />} />
            <Route path="/students" element={<Students />} />
            <Route path="/faculty" element={<FacultyStaff />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/news" element={<NewsEvents />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/ccb-logo" element={<CCBlogo />} />
          </Routes>
          </Suspense>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
