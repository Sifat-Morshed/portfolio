import React from 'react';

interface ScrollToTopButtonProps {
  show: boolean;
  onClick: () => void;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ show, onClick }) => {
  return show ? (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-br from-cyan-500 via-emerald-500 to-teal-500 shadow-lg shadow-cyan-500/50 text-white hover:scale-110 hover:shadow-xl hover:shadow-cyan-400/50 transition-all md:hidden border border-cyan-400/30"
      aria-label="Scroll to top"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 15l7-7 7 7" />
      </svg>
    </button>
  ) : null;
};

export default ScrollToTopButton;
