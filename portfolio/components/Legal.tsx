import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Layout: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="min-h-screen bg-background py-20 px-6">
    <div className="container mx-auto max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 text-primary mb-8 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Return Home
      </Link>
      <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-8">{title}</h1>
      <div className="prose prose-invert prose-slate">
        {children}
      </div>
    </div>
  </div>
);

export const PrivacyPolicy: React.FC = () => (
  <Layout title="Privacy Policy">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <h3>1. Information Collection</h3>
    <p>This portfolio website does not collect personal data via cookies. Any information entered into the contact form or AI generator is processed ephemerally and is not stored in a persistent database.</p>
    <h3>2. Usage of Data</h3>
    <p>Any data provided is used solely for the purpose of generating message drafts or facilitating communication via WhatsApp/Email.</p>
    <h3>3. Third-Party Services</h3>
    <p>This site uses Google Gemini API for text generation. Data sent to the API is subject to Google's data processing terms.</p>
  </Layout>
);

export const TermsOfService: React.FC = () => (
  <Layout title="Terms of Service">
    <h3>1. Introduction</h3>
    <p>By accessing this website, you accept these terms and conditions in full.</p>
    <h3>2. Intellectual Property</h3>
    <p>Unless otherwise stated, Sifat Morshed owns the intellectual property rights for all material on this website. All intellectual property rights are reserved.</p>
    <h3>3. License to Use Website</h3>
    <p>You may view, download for caching purposes only, and print pages from the website for your own personal use, subject to restrictions set out below and elsewhere in these terms and conditions.</p>
  </Layout>
);