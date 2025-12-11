import React, { useState, useEffect } from "react";
import "./HomePage.css";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import ScrollToTop from "./components/ScrollToTop";
import apiService from "./services/api";
import audioManager from "./services/audioManager";

const HomePage = () => {
  // State for responsive behavior
  const [isMobile, setIsMobile] = useState(false);
  const [showAudioButton, setShowAudioButton] = useState(false);

  // Animation states
  const [isFeaturesGridVisible, setIsFeaturesGridVisible] = useState(false);
  const [isCtaButtonsVisible, setIsCtaButtonsVisible] = useState(false);

  // Carousel state for news section
  const [currentNewsPage, setCurrentNewsPage] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right'); // 'left' or 'right'

  // Initialize audio on component mount
  useEffect(() => {
    // Reset and initialize the global audio manager for fresh playback
    audioManager.destroy();
    audioManager.init();

    // Check if we need to show audio button for mobile
    if (audioManager.isAudioAvailableOnMobile()) {
      setShowAudioButton(true);
    }
  }, []);

  // Check if device is mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dynamic Latest News & Updates (Announcements + Events + Achievements)
  const [newsData, setNewsData] = useState([]);
  const [newsError, setNewsError] = useState("");
  const [newsLoading, setNewsLoading] = useState(true);

  // Reset carousel to first page when news data changes
  useEffect(() => {
    setCurrentNewsPage(0);
  }, [newsData.length]);

  // Auto-play carousel
  useEffect(() => {
    const itemsPerPage = 3;
    const totalPages = Math.ceil(newsData.length / itemsPerPage);
    const showCarousel = newsData.length > itemsPerPage;
    
    if (!showCarousel || isCarouselPaused) return;

    const interval = setInterval(() => {
      setSlideDirection('left'); // Auto-advance slides left
      setCurrentNewsPage((prev) => (prev + 1) % totalPages);
    }, 5000); // Change page every 5 seconds

    return () => clearInterval(interval);
  }, [newsData.length, isCarouselPaused]);


  // Load announcements, events, achievements, and news for carousel
  useEffect(() => {
    const loadAll = async () => {
      try {
        setNewsLoading(true);
        const [annRes, evtRes, achRes, newsRes] = await Promise.all([
          apiService.getAnnouncements(),
          apiService.getEvents(),
          apiService.getAchievements(),
          apiService.getNews(),
        ]);

        const annsAll =
          annRes.status === "success" && Array.isArray(annRes.announcements)
            ? annRes.announcements.map((a) => ({
                id: `a-${a.id}`,
                type: "announcement",
                badge: "Announcements",
                date: a.date,
                title: a.title,
                description:
                  (a.details && a.details.trim().length > 0
                    ? a.details
                    : a.body) || "",
                image: a.image || null,
                link: `/news?announcementId=${a.id}`,
              }))
            : [];
        const anns = annsAll
          .sort((x, y) => new Date(y.date) - new Date(x.date))
          .slice(0, 2);

        const evtsAll =
          evtRes.status === "success" && Array.isArray(evtRes.events)
            ? evtRes.events.map((e) => ({
                id: `e-${e.id}`,
                type: "event",
                badge: "School Events and Activities",
                date: e.event_date,
                title: e.title,
                description:
                  (e.details && e.details.trim().length > 0
                    ? e.details
                    : e.description) || "",
                image: e.image || null,
                link: `/news?eventId=${e.id}`,
              }))
            : [];
        const evts = evtsAll
          .sort((x, y) => new Date(y.date) - new Date(x.date))
          .slice(0, 2);

        const achsAll =
          achRes.status === "success" && Array.isArray(achRes.achievements)
            ? achRes.achievements.map((c) => ({
                id: `c-${c.id}`,
                type: "achievement",
                badge: "Achievements and Press Releases",
                date: c.achievement_date,
                title: c.title,
                description:
                  (c.details && c.details.trim().length > 0
                    ? c.details
                    : c.description) || "",
                image: c.image || null,
                link: `/news?achievementId=${c.id}`,
              }))
            : [];
        const achs = achsAll
          .sort((x, y) => new Date(y.date) - new Date(x.date))
          .slice(0, 2);

        // Process news items
        const newsAll =
          newsRes.status === "success" && Array.isArray(newsRes.news)
            ? newsRes.news.map((n) => ({
                id: `n-${n.id}`,
                type: "news",
                badge: "News",
                date: n.date,
                title: n.title,
                description:
                  (n.details && n.details.trim().length > 0
                    ? n.details
                    : n.body) || "",
                image: n.image || null,
                link: `/news?newsId=${n.id}`,
              }))
            : [];
        
        // Combine all items and sort by date
        const allItems = [...anns, ...evts, ...achs, ...newsAll].sort(
          (x, y) => new Date(y.date) - new Date(x.date)
        );
        
        // Separate items with images from text-only items (all types can have images)
        const itemsWithImages = allItems.filter(item => item.image && item.image.trim().length > 0);
        const textOnlyItems = allItems.filter(item => !item.image || item.image.trim().length === 0);
        
        // Sort both groups by date
        itemsWithImages.sort((x, y) => new Date(y.date) - new Date(x.date));
        textOnlyItems.sort((x, y) => new Date(y.date) - new Date(x.date));
        
        // Build the layout matching the image pattern:
        // Row 1: TEXT BOX, IMAGE NEWS, TEXT BOX
        // Row 2: IMAGE NEWS, TEXT BOX, IMAGE NEWS
        // Indices: 0=TEXT, 1=IMAGE, 2=TEXT, 3=IMAGE, 4=TEXT, 5=IMAGE
        const combined = [];
        let imageIndex = 0;
        let textIndex = 0;
        
        for (let i = 0; i < 6; i++) {
          const isImageSlot = i === 1 || i === 3 || i === 5;
          
          if (isImageSlot) {
            // Image slots: prioritize news items with images
            if (imageIndex < itemsWithImages.length) {
              combined.push(itemsWithImages[imageIndex]);
              imageIndex++;
            } else if (textIndex < textOnlyItems.length) {
              // Fallback to text item if no images available
              combined.push(textOnlyItems[textIndex]);
              textIndex++;
            }
          } else {
            // Text slots: use text-only items
            if (textIndex < textOnlyItems.length) {
              combined.push(textOnlyItems[textIndex]);
              textIndex++;
            } else if (imageIndex < itemsWithImages.length) {
              // Fallback to image item if no text items available
              combined.push(itemsWithImages[imageIndex]);
              imageIndex++;
            }
          }
        }

        setNewsData(combined);
      } catch (e) {
        setNewsError("Failed to load latest news");
      } finally {
        setNewsLoading(false);
      }
    };
    loadAll();
  }, []);

  // Intersection Observer for features-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsFeaturesGridVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px", // Start animation 50px before element comes into view
      }
    );

    const featuresGridElement = document.querySelector(".features-grid");
    if (featuresGridElement) {
      observer.observe(featuresGridElement);
    }

    return () => {
      if (featuresGridElement) {
        observer.unobserve(featuresGridElement);
      }
    };
  }, []);

  // Intersection Observer for cta-buttons section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCtaButtonsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px", // Start animation 50px before element comes into view
      }
    );

    const ctaButtonsElement = document.querySelector(".cta-buttons");
    if (ctaButtonsElement) {
      observer.observe(ctaButtonsElement);
    }

    return () => {
      if (ctaButtonsElement) {
        observer.unobserve(ctaButtonsElement);
      }
    };
  }, []);

  // More realistic snowflake configs for holiday effect
  const SNOWFLAKE_COUNT = 80;
  const [snowflakes] = useState(() =>
    Array.from({ length: SNOWFLAKE_COUNT }, () => ({
      left: Math.random() * 100, // horizontal starting position (percentage)
      size: 12 + Math.random() * 12, // 12px – 24px (bigger flakes)
      duration: 8 + Math.random() * 8, // 8s – 16s
      delay: Math.random() * -20, // negative delay for continuous stream
      opacity: 0.4 + Math.random() * 0.6, // slightly transparent
      drift: (Math.random() - 0.5) * 80, // horizontal drift (-40px to 40px)
    }))
  );

  // Flickering lights configs for festive effect
  const LIGHT_COUNT = 60;
  const LIGHT_COLORS = ["#00ff00", "#0080ff", "#ff0000", "#ffff00"]; // green, blue, red, yellow
  const [lights] = useState(() =>
    Array.from({ length: LIGHT_COUNT }, () => ({
      left: Math.random() * 100, // horizontal starting position (percentage)
      size: 8 + Math.random() * 10, // 8px – 18px
      duration: 6 + Math.random() * 8, // 6s – 14s
      delay: Math.random() * -15, // negative delay for continuous stream
      color: LIGHT_COLORS[Math.floor(Math.random() * LIGHT_COLORS.length)], // random color
      drift: (Math.random() - 0.5) * 60, // horizontal drift (-30px to 30px)
      flickerSpeed: 0.3 + Math.random() * 0.4, // flicker speed (0.3s – 0.7s)
    }))
  );

  // Handle audio enable button click
  const handleEnableAudio = () => {
    audioManager.enableAudioOnMobile();
    setShowAudioButton(false);
  };

  // helpers for rendering
  const truncate = (text, maxLen) => {
    if (!text) return "";
    return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
  };

  const formatMonthYear = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  // Carousel navigation handlers
  const itemsPerPage = 3;
  const totalPages = Math.ceil(newsData.length / itemsPerPage);
  const showCarousel = newsData.length > itemsPerPage;
  
  const getCurrentPageItems = () => {
    const startIndex = currentNewsPage * itemsPerPage;
    const pageItems = newsData.slice(startIndex, startIndex + itemsPerPage);
    
    // Always return exactly 3 items - pad with empty items if needed
    const paddedItems = [...pageItems];
    while (paddedItems.length < itemsPerPage) {
      paddedItems.push(null); // Add null placeholder to maintain 3 cards
    }
    return paddedItems.slice(0, itemsPerPage); // Ensure exactly 3 items
  };

  const handleNextPage = () => {
    setIsCarouselPaused(true);
    setSlideDirection('left'); // Cards move left when going to next page
    setCurrentNewsPage((prev) => (prev + 1) % totalPages);
    // Resume auto-play after 8 seconds of user interaction
    setTimeout(() => setIsCarouselPaused(false), 8000);
  };

  const handlePrevPage = () => {
    setIsCarouselPaused(true);
    setSlideDirection('right'); // Cards move right when going to previous page
    setCurrentNewsPage((prev) => (prev - 1 + totalPages) % totalPages);
    // Resume auto-play after 8 seconds of user interaction
    setTimeout(() => setIsCarouselPaused(false), 8000);
  };

  const goToPage = (pageIndex) => {
    setIsCarouselPaused(true);
    // Determine direction based on current page
    setSlideDirection(pageIndex > currentNewsPage ? 'left' : 'right');
    setCurrentNewsPage(pageIndex);
    // Resume auto-play after 8 seconds of user interaction
    setTimeout(() => setIsCarouselPaused(false), 8000);
  };

  return (
    <div className="homepage">
      {/* Festive snow overlay for December */}
      <div className="snow-container" aria-hidden="true">
        {snowflakes.map((flake, index) => (
          <div
            key={index}
            className="snowflake"
            style={{
              left: `${flake.left}%`,
              width: `${flake.size * 1.2}px`,
              height: `${flake.size * 1.2}px`,
              fontSize: `${flake.size}px`,
              animationDuration: `${flake.duration}s`,
              animationDelay: `${flake.delay}s`,
              opacity: flake.opacity,
              "--drift": `${flake.drift}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Flickering lights overlay */}
      <div className="lights-container" aria-hidden="true">
        {lights.map((light, index) => (
          <div
            key={`light-${index}`}
            className="flickering-light"
            style={{
              left: `${light.left}%`,
              width: `${light.size}px`,
              height: `${light.size}px`,
              animationDelay: `${light.delay}s`,
              "--drift": `${light.drift}px`,
              "--light-color": light.color,
              "--flicker-speed": `${light.flickerSpeed}s`,
              "--fall-duration": `${light.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative Wreath Border */}
      <div className="wreath-container" aria-hidden="true">
        <svg
          className="wreath-svg-top"
          viewBox="0 0 1920 80"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="wreathGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#3a6b3a", stopOpacity: 0.85 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
            </linearGradient>
          </defs>
          {/* Wavy wreath base along top - from right to left */}
          <path
            className="wreath-base-path"
            d="M 1920 40 Q 1760 20 1600 30 T 1280 35 T 960 30 T 640 35 T 320 30 T 0 40"
            fill="none"
            stroke="url(#wreathGradient)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Decorative leaves */}
          {Array.from({ length: 24 }).map((_, i) => {
            const x = 1920 - (i / 24) * 1920;
            const y = 35 + Math.sin(i * 0.8) * 15;
            return (
              <g key={`top-leaf-${i}`} className="wreath-leaf-group">
                <ellipse
                  cx={x}
                  cy={y}
                  rx="18"
                  ry="8"
                  fill="#2d5a2d"
                  opacity="0.8"
                  transform={`rotate(${-i * 15} ${x} ${y})`}
                />
                <ellipse
                  cx={x - 12}
                  cy={y - 5}
                  rx="15"
                  ry="7"
                  fill="#3a6b3a"
                  opacity="0.7"
                  transform={`rotate(${-i * 15 + 30} ${x - 12} ${y - 5})`}
                />
              </g>
            );
          })}
          {/* Decorative berries */}
          {Array.from({ length: 10 }).map((_, i) => {
            const x = 1920 - (i * 192 + 96);
            const y = 30 + Math.sin(i * 0.7) * 12;
            return (
              <circle
                key={`top-berry-${i}`}
                className="wreath-berry-svg"
                cx={x}
                cy={y}
                r="6"
                fill="#ff0000"
                opacity="0.9"
              />
            );
          })}
          {/* Flickering light bulbs along top */}
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 1920 - (i * 137.14 + 68.57);
            const y = 38 + Math.sin(i * 0.6) * 10;
            const colors = ["#ff0000", "#0080ff", "#00ff00", "#ffff00"];
            const color = colors[i % colors.length];
            return (
              <g key={`top-light-${i}`} className="wreath-light-bulb-group">
                <circle
                  className="wreath-light-bulb"
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  opacity="0.9"
                />
                <circle
                  className="wreath-light-bulb-glow"
                  cx={x}
                  cy={y}
                  r="12"
                  fill={color}
                  opacity="0.4"
                />
              </g>
            );
          })}
        </svg>

        <svg
          className="wreath-svg-right"
          viewBox="0 0 80 1080"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="wreathGradientRight"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#3a6b3a", stopOpacity: 0.85 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
            </linearGradient>
          </defs>
          {/* Wavy wreath base along right */}
          <path
            className="wreath-base-path"
            d="M 40 0 Q 60 180 50 360 T 45 720 T 50 1080 T 40 1080"
            fill="none"
            stroke="url(#wreathGradientRight)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Decorative leaves */}
          {Array.from({ length: 18 }).map((_, i) => {
            const y = (i / 18) * 1080;
            const x = 45 - Math.cos(i * 0.8) * 15;
            return (
              <g key={`right-leaf-${i}`} className="wreath-leaf-group">
                <ellipse
                  cx={x}
                  cy={y}
                  rx="8"
                  ry="18"
                  fill="#2d5a2d"
                  opacity="0.8"
                  transform={`rotate(${-90 - i * 15} ${x} ${y})`}
                />
                <ellipse
                  cx={x + 5}
                  cy={y + 12}
                  rx="7"
                  ry="15"
                  fill="#3a6b3a"
                  opacity="0.7"
                  transform={`rotate(${-90 - i * 15 + 30} ${x + 5} ${y + 12})`}
                />
              </g>
            );
          })}
          {/* Decorative berries */}
          {Array.from({ length: 8 }).map((_, i) => {
            const y = i * 135 + 67.5;
            const x = 50 - Math.cos(i * 0.7) * 10;
            return (
              <circle
                key={`right-berry-${i}`}
                className="wreath-berry-svg"
                cx={x}
                cy={y}
                r="6"
                fill="#ff0000"
                opacity="0.9"
              />
            );
          })}
          {/* Flickering light bulbs along right */}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = i * 90 + 45;
            const x = 52 - Math.cos(i * 0.6) * 8;
            const colors = ["#ff0000", "#0080ff", "#00ff00", "#ffff00"];
            const color = colors[i % colors.length];
            return (
              <g key={`right-light-${i}`} className="wreath-light-bulb-group">
                <circle
                  className="wreath-light-bulb"
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  opacity="0.9"
                />
                <circle
                  className="wreath-light-bulb-glow"
                  cx={x}
                  cy={y}
                  r="12"
                  fill={color}
                  opacity="0.4"
                />
              </g>
            );
          })}
        </svg>

        {/* Corner accent wreath */}
        {/* <div className="wreath-corner">
          <svg className="wreath-corner-svg" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#2d5a2d"
              strokeWidth="8"
              opacity="0.8"
            />
            <circle cx="50" cy="50" r="25" fill="#ff0000" opacity="0.9" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 360;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + Math.cos(rad) * 30;
              const y = 50 + Math.sin(rad) * 30;
              return (
                <ellipse
                  key={`corner-leaf-${i}`}
                  cx={x}
                  cy={y}
                  rx="6"
                  ry="12"
                  fill="#2d5a2d"
                  opacity="0.8"
                  transform={`rotate(${angle} ${x} ${y})`}
                />
              );
            })}
          </svg>
        </div> */}
      </div>

      {/* Second Decorative Wreath Border - Bottom Left to Top Left to Bottom Right */}
      <div className="wreath-container-bottom" aria-hidden="true">
        <svg
          className="wreath-svg-left-bottom"
          viewBox="0 0 80 1080"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="wreathGradientLeftBottom"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#3a6b3a", stopOpacity: 0.85 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
            </linearGradient>
          </defs>
          {/* Wavy wreath base along left - from bottom to top */}
          <path
            className="wreath-base-path"
            d="M 40 1080 Q 20 900 30 720 T 35 360 T 30 0 T 40 0"
            fill="none"
            stroke="url(#wreathGradientLeftBottom)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Decorative leaves */}
          {Array.from({ length: 18 }).map((_, i) => {
            const y = 1080 - (i / 18) * 1080;
            const x = 35 + Math.cos(i * 0.8) * 15;
            return (
              <g key={`left-bottom-leaf-${i}`} className="wreath-leaf-group">
                <ellipse
                  cx={x}
                  cy={y}
                  rx="8"
                  ry="18"
                  fill="#2d5a2d"
                  opacity="0.8"
                  transform={`rotate(${90 + i * 15} ${x} ${y})`}
                />
                <ellipse
                  cx={x - 5}
                  cy={y - 12}
                  rx="7"
                  ry="15"
                  fill="#3a6b3a"
                  opacity="0.7"
                  transform={`rotate(${90 + i * 15 + 30} ${x - 5} ${y - 12})`}
                />
              </g>
            );
          })}
          {/* Decorative berries */}
          {Array.from({ length: 8 }).map((_, i) => {
            const y = 1080 - (i * 135 + 67.5);
            const x = 30 + Math.cos(i * 0.7) * 10;
            return (
              <circle
                key={`left-bottom-berry-${i}`}
                className="wreath-berry-svg"
                cx={x}
                cy={y}
                r="6"
                fill="#ff0000"
                opacity="0.9"
              />
            );
          })}
          {/* Flickering light bulbs along left-bottom */}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = 1080 - (i * 90 + 45);
            const x = 32 + Math.cos(i * 0.6) * 8;
            const colors = ["#ff0000", "#0080ff", "#00ff00", "#ffff00"];
            const color = colors[i % colors.length];
            return (
              <g
                key={`left-bottom-light-${i}`}
                className="wreath-light-bulb-group"
              >
                <circle
                  className="wreath-light-bulb"
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  opacity="0.9"
                />
                <circle
                  className="wreath-light-bulb-glow"
                  cx={x}
                  cy={y}
                  r="12"
                  fill={color}
                  opacity="0.4"
                />
              </g>
            );
          })}
        </svg>

        <svg
          className="wreath-svg-bottom"
          viewBox="0 0 1920 80"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="wreathGradientBottom"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#3a6b3a", stopOpacity: 0.85 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#2d5a2d", stopOpacity: 0.9 }}
              />
            </linearGradient>
          </defs>
          {/* Wavy wreath base along bottom - from left to right */}
          <path
            className="wreath-base-path"
            d="M 0 40 Q 160 60 320 50 T 640 45 T 960 50 T 1280 45 T 1600 50 T 1920 40"
            fill="none"
            stroke="url(#wreathGradientBottom)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Decorative leaves */}
          {Array.from({ length: 24 }).map((_, i) => {
            const x = (i / 24) * 1920;
            const y = 45 - Math.sin(i * 0.8) * 15;
            return (
              <g key={`bottom-leaf-${i}`} className="wreath-leaf-group">
                <ellipse
                  cx={x}
                  cy={y}
                  rx="18"
                  ry="8"
                  fill="#2d5a2d"
                  opacity="0.8"
                  transform={`rotate(${180 + i * 15} ${x} ${y})`}
                />
                <ellipse
                  cx={x + 12}
                  cy={y + 5}
                  rx="15"
                  ry="7"
                  fill="#3a6b3a"
                  opacity="0.7"
                  transform={`rotate(${180 + i * 15 + 30} ${x + 12} ${y + 5})`}
                />
              </g>
            );
          })}
          {/* Decorative berries */}
          {Array.from({ length: 10 }).map((_, i) => {
            const x = i * 192 + 96;
            const y = 50 - Math.sin(i * 0.7) * 12;
            return (
              <circle
                key={`bottom-berry-${i}`}
                className="wreath-berry-svg"
                cx={x}
                cy={y}
                r="6"
                fill="#ff0000"
                opacity="0.9"
              />
            );
          })}
          {/* Flickering light bulbs along bottom */}
          {Array.from({ length: 14 }).map((_, i) => {
            const x = i * 137.14 + 68.57;
            const y = 42 - Math.sin(i * 0.6) * 10;
            const colors = ["#ff0000", "#0080ff", "#00ff00", "#ffff00"];
            const color = colors[i % colors.length];
            return (
              <g key={`bottom-light-${i}`} className="wreath-light-bulb-group">
                <circle
                  className="wreath-light-bulb"
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  opacity="0.9"
                />
                <circle
                  className="wreath-light-bulb-glow"
                  cx={x}
                  cy={y}
                  r="12"
                  fill={color}
                  opacity="0.4"
                />
              </g>
            );
          })}
        </svg>

        {/* Bottom-left corner accent wreath */}
        <div className="wreath-corner-bottom-left">
          <svg className="wreath-corner-svg" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#2d5a2d"
              strokeWidth="8"
              opacity="0.8"
            />
            <circle cx="50" cy="50" r="25" fill="#ff0000" opacity="0.9" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 360;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + Math.cos(rad) * 30;
              const y = 50 + Math.sin(rad) * 30;
              return (
                <ellipse
                  key={`corner-bottom-left-leaf-${i}`}
                  cx={x}
                  cy={y}
                  rx="6"
                  ry="12"
                  fill="#2d5a2d"
                  opacity="0.8"
                  transform={`rotate(${angle} ${x} ${y})`}
                />
              );
            })}
          </svg>
        </div>
      </div>
      <video className="video-overlay" autoPlay loop muted playsInline>
        <source src="/images/bgvideo.mp4" type="video/mp4" />
      </video>
      <Navbar />
      <div className="homepage-content">
        {/* Hero/Banner Section */}
        <div className="hero-banner-section"></div>

        <div className="features-section">
          <div className="container">
            <h2 className="section-title">
              Why Choose City College of Bayawan?
            </h2>
            <div
              className={`features-grid ${
                isFeaturesGridVisible ? "fade-in-visible" : ""
              }`}
            >
              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                  >
                    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Quality Education</h4>
                  <p>
                    Committed to providing excellent education that prepares
                    students for their future careers.
                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                  >
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5h-.5l-1.5-1.5c-.47-.62-1.21-.99-2.01-.99H8.46a1.5 1.5 0 0 0-1.42 1.37L4.5 16H7v6h2v-6h2v6h2v-6h2v6h2z" />
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Expert Faculty</h4>
                  <p>
                    Learn from experienced and qualified instructors dedicated
                    to student success.
                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                  >
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Modern Facilities</h4>
                  <p>
                    State-of-the-art facilities and resources to support your
                    learning journey.
                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                  >
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75S7 14 17 14s11 2 11 2-1-1.5-1-3.5-1.75-3.25-1.75-3.25S19 8 17 8z" />
                  </svg>
                </div>
                <div className="feature-content">
                  <h4>Community Focus</h4>
                  <p>
                    Rooted in the community, serving Bayawan and the surrounding
                    areas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="news-section">
          <div className="container">
            <h2 className="section-title">News & Events</h2>
            {newsLoading ? (
              <div className="news-grid-layout">
                <div className="news-grid-item">
                  <div className="news-card">
                    <p style={{ color: "#fff" }}>Loading latest news...</p>
                  </div>
                </div>
              </div>
            ) : newsError ? (
              <div className="news-grid-layout">
                <div className="news-grid-item">
                  <div className="news-card">
                    <p>{newsError}</p>
                  </div>
                </div>
              </div>
            ) : newsData.length === 0 ? (
              <div className="news-grid-layout">
                <div className="news-grid-item">
                  <div className="news-card">
                    <p>No announcements yet. Check back soon.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="news-carousel-wrapper"
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => setIsCarouselPaused(false)}
              >
                <div className="news-carousel-slide-container">
                  <div 
                    className={`news-grid-layout slide-${slideDirection}`}
                    key={`news-page-${currentNewsPage}`}
                  >
                  {(showCarousel ? getCurrentPageItems() : (() => {
                    // If not using carousel, pad to 3 items if needed
                    const items = [...newsData];
                    while (items.length < 3) {
                      items.push(null);
                    }
                    return items.slice(0, 3);
                  })()).map((news, index) => {
                    // Skip rendering if item is null (placeholder)
                    if (!news) {
                      return (
                        <div
                          key={`placeholder-${index}`}
                          className="news-grid-item news-placeholder"
                          aria-hidden="true"
                        />
                      );
                    }
                    
                    // Only render as image card if item actually has an image
                    // This ensures uniformity - all cards without images will be text cards
                    const hasImage = news.image && news.image.trim().length > 0;
                    const isImageNews = hasImage;
                    
                    return (
                      <div
                        key={news.id}
                        className={`news-grid-item ${
                          isImageNews ? "news-image-item" : "news-text-item"
                        }`}
                      >
                        {isImageNews ? (
                          <div className="news-card-image">
                            <div className="news-image-wrapper">
                              {news.image ? (
                                <img 
                                  src={news.image} 
                                  alt={news.title}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <div className="news-image-placeholder">
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="48"
                                    height="48"
                                    fill="currentColor"
                                    opacity="0.3"
                                  >
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="news-card-content">
                              <div
                                className={`news-type-badge ${
                                  news.type === "announcement"
                                    ? "type-announcement"
                                    : news.type === "event"
                                    ? "type-event"
                                    : news.type === "news"
                                    ? "type-news"
                                    : "type-achievement"
                                }`}
                              >
                                {news.badge}
                              </div>
                              <div className="news-date">
                                {formatMonthYear(news.date)}
                              </div>
                              <h3 className="news-title">{news.title}</h3>
                              <p className="news-summary">
                                {truncate(news.description, 120)}
                              </p>
                              <a href={news.link} className="news-link">
                                Read More →
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="news-card">
                            <div
                              className={`news-type-badge ${
                                news.type === "announcement"
                                  ? "type-announcement"
                                  : news.type === "event"
                                  ? "type-event"
                                  : news.type === "news"
                                  ? "type-news"
                                  : "type-achievement"
                              }`}
                            >
                              {news.badge}
                            </div>
                            <div className="news-date">
                              {formatMonthYear(news.date)}
                            </div>
                            <h3 className="news-title">{news.title}</h3>
                            <p className="news-summary">
                              {truncate(news.description, 200)}
                            </p>
                            <a href={news.link} className="news-link">
                              Read More →
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
                {showCarousel && (
                  <div className="news-carousel-controls">
                    <button
                      className="news-carousel-btn news-carousel-btn-prev"
                      onClick={handlePrevPage}
                      aria-label="Previous page"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                      >
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                      </svg>
                    </button>
                    <div className="news-carousel-dots">
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                          key={index}
                          className={`news-carousel-dot ${
                            currentNewsPage === index ? "active" : ""
                          }`}
                          onClick={() => goToPage(index)}
                          aria-label={`Go to page ${index + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      className="news-carousel-btn news-carousel-btn-next"
                      onClick={handleNextPage}
                      aria-label="Next page"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                      >
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="cta-section">
          <div className="container">
            <h2>Ready to Start Your Journey?</h2>
            <p>
              Join the City College of Bayawan community and pursue your
              educational goals.
            </p>
            <div
              className={`cta-buttons ${
                isCtaButtonsVisible ? "fade-in-visible" : ""
              }`}
            >
              <a href="/admissions" className="btn btn-primary btn-large">
                Apply for Admission
              </a>
              <a href="/contact" className="btn btn-outline btn-large">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-section">
        <Footer />
      </div>

      <ScrollToTop />
    </div>
  );
};

export default HomePage;
