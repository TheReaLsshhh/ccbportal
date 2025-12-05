import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import AcademicPrograms from './academicprogram';
import Students from './students';
import FacultyStaff from './faculty_staff';
import AboutUs from './aboutus';
import Admissions from './admissions';
import NewsEvents from './news_events';
import Downloads from './downloads';
import ContactUs from './contactuss';
import CCBlogo from './CCBlogo';
import Admin from './admin/admin';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;