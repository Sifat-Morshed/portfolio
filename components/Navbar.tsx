import React, { useState, useEffect } from 'react';
import { Menu, X, Terminal, Phone, MessageCircle, FileText } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (id: string) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className={`relative z-50 flex justify-between items-center rounded-2xl transition-all duration-300 ${scrolled || isOpen ? 'bg-surfaceHighlight/90 backdrop-blur-md border border-white/10 px-6 py-3 shadow-glass' : 'bg-transparent px-0'}`}>
          
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => handleNavigation('root')}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-surface border border-white/10 rounded-lg flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <Terminal size={18} className="text-primary absolute top-2 left-2" />
                <Phone size={14} className="text-white absolute bottom-2 right-2 fill-current" />
              </div>
            </div>
            <span className="text-xl font-display font-bold text-white tracking-tight">
              Sifat Morshed<span className="text-primary"> | Sales & Dev</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 lg:gap-8 items-center">
            <button onClick={() => handleNavigation('about')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">About</button>
            <button onClick={() => handleNavigation('what-i-do')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Services</button>
            <Link to="/cv" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
               <FileText size={14} /> CV
            </Link>
            <button 
              onClick={() => handleNavigation('contact')} 
              className="px-5 py-2.5 rounded-lg bg-white text-background text-sm font-bold hover:bg-primary hover:text-white hover:shadow-neon transition-all flex items-center gap-2"
            >
              Let's Talk <MessageCircle size={16} />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-slate-300 hover:text-white p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`absolute top-full left-4 right-4 mt-2 z-40 md:hidden transition-all duration-300 ease-in-out origin-top ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
          <div className="bg-[#121215] border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 backdrop-blur-xl">
            <button 
              onClick={() => handleNavigation('about')} 
              className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => handleNavigation('what-i-do')} 
              className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Services
            </button>
            <Link 
              to="/cv" 
              className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
            >
              <FileText size={16} /> View CV
            </Link>
            <button 
              onClick={() => handleNavigation('contact')} 
              className="w-full justify-center px-4 py-3 mt-1 text-sm font-bold bg-white text-background rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-lg"
            >
              Let's Talk <MessageCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;