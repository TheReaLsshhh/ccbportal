import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import apiService from './services/api';
import './news_events.css';

const NewsEvents = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState('');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isAnnouncementsVisible, setIsAnnouncementsVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isAchievementsVisible, setIsAchievementsVisible] = useState(false);

  // Scroll-based navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsTopBarVisible(false);
      } else if (currentScrollY < lastScrollY && currentScrollY < 50) {
        setIsTopBarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Intersection Observer for announcements section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAnnouncementsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const announcementsElement = document.querySelector('.announcements-grid');
    if (announcementsElement) {
      observer.observe(announcementsElement);
    }

    return () => {
      if (announcementsElement) {
        observer.unobserve(announcementsElement);
      }
    };
  }, [announcements]); // Re-run when announcements are loaded

  // Intersection Observer for calendar section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCalendarVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const calendarElement = document.querySelector('.calendar');
    if (calendarElement) {
      observer.observe(calendarElement);
    }

    return () => {
      if (calendarElement) {
        observer.unobserve(calendarElement);
      }
    };
  }, [events]); // Re-run when events are loaded

  // Intersection Observer for achievements section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAchievementsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const achievementsElement = document.querySelector('.achievements-grid');
    if (achievementsElement) {
      observer.observe(achievementsElement);
    }

    return () => {
      if (achievementsElement) {
        observer.unobserve(achievementsElement);
      }
    };
  }, [achievements]); // Re-run when achievements are loaded

  // Load announcements from API
  useEffect(() => {
    const load = async () => {
      try {
        setAnnLoading(true);
        const resp = await apiService.getAnnouncements();
        if (resp.status === 'success' && Array.isArray(resp.announcements)) {
          setAnnouncements(resp.announcements);
        } else {
          setAnnError('Failed to load announcements');
        }
      } catch (e) {
        setAnnError('Failed to load announcements');
      } finally {
        setAnnLoading(false);
      }
    };
    load();
  }, []);

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        const resp = await apiService.getEvents();
        if (resp.status === 'success' && Array.isArray(resp.events)) {
          setEvents(resp.events);
        } else {
          setEventsError('Failed to load events');
        }
      } catch (e) {
        setEventsError('Failed to load events');
      } finally {
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Load achievements from API
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setAchievementsLoading(true);
        const resp = await apiService.getAchievements();
        if (resp.status === 'success' && Array.isArray(resp.achievements)) {
          setAchievements(resp.achievements);
        } else {
          setAchievementsError('Failed to load achievements');
        }
      } catch (e) {
        setAchievementsError('Failed to load achievements');
      } finally {
        setAchievementsLoading(false);
      }
    };
    loadAchievements();
  }, []);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatEventDate = (iso) => {
    try {
      const date = new Date(iso);
      return {
        day: date.getDate().toString(),
        month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()
      };
    } catch {
      return { day: '01', month: 'JAN' };
    }
  };

  const openModal = (item) => {
    setSelectedAnnouncement(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const openEventModal = (item) => {
    setSelectedEvent(item);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const openAchievementModal = (item) => {
    setSelectedAchievement(item);
    setIsAchievementModalOpen(true);
  };

  const closeAchievementModal = () => {
    setIsAchievementModalOpen(false);
    setSelectedAchievement(null);
  };

  // Improve modal UX: close on Escape, lock background scroll
  useEffect(() => {
    if (!isModalOpen && !isEventModalOpen && !isAchievementModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
        if (isEventModalOpen) closeEventModal();
        if (isAchievementModalOpen) closeAchievementModal();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen, isEventModalOpen, isAchievementModalOpen]);

  const renderDetails = (text) => {
    if (!text) return null;
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => (
        <p key={`detail-line-${idx}`}>{line}</p>
      ));
  };

  // Calendar helpers
  const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startOfCalendar = (date) => {
    const first = startOfMonth(date);
    const day = first.getDay(); // 0=Sun ... 6=Sat
    const start = new Date(first);
    start.setDate(first.getDate() - day);
    return start;
  };
  const endOfCalendar = (date) => {
    const last = endOfMonth(date);
    const day = last.getDay();
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - day));
    return end;
  };
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monthLabel = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase();
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  const today = new Date();

  const eventsByDay = React.useMemo(() => {
    const map = {};
    for (const evt of events) {
      try {
        const d = new Date(evt.event_date);
        const key = toKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(evt);
      } catch {}
    }
    return map;
  }, [events]);

  const announcementsByDay = React.useMemo(() => {
    const map = {};
    for (const ann of announcements) {
      try {
        const d = new Date(ann.date);
        const key = toKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(ann);
      } catch {}
    }
    return map;
  }, [announcements]);

  return (
    <div className="App news-events-page">
      <Navbar isTopBarVisible={isTopBarVisible} />
      
      {/* News & Events Hero Section */}
      <section className={`news-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">News & Events</h1>
            <p className="hero-subtitle">Stay updated with the latest happenings at City College of Bayawan</p>
            <p className="hero-motto">Discover our achievements, upcoming events, and important announcements</p>
          </div>
        </div>
      </section>

      {/* News & Events Section */}
      <section className="section news-section">
        <div className="container">
          <div className="news-content">
            
            {/* Announcements Section */}
            <div className="announcements-section">
              <h2>Announcements</h2>
              {annLoading ? (
                <div className="loading-container"><div className="loading-spinner"></div><p>Loading announcements...</p></div>
              ) : annError ? (
                <div className="error-container"><p className="error-message">{annError}</p></div>
              ) : (
                <div className={`announcements-grid ${isAnnouncementsVisible ? 'fade-in-visible' : ''}`}>
                  {announcements.map(item => (
                    <div key={item.id} className="announcement-item">
                      <div className="announcement-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div className="announcement-content">
                        <h4>{item.title}</h4>
                        <p className="announcement-date">{formatDate(item.date)}</p>
                        <p>{item.body}</p>
                        <button className="read-more" onClick={() => openModal(item)}>Read More</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* School Events and Activities Section */}
            <div className="events-section">
              <h2>School Events and Activities Calendar</h2>
              {eventsLoading ? (
                <div className="loading-container"><div className="loading-spinner"></div><p>Loading events...</p></div>
              ) : eventsError ? (
                <div className="error-container"><p className="error-message">{eventsError}</p></div>
              ) : (
                <div className={`calendar ${isCalendarVisible ? 'fade-in-visible' : ''}`}>
                  <div className="calendar-header">
                    <button
                      className="cal-nav"
                      aria-label="Previous Month"
                      onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1))}
                    >
                      ‹
                    </button>
                    <div className="cal-title">{monthLabel(calendarCursor)}</div>
                    <button
                      className="cal-nav"
                      aria-label="Next Month"
                      onClick={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1))}
                    >
                      ›
                    </button>
                    <button
                      className="cal-today"
                      aria-label="Go to Today"
                      onClick={() => setCalendarCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
                    >
                      Today
                    </button>
                  </div>
                  <div className="calendar-grid">
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => (
                      <div key={d} className="cal-weekday">{d}</div>
                    ))}
                    {(function() {
                      const cells = [];
                      const start = startOfCalendar(calendarCursor);
                      const end = endOfCalendar(calendarCursor);
                      const iter = new Date(start);
                      while (iter <= end) {
                        const inMonth = iter.getMonth() === calendarCursor.getMonth();
                        const key = toKey(iter);
                        const dayEvents = eventsByDay[key] || [];
                        const dayAnns = announcementsByDay[key] || [];
                        const cellDate = new Date(iter);
                        const isToday = isSameDay(cellDate, today);
                        const weekend = isWeekend(cellDate);
                        cells.push(
                          <div key={key} className={`cal-cell ${inMonth ? '' : 'dim'} ${weekend ? 'weekend' : ''} ${isToday ? 'today' : ''} ${dayEvents.length ? 'has-events' : ''} ${dayAnns.length ? 'has-anns' : ''}`}>
                            <div className="cal-date">{cellDate.getDate()}</div>
                            <div className="cal-dots" aria-hidden="true">
                              {[...Array(Math.min(dayEvents.length, 3))].map((_, i) => (
                                <span key={`e-dot-${i}`} className="dot dot-event" />
                              ))}
                              {[...Array(Math.min(dayAnns.length, 3))].map((_, i) => (
                                <span key={`a-dot-${i}`} className="dot dot-ann" />
                              ))}
                            </div>
                            <div className="cal-events">
                              {dayEvents.slice(0,3).map((evt) => (
                                <button key={evt.id} className="cal-event" onClick={() => openEventModal(evt)} title={evt.title}>
                                  {evt.title}
                                </button>
                              ))}
                              {dayAnns.slice(0,3).map((ann) => (
                                <button key={`a-${ann.id}`} className="cal-ann" onClick={() => openModal(ann)} title={ann.title}>
                                  {ann.title}
                                </button>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="cal-more">+{dayEvents.length - 3} more</div>
                              )}
                              {dayAnns.length > 3 && (
                                <div className="cal-more">+{dayAnns.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        );
                        iter.setDate(iter.getDate() + 1);
                      }
                      return cells;
                    })()}
                  </div>
                  <div className="cal-legend" aria-hidden="true">
                    <div className="legend-item"><span className="legend-dot dot-event"></span> Event</div>
                    <div className="legend-item"><span className="legend-dot dot-ann"></span> Announcement</div>
                    <div className="legend-item"><span className="legend-chip chip-today">Today</span></div>
                    <div className="legend-item"><span className="legend-chip chip-weekend">Weekend</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Achievements and Press Releases Section */}
            <div className="achievements-section">
              <h2>Achievements and Press Releases</h2>
              {achievementsLoading ? (
                <div className="loading-container"><div className="loading-spinner"></div><p>Loading achievements...</p></div>
              ) : achievementsError ? (
                <div className="error-container"><p className="error-message">{achievementsError}</p></div>
              ) : (
                <div className={`achievements-grid ${isAchievementsVisible ? 'fade-in-visible' : ''}`}>
                  {achievements.map(achievement => (
                    <div key={achievement.id} className="achievement-item">
                      <div className="achievement-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div className="achievement-content">
                        <h4>{achievement.title}</h4>
                        <p className="achievement-date">{achievement.formatted_date}</p>
                        {achievement.category && <p className="achievement-category">🏆 {achievement.category}</p>}
                        <p>{achievement.description}</p>
                        <button className="read-more" onClick={() => openAchievementModal(achievement)}>Read Full Story</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="footer-section-news-events">
        <Footer />
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Announcement Modal */}
      {isModalOpen && selectedAnnouncement && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={closeModal}>×</button>
            <h3 className="modal-title">{selectedAnnouncement.title}</h3>
            <p className="modal-date">{formatDate(selectedAnnouncement.date)}</p>
            <div className="modal-body">
              {renderDetails(
                selectedAnnouncement.details && selectedAnnouncement.details.trim()
                  ? selectedAnnouncement.details
                  : selectedAnnouncement.body
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {isEventModalOpen && selectedEvent && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeEventModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={closeEventModal}>×</button>
            <h3 className="modal-title">{selectedEvent.title}</h3>
            <p className="modal-date">{formatDate(selectedEvent.event_date)}</p>
            <p className="modal-time">{selectedEvent.formatted_time}</p>
            {selectedEvent.location && <p className="modal-location">📍 {selectedEvent.location}</p>}
            <div className="modal-body">
              {renderDetails(
                selectedEvent.details && selectedEvent.details.trim()
                  ? selectedEvent.details
                  : selectedEvent.description
              )}
            </div>
          </div>
        </div>
      )}

      {/* Achievement Modal */}
      {isAchievementModalOpen && selectedAchievement && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeAchievementModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={closeAchievementModal}>×</button>
            <h3 className="modal-title">{selectedAchievement.title}</h3>
            <p className="modal-date">{formatDate(selectedAchievement.achievement_date)}</p>
            {selectedAchievement.category && <p className="modal-category">🏆 {selectedAchievement.category}</p>}
            <div className="modal-body">
              {renderDetails(
                selectedAchievement.details && selectedAchievement.details.trim()
                  ? selectedAchievement.details
                  : selectedAchievement.description
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsEvents;

