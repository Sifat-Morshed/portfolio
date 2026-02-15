import React, { useState, useEffect } from 'react';
import { Layout, Save, Loader2, AlertCircle } from 'lucide-react';

interface PortfolioContent {
  section: string;
  key: string;
  value: string;
  type: string;
  updated_at: string;
}

interface PortfolioCMSProps {
  userEmail: string;
}

const PortfolioCMS: React.FC<PortfolioCMSProps> = ({ userEmail }) => {
  const [content, setContent] = useState<PortfolioContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/work/admin?action=list-portfolio', {
        headers: { Authorization: `Bearer ${userEmail}` },
      });
      if (!res.ok) throw new Error('Failed to fetch portfolio content');
      const data = await res.json();
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [userEmail]);

  const handleUpdate = async (section: string, key: string, value: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/work/admin?action=update-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userEmail}`,
        },
        body: JSON.stringify({ section, key, value }),
      });

      if (!res.ok) throw new Error('Failed to update content');

      setSuccessMessage('Content updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (index: number, newValue: string) => {
    const updatedContent = [...content];
    updatedContent[index].value = newValue;
    setContent(updatedContent);
  };

  const sections = ['hero', 'about', 'experience', 'services', 'contact'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layout size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-white">Portfolio Content Management</h3>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-400 mb-1">Portfolio CMS - Coming Soon (Full Version)</h4>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              This is a placeholder for the full Portfolio CMS system. The complete implementation would allow you to:
              <br />• Edit all text content on your portfolio (Hero, About, Experience, Services, Contact)
              <br />• Upload and manage images/media
              <br />• Manage skills, projects, and experience entries
              <br />• Configure SEO metadata
              <br />• Real-time preview of changes
              <br /><br />
              <strong>Currently:</strong> This feature requires significant architectural changes to make all portfolio components
              dynamic. To avoid breaking the existing site, this will be implemented in a future update with proper testing.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Section Tabs */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white capitalize">{section} Section</h4>
              <span className="text-xs text-slate-500 bg-slate-500/10 px-2 py-1 rounded">
                Not Implemented Yet
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Content management for the {section} section will be available here. This will allow you to edit
              all text, images, and data displayed in this section of your portfolio.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">Implementation Roadmap</h4>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-blue-400">1.</span>
            <p>Create PortfolioContent sheet in Google Sheets with structured data for all sections</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400">2.</span>
            <p>Add API endpoints for fetching and updating portfolio content</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400">3.</span>
            <p>Refactor portfolio components to consume data from API instead of hardcoded values</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400">4.</span>
            <p>Build rich text editor interface with preview functionality</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400">5.</span>
            <p>Add image upload and media management system</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400">6.</span>
            <p>Implement caching layer for performance optimization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCMS;
