import { useState, useLayoutEffect, useTransition } from 'react';
import { useLocation, Routes } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

function pendingMessageForPath(pathname) {
  const labels = {
    '/': 'home',
    '/academics': 'Academic Programs',
    '/students': 'Students',
    '/faculty': 'Faculty & Staff',
    '/about': 'About Us',
    '/admissions': 'Admissions',
    '/news': 'News & Events',
    '/downloads': 'Downloads',
    '/contact': 'Contact',
    '/ccb-logo': 'Logo',
  };
  const key = labels[pathname];
  return key ? `Loading ${key}...` : 'Loading...';
}

/**
 * Keeps the previous route on screen while the next lazy chunk loads,
 * and surfaces a full-viewport blurred overlay via LoadingSpinner when a
 * navigation is in progress (React 18 useTransition + deferred location).
 */
export function DeferredNavRoutes({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isPending, startTransition] = useTransition();

  useLayoutEffect(() => {
    startTransition(() => {
      setDisplayLocation((prev) => {
        if (
          prev.pathname === location.pathname &&
          prev.search === location.search &&
          prev.hash === location.hash
        ) {
          return prev;
        }
        return location;
      });
    });
  }, [location]);

  return (
    <>
      <Routes location={displayLocation}>{children}</Routes>
      {isPending ? (
        <LoadingSpinner message={pendingMessageForPath(location.pathname)} />
      ) : null}
    </>
  );
}
