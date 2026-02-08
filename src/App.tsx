import React, { useEffect, useState } from 'react';
import ScrollToTopButton from '../components/ui/ScrollToTopButton';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import ProofOfWork from '../components/ProofOfWork';
import AiWorkflow from '../components/AiWorkflow'; // Now "Objectives"
import Experience from '../components/Experience';
import CareerVision from '../components/CareerVision';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import KpiStoryboard from '../components/KpiStoryboard';
import SalesPlaybook from '../components/SalesPlaybook';
import CvPage from '../components/CvPage';
import { PrivacyPolicy, TermsOfService } from '../components/Legal';

// Work With Me module
import WorkLayout from '../components/work/WorkLayout';
import WorkListing from '../components/work/WorkListing';
import ProjectLanding from '../components/work/ProjectLanding';
import StatusPage from '../components/work/StatusPage';
import AdminLogin from '../components/work/AdminLogin';
import AdminDashboard from '../components/work/AdminDashboard';
import WorkCTA from '../components/work/WorkCTA';

const HomePage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <KpiStoryboard />
      <About />
      <Services />
      <SalesPlaybook />
      <ProofOfWork />
      <Experience />
      <AiWorkflow />
      <CareerVision />
      <WorkCTA />
      <Contact />
      <Footer />
    </>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

gsap.registerPlugin(ScrollTrigger);

/** Hook: only enables Lenis smooth-scroll on portfolio pages, NOT /work/* */
const useLenis = () => {
  const { pathname } = useLocation();
  const isWorkRoute = pathname.startsWith('/work');

  useEffect(() => {
    if (isWorkRoute) {
      // Remove Lenis classes so overflow:hidden doesn't lock the page
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.refresh();

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
    };
  }, [isWorkRoute]);
};

/** Inner app that has access to Router context */
const AppRoutes = () => {
  useLenis();

  // Scroll-to-top button state
  const [showScroll, setShowScroll] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setShowScroll(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cv" element={<CvPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Work With Me module */}
          <Route path="/work" element={<WorkLayout />}>
            <Route index element={<WorkListing />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path=":companyId/:roleId" element={<ProjectLanding />} />
          </Route>
        </Routes>
        <ScrollToTopButton show={showScroll} onClick={handleScrollToTop} />
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;