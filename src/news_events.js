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
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState('');
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isAnnouncementsVisible, setIsAnnouncementsVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isAchievementsVisible, setIsAchievementsVisible] = useState(false);
  const [isEventsVisible, setIsEventsVisible] = useState(false);
  const [isNewsVisible, setIsNewsVisible] = useState(false);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  const [isDateDetailModalOpen, setIsDateDetailModalOpen] = useState(false);
  const [selectedDateItems, setSelectedDateItems] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Pagination state for each section
  const [eventsDisplayCount, setEventsDisplayCount] = useState(8);
  const [newsDisplayCount, setNewsDisplayCount] = useState(8);
  const [announcementsDisplayCount, setAnnouncementsDisplayCount] = useState(8);
  const [achievementsDisplayCount, setAchievementsDisplayCount] = useState(8);
  const itemsPerPage = 8;

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

  // Intersection Observer for events section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsEventsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const eventsElement = document.querySelector('.events-grid');
    if (eventsElement) {
      observer.observe(eventsElement);
    }

    return () => {
      if (eventsElement) {
        observer.unobserve(eventsElement);
      }
    };
  }, [events]);

  // Intersection Observer for news section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsNewsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const newsElement = document.querySelector('.news-grid');
    if (newsElement) {
      observer.observe(newsElement);
    }

    return () => {
      if (newsElement) {
        observer.unobserve(newsElement);
      }
    };
  }, [news]);

  // Load announcements from API
  useEffect(() => {
    const load = async () => {
      try {
        setAnnLoading(true);
        const resp = await apiService.getAnnouncements();
        if (resp.status === 'success' && Array.isArray(resp.announcements)) {
          setAnnouncements(resp.announcements);
          setAnnouncementsDisplayCount(itemsPerPage); // Reset display count when new data loads
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
          setEventsDisplayCount(itemsPerPage); // Reset display count when new data loads
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
          setAchievementsDisplayCount(itemsPerPage); // Reset display count when new data loads
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

  // Load news from API
  useEffect(() => {
    const loadNews = async () => {
      try {
        setNewsLoading(true);
        const resp = await apiService.getNews();
        if (resp.status === 'success' && Array.isArray(resp.news)) {
          setNews(resp.news);
          setNewsDisplayCount(itemsPerPage); // Reset display count when new data loads
        } else {
          setNewsError('Failed to load news');
        }
      } catch (e) {
        setNewsError('Failed to load news');
      } finally {
        setNewsLoading(false);
      }
    };
    loadNews();
  }, []);

  // Open modal via deep-link query params
  // Supported:
  //   ?newsId=123
  //   ?eventId=123
  //   ?announcementId=123
  //   ?achievementId=123
  useEffect(() => {
    if (deepLinkHandled) return;
    const params = new URLSearchParams(window.location.search);
    const newsId = params.get('newsId');
    const eventId = params.get('eventId');
    const announcementId = params.get('announcementId');
    const achievementId = params.get('achievementId');

    if (eventId && events.length > 0) {
      const item = events.find((e) => String(e.id) === eventId || `e-${e.id}` === eventId);
      if (item) {
        openEventModal(item);
        setDeepLinkHandled(true);
        return;
      }
    }

    if (announcementId && announcements.length > 0) {
      const item = announcements.find((a) => String(a.id) === announcementId || `a-${a.id}` === announcementId);
      if (item) {
        openModal(item);
        setDeepLinkHandled(true);
        return;
      }
    }

    if (achievementId && achievements.length > 0) {
      const item = achievements.find((ach) => String(ach.id) === achievementId || `c-${ach.id}` === achievementId || `ach-${ach.id}` === achievementId);
      if (item) {
        openAchievementModal(item);
        setDeepLinkHandled(true);
        return;
      }
    }

    if (newsId && news.length > 0) {
      const item = news.find((n) => String(n.id) === newsId || `n-${n.id}` === newsId);
      if (item) {
        openNewsModal(item);
        setDeepLinkHandled(true);
        return;
      }
    }
  }, [events, announcements, achievements, news, deepLinkHandled]);

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

  const openNewsModal = (item) => {
    setSelectedNews(item);
    setIsNewsModalOpen(true);
  };

  const closeNewsModal = () => {
    setIsNewsModalOpen(false);
    setSelectedNews(null);
  };

  const openDateDetailModal = (date, events, announcements, news, achievements) => {
    setSelectedDate(date);
    setSelectedDateItems({
      events: events || [],
      announcements: announcements || [],
      news: news || [],
      achievements: achievements || []
    });
    setIsDateDetailModalOpen(true);
  };

  const closeDateDetailModal = () => {
    setIsDateDetailModalOpen(false);
    setSelectedDate(null);
    setSelectedDateItems(null);
  };

  // Pagination handlers
  const loadMoreEvents = () => {
    setEventsDisplayCount(prev => prev + itemsPerPage);
  };

  const loadMoreNews = () => {
    setNewsDisplayCount(prev => prev + itemsPerPage);
  };

  const loadMoreAnnouncements = () => {
    setAnnouncementsDisplayCount(prev => prev + itemsPerPage);
  };

  const loadMoreAchievements = () => {
    setAchievementsDisplayCount(prev => prev + itemsPerPage);
  };

  // Improve modal UX: close on Escape, lock background scroll
  useEffect(() => {
    if (!isModalOpen && !isEventModalOpen && !isAchievementModalOpen && !isNewsModalOpen && !isDateDetailModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
        if (isEventModalOpen) closeEventModal();
        if (isAchievementModalOpen) closeAchievementModal();
        if (isNewsModalOpen) closeNewsModal();
        if (isDateDetailModalOpen) closeDateDetailModal();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen, isEventModalOpen, isAchievementModalOpen, isNewsModalOpen, isDateDetailModalOpen]);

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

  const newsByDay = React.useMemo(() => {
    const map = {};
    for (const newsItem of news) {
      try {
        const d = new Date(newsItem.date);
        const key = toKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(newsItem);
      } catch {}
    }
    return map;
  }, [news]);

  const achievementsByDay = React.useMemo(() => {
    const map = {};
    for (const achievement of achievements) {
      try {
        const d = new Date(achievement.achievement_date);
        const key = toKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(achievement);
      } catch {}
    }
    return map;
  }, [achievements]);

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
            
            {/* Two-column layout: Calendar on left, Content on right */}
            <div className="news-layout-wrapper">
              {/* Calendar Events Section - Left Side */}
              <div className="calendar-events">
                <h2>Campus Calendar</h2>
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
                          const dayNews = newsByDay[key] || [];
                          const dayAchievements = achievementsByDay[key] || [];
                          const cellDate = new Date(iter);
                          const isToday = isSameDay(cellDate, today);
                          const weekend = isWeekend(cellDate);
                          const totalItems = dayEvents.length + dayAnns.length + dayNews.length + dayAchievements.length;
                          const hasContent = totalItems > 0;
                          cells.push(
                            <div 
                              key={key} 
                              className={`cal-cell ${inMonth ? '' : 'dim'} ${weekend ? 'weekend' : ''} ${isToday ? 'today' : ''} ${dayEvents.length ? 'has-events' : ''} ${dayAnns.length ? 'has-anns' : ''} ${dayNews.length ? 'has-news' : ''} ${dayAchievements.length ? 'has-achievements' : ''} ${hasContent ? 'has-content clickable' : ''}`}
                              onClick={hasContent ? () => openDateDetailModal(cellDate, dayEvents, dayAnns, dayNews, dayAchievements) : undefined}
                              style={hasContent ? { cursor: 'pointer' } : {}}
                            >
                              {hasContent && (
                                <div className="cal-cell-popup" onClick={(e) => e.stopPropagation()}>
                                  {dayEvents.length > 0 && (
                                    <div className="popup-section">
                                      <div className="popup-type">Events</div>
                                      {dayEvents.map((evt) => (
                                        <button 
                                          key={evt.id} 
                                          className="popup-title clickable-title" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            closeDateDetailModal();
                                            openEventModal(evt);
                                          }}
                                        >
                                          {evt.title}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {dayNews.length > 0 && (
                                    <div className="popup-section">
                                      <div className="popup-type">News</div>
                                      {dayNews.map((newsItem) => (
                                        <button 
                                          key={newsItem.id} 
                                          className="popup-title clickable-title" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            closeDateDetailModal();
                                            openNewsModal(newsItem);
                                          }}
                                        >
                                          {newsItem.title}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {dayAnns.length > 0 && (
                                    <div className="popup-section">
                                      <div className="popup-type">Announcements</div>
                                      {dayAnns.map((ann) => (
                                        <button 
                                          key={ann.id} 
                                          className="popup-title clickable-title" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            closeDateDetailModal();
                                            openModal(ann);
                                          }}
                                        >
                                          {ann.title}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {dayAchievements.length > 0 && (
                                    <div className="popup-section">
                                      <div className="popup-type">Achievements</div>
                                      {dayAchievements.map((achievement) => (
                                        <button 
                                          key={achievement.id} 
                                          className="popup-title clickable-title" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            closeDateDetailModal();
                                            openAchievementModal(achievement);
                                          }}
                                        >
                                          {achievement.title}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="cal-date">{cellDate.getDate()}</div>
                              <div className="cal-dots" aria-hidden="true">
                                {dayEvents.length > 0 && (
                                  <span className="dot dot-event" title={`${dayEvents.length} event(s)`} />
                                )}
                                {dayAnns.length > 0 && (
                                  <span className="dot dot-ann" title={`${dayAnns.length} announcement(s)`} />
                                )}
                                {dayNews.length > 0 && (
                                  <span className="dot dot-news" title={`${dayNews.length} news item(s)`} />
                                )}
                                {dayAchievements.length > 0 && (
                                  <span className="dot dot-achievement" title={`${dayAchievements.length} achievement(s)`} />
                                )}
                              </div>
                              <div className="cal-events">
                                {dayEvents.slice(0,2).map((evt) => (
                                  <button key={evt.id} className="cal-event" onClick={() => openEventModal(evt)} title={evt.title}>
                                    {evt.title}
                                  </button>
                                ))}
                                {dayAnns.slice(0,2).map((ann) => (
                                  <button key={`a-${ann.id}`} className="cal-ann" onClick={() => openModal(ann)} title={ann.title}>
                                    {ann.title}
                                  </button>
                                ))}
                                {dayNews.slice(0,2).map((newsItem) => (
                                  <button key={`n-${newsItem.id}`} className="cal-news" onClick={() => openNewsModal(newsItem)} title={newsItem.title}>
                                    {newsItem.title}
                                  </button>
                                ))}
                                {dayAchievements.slice(0,2).map((achievement) => (
                                  <button key={`ach-${achievement.id}`} className="cal-achievement" onClick={() => openAchievementModal(achievement)} title={achievement.title}>
                                    {achievement.title}
                                  </button>
                                ))}
                                {totalItems > 8 && (
                                  <div className="cal-more">+{totalItems - 8} more</div>
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
                      <div className="legend-item"><span className="legend-dot dot-news"></span> News</div>
                      <div className="legend-item"><span className="legend-dot dot-achievement"></span> Achievement</div>
                      <div className="legend-item"><span className="legend-chip chip-today">Today</span></div>
                      <div className="legend-item"><span className="legend-chip chip-weekend">Weekend</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side Content */}
              <div className="news-right-content">
                {/* Events Section */}
                <div className="events-section">
                  <h2>Events</h2>
                  {eventsLoading ? (
                    <div className="loading-container"><div className="loading-spinner"></div><p>Loading events...</p></div>
                  ) : eventsError ? (
                    <div className="error-container"><p className="error-message">{eventsError}</p></div>
                  ) : (
                    <>
                      <div className={`events-grid ${isEventsVisible ? 'fade-in-visible' : ''}`}>
                        {events.slice(0, eventsDisplayCount).map(event => (
                          <div key={event.id} className="event-item">
                            {event.image ? (
                              <div className="event-image-wrapper">
                                <img src={event.image} alt={event.title} />
                                <div className="event-date-overlay">
                                  <div className="event-date">
                                    <span className="day">{formatEventDate(event.event_date).day}</span>
                                    <span className="month">{formatEventDate(event.event_date).month}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="event-image">
                                <div className="event-date">
                                  <span className="day">{formatEventDate(event.event_date).day}</span>
                                  <span className="month">{formatEventDate(event.event_date).month}</span>
                                </div>
                              </div>
                            )}
                            <div className="event-content">
                              <h4>{event.title}</h4>
                              <p className="event-time">{event.formatted_time || `${event.start_time || ''} - ${event.end_time || ''}`}</p>
                              {event.location && <p className="event-location">📍 {event.location}</p>}
                              <p>{event.description}</p>
                              <button className="event-link" onClick={() => openEventModal(event)}>Read More</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {events.length > eventsDisplayCount && (
                        <div className="pagination-controls">
                          <button className="load-more-btn" onClick={loadMoreEvents}>
                            Load More Events ({events.length - eventsDisplayCount} remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* News Section */}
                <div className="news-section-content">
                  <h2>News</h2>
                  {newsLoading ? (
                    <div className="loading-container"><div className="loading-spinner"></div><p>Loading news...</p></div>
                  ) : newsError ? (
                    <div className="error-container"><p className="error-message">{newsError}</p></div>
                  ) : (
                    <>
                      <div className={`news-grid ${isNewsVisible ? 'fade-in-visible' : ''}`}>
                        {news.slice(0, newsDisplayCount).map(item => (
                          <div key={item.id} className="news-item">
                            {item.image && (
                              <div className="news-image-wrapper">
                                <img src={item.image} alt={item.title} />
                              </div>
                            )}
                            <div className="news-item-content">
                              {!item.image && (
                                <div className="news-icon">
                                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                  </svg>
                                </div>
                              )}
                              <h4>{item.title}</h4>
                              <p className="news-date">{formatDate(item.date)}</p>
                              <p>{item.body}</p>
                              <button className="read-more" onClick={() => openNewsModal(item)}>Read More</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {news.length > newsDisplayCount && (
                        <div className="pagination-controls">
                          <button className="load-more-btn" onClick={loadMoreNews}>
                            Load More News ({news.length - newsDisplayCount} remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Announcements Section */}
                <div className="announcements-section">
                  <h2>Announcements</h2>
                  {annLoading ? (
                    <div className="loading-container"><div className="loading-spinner"></div><p>Loading announcements...</p></div>
                  ) : annError ? (
                    <div className="error-container"><p className="error-message">{annError}</p></div>
                  ) : (
                    <>
                      <div className={`announcements-grid ${isAnnouncementsVisible ? 'fade-in-visible' : ''}`}>
                        {announcements.slice(0, announcementsDisplayCount).map(item => (
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
                      {announcements.length > announcementsDisplayCount && (
                        <div className="pagination-controls">
                          <button className="load-more-btn" onClick={loadMoreAnnouncements}>
                            Load More Announcements ({announcements.length - announcementsDisplayCount} remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Achievements Section */}
                <div className="achievements-section">
                  <h2>Achievements</h2>
                  {achievementsLoading ? (
                    <div className="loading-container"><div className="loading-spinner"></div><p>Loading achievements...</p></div>
                  ) : achievementsError ? (
                    <div className="error-container"><p className="error-message">{achievementsError}</p></div>
                  ) : (
                    <>
                      <div className={`achievements-grid ${isAchievementsVisible ? 'fade-in-visible' : ''}`}>
                        {achievements.slice(0, achievementsDisplayCount).map(achievement => (
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
                      {achievements.length > achievementsDisplayCount && (
                        <div className="pagination-controls">
                          <button className="load-more-btn" onClick={loadMoreAchievements}>
                            Load More Achievements ({achievements.length - achievementsDisplayCount} remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
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
            {selectedAnnouncement.image && (
              <div className="modal-image-wrapper">
                <img src={selectedAnnouncement.image} alt={selectedAnnouncement.title} />
              </div>
            )}
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
            {selectedEvent.image && (
              <div className="modal-image-wrapper">
                <img src={selectedEvent.image} alt={selectedEvent.title} />
              </div>
            )}
            <h3 className="modal-title">{selectedEvent.title}</h3>
            <p className="modal-date">{formatDate(selectedEvent.event_date)}</p>
            {selectedEvent.formatted_time && <p className="modal-time">{selectedEvent.formatted_time}</p>}
            {!selectedEvent.formatted_time && selectedEvent.start_time && selectedEvent.end_time && (
              <p className="modal-time">{selectedEvent.start_time} - {selectedEvent.end_time}</p>
            )}
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
            {selectedAchievement.image && (
              <div className="modal-image-wrapper">
                <img src={selectedAchievement.image} alt={selectedAchievement.title} />
              </div>
            )}
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

      {/* News Modal */}
      {isNewsModalOpen && selectedNews && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeNewsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={closeNewsModal}>×</button>
            {selectedNews.image && (
              <div className="modal-image-wrapper">
                <img src={selectedNews.image} alt={selectedNews.title} />
              </div>
            )}
            <h3 className="modal-title">{selectedNews.title}</h3>
            <p className="modal-date">{formatDate(selectedNews.date)}</p>
            <div className="modal-body">
              {renderDetails(
                selectedNews.details && selectedNews.details.trim()
                  ? selectedNews.details
                  : selectedNews.body
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Detail Modal */}
      {isDateDetailModalOpen && selectedDateItems && selectedDate && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeDateDetailModal}>
          <div className="modal-content date-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={closeDateDetailModal}>×</button>
            <h3 className="modal-title">Date: {formatDate(selectedDate.toISOString())}</h3>
            <div className="date-detail-content">
              {selectedDateItems.events.length > 0 && (
                <div className="date-detail-section">
                  <h4 className="date-detail-section-title">
                    <span className="date-detail-icon event-icon">📅</span>
                    Events ({selectedDateItems.events.length})
                  </h4>
                  <div className="date-detail-items">
                    {selectedDateItems.events.map((evt) => (
                      <button
                        key={evt.id}
                        className="date-detail-item event-item-btn"
                        onClick={() => {
                          closeDateDetailModal();
                          openEventModal(evt);
                        }}
                      >
                        <span className="item-type">Event:</span>
                        <span className="item-title">{evt.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateItems.news.length > 0 && (
                <div className="date-detail-section">
                  <h4 className="date-detail-section-title">
                    <span className="date-detail-icon news-icon">📰</span>
                    News ({selectedDateItems.news.length})
                  </h4>
                  <div className="date-detail-items">
                    {selectedDateItems.news.map((newsItem) => (
                      <button
                        key={newsItem.id}
                        className="date-detail-item news-item-btn"
                        onClick={() => {
                          closeDateDetailModal();
                          openNewsModal(newsItem);
                        }}
                      >
                        <span className="item-type">News:</span>
                        <span className="item-title">{newsItem.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateItems.announcements.length > 0 && (
                <div className="date-detail-section">
                  <h4 className="date-detail-section-title">
                    <span className="date-detail-icon announcement-icon">📢</span>
                    Announcements ({selectedDateItems.announcements.length})
                  </h4>
                  <div className="date-detail-items">
                    {selectedDateItems.announcements.map((ann) => (
                      <button
                        key={ann.id}
                        className="date-detail-item announcement-item-btn"
                        onClick={() => {
                          closeDateDetailModal();
                          openModal(ann);
                        }}
                      >
                        <span className="item-type">Announcement:</span>
                        <span className="item-title">{ann.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateItems.achievements.length > 0 && (
                <div className="date-detail-section">
                  <h4 className="date-detail-section-title">
                    <span className="date-detail-icon achievement-icon">🏆</span>
                    Achievements ({selectedDateItems.achievements.length})
                  </h4>
                  <div className="date-detail-items">
                    {selectedDateItems.achievements.map((achievement) => (
                      <button
                        key={achievement.id}
                        className="date-detail-item achievement-item-btn"
                        onClick={() => {
                          closeDateDetailModal();
                          openAchievementModal(achievement);
                        }}
                      >
                        <span className="item-type">Achievement:</span>
                        <span className="item-title">{achievement.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateItems.events.length === 0 && 
               selectedDateItems.news.length === 0 && 
               selectedDateItems.announcements.length === 0 && 
               selectedDateItems.achievements.length === 0 && (
                <div className="date-detail-empty">
                  <p>No items found for this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsEvents;

