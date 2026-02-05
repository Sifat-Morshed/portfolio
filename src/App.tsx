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

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.refresh();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
    };
  }, []);

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
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cv" element={<CvPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
        <ScrollToTopButton show={showScroll} onClick={handleScrollToTop} />
      </div>
    </Router>
  );
}

export default App;