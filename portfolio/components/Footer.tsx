import React from 'react';
import { Linkedin, Facebook, Instagram, MessageCircle, Github, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 py-12 border-t border-slate-900">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Brand & Copy */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-display font-bold text-lg mb-2">Sifat Morshed<span className="text-primary">.dev</span></h4>
            <div className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Sifat Morshed. All rights reserved.
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
             <a href="https://www.linkedin.com/in/sifat-morshed-750746217/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="p-2 text-slate-400 hover:text-primary transition-colors">
               <Linkedin size={20} />
             </a>
             <a href="https://github.com/Sifat-Morshed" target="_blank" rel="noreferrer" aria-label="GitHub" className="p-2 text-slate-400 hover:text-primary transition-colors">
               <Github size={20} />
             </a>
             <a href="https://leetcode.com/u/sifat-morshed/" target="_blank" rel="noreferrer" aria-label="LeetCode" className="p-2 text-slate-400 hover:text-primary transition-colors">
               <Code2 size={20} />
             </a>
             <a href="https://www.facebook.com/SifatmorshedOfficial" target="_blank" rel="noreferrer" aria-label="Facebook" className="p-2 text-slate-400 hover:text-primary transition-colors">
               <Facebook size={20} />
             </a>
             <a href="https://www.instagram.com/sifattttmorshed/" target="_blank" rel="noreferrer" aria-label="Instagram" className="p-2 text-slate-400 hover:text-primary transition-colors">
               <Instagram size={20} />
             </a>
             <a href="https://wa.link/n3f4zo" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-2 text-slate-400 hover:text-primary transition-colors">
               <MessageCircle size={20} />
             </a>
          </div>

          {/* Legal Links */}
          <div className="flex gap-6 text-sm font-medium text-slate-500">
             <Link to="/privacy" className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</Link>
             <Link to="/terms" className="hover:text-primary cursor-pointer transition-colors">Terms of Service</Link>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;