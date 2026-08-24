import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  XCircle,
  FilePlus,
  Trash2,
  ExternalLink,
  Paperclip,
  ShieldCheck,
  Eye
} from 'lucide-react';

const Upload = ({ globalSearch = '' }) => {
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'catalog'

  // CSV State
  const [csvFile, setCsvFile] = useState(null);
  const [defaultType, setDefaultType] = useState('Business');
  const [csvUploading, setCsvUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rejectedRows, setRejectedRows] = useState([]);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [csvError, setCsvError] = useState('');

  // Catalog PDF State
  const [catalogFile, setCatalogFile] = useState(null);
  const [catalogUploading, setCatalogUploading] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchCatalogs = async () => {
    try {
      const res = await api.get('/uploads');
      if (res.data.success) {
        setCatalogs(res.data.files || []);
      }
    } catch (err) {
      console.error('Error fetching catalogs:', err);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return setCsvError('Please select a CSV file.');

    setCsvUploading(true);
    setCsvError('');
    setSummary(null);

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('defaultType', defaultType);

    try {
      const res = await api.post('/uploads/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSummary(res.data.summary);
        setRejectedRows(res.data.rejectedRows || []);
      }
    } catch (err) {
      setCsvError(err.response?.data?.message || 'Failed to parse CSV.');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleCatalogUpload = async (e) => {
    e.preventDefault();
    if (!catalogFile) return setCatalogError('Please select a PDF/DOC catalog file.');

    setCatalogUploading(true);
    setCatalogError('');

    const formData = new FormData();
    formData.append('file', catalogFile);

    try {
      const res = await api.post('/uploads/catalog', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setNotification({ type: 'success', message: 'Product Catalog attachment uploaded successfully!' });
        setCatalogFile(null);
        fetchCatalogs();
      }
    } catch (err) {
      setCatalogError(err.response?.data?.message || 'Failed to upload catalog file.');
    } finally {
      setCatalogUploading(false);
    }
  };

  const handleDeleteCatalog = async (id) => {
    if (!window.confirm('Delete this product catalog file?')) return;
    try {
      await api.delete(`/uploads/${id}`);
      fetchCatalogs();
    } catch (err) {
      console.error('Failed to delete catalog:', err);
    }
  };

  const filteredCatalogs = globalSearch
    ? catalogs.filter((c) => c.originalName?.toLowerCase().includes(globalSearch.toLowerCase()))
    : catalogs;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-indigo-400" /> Upload & Media Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">Batch import CSV leads and manage Product Catalog attachments for campaign dispatches</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1.5 glass-panel rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'csv' ? 'glass-button-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            CSV Lead Importer
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'catalog' ? 'glass-button-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Product Catalogs ({catalogs.length})
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl glass-badge-emerald text-xs font-semibold flex items-center justify-between backdrop-blur-md">
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* CSV IMPORTER TAB */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl glass-panel shadow-2xl max-w-2xl mx-auto text-center">
            <form onSubmit={handleCsvUpload} className="space-y-6">
              <div className="border-2 border-dashed border-white/15 hover:border-indigo-400 rounded-3xl p-8 bg-slate-900/40 backdrop-blur-md transition cursor-pointer relative group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-white mb-1">
                  {csvFile ? csvFile.name : 'Choose CSV File or Drag & Drop'}
                </p>
                <p className="text-xs text-slate-400">
                  Supports <code className="text-indigo-300 font-mono">BusinessEmails.csv</code>, <code className="text-cyan-300 font-mono">IndividualsEmails.csv</code>
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs font-semibold">
                <span className="text-slate-300">Default Lead Segment:</span>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultType"
                    value="Business"
                    checked={defaultType === 'Business'}
                    onChange={() => setDefaultType('Business')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  Business (B2B)
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultType"
                    value="Individual"
                    checked={defaultType === 'Individual'}
                    onChange={() => setDefaultType('Individual')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  Individual (B2C)
                </label>
              </div>

              {csvError && (
                <div className="p-3.5 rounded-2xl glass-badge-rose text-xs flex items-center gap-2 text-left">
                  <XCircle className="w-4 h-4 shrink-0" /> {csvError}
                </div>
              )}

              <button
                type="submit"
                disabled={csvUploading || !csvFile}
                className="w-full py-3 rounded-2xl glass-button-primary text-white text-xs font-bold shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {csvUploading ? 'Validating & Importing CSV...' : 'Process & Upload CSV'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {summary && (
            <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl glass-card text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Rows</span>
                  <span className="text-xl font-extrabold text-white font-mono">{summary.totalRows}</span>
                </div>
                <div className="p-4 rounded-2xl glass-card text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Valid Rows</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">{summary.validRows}</span>
                </div>
                <div className="p-4 rounded-2xl glass-card text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Invalid Rows</span>
                  <span className="text-xl font-extrabold text-rose-400 font-mono">{summary.invalidRows}</span>
                </div>
                <div className="p-4 rounded-2xl glass-card text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Duplicates</span>
                  <span className="text-xl font-extrabold text-amber-400 font-mono">{summary.duplicates}</span>
                </div>
                <div className="p-4 rounded-2xl glass-card border border-indigo-500/30 text-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Imported</span>
                  <span className="text-xl font-extrabold text-indigo-300 font-mono">{summary.importedCount}</span>
                </div>
              </div>

              {rejectedRows.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRejectedModal(true)}
                    className="px-4 py-2 rounded-xl glass-badge-amber text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect {rejectedRows.length} Rejected Rows
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CATALOG PDF TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl glass-panel shadow-2xl max-w-2xl mx-auto text-center">
            <form onSubmit={handleCatalogUpload} className="space-y-6">
              <div className="border-2 border-dashed border-white/15 hover:border-cyan-400 rounded-3xl p-8 bg-slate-900/40 backdrop-blur-md transition cursor-pointer relative group">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCatalogFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                  <Paperclip className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-white mb-1">
                  {catalogFile ? catalogFile.name : 'Upload Product Catalog PDF / DOC'}
                </p>
                <p className="text-xs text-slate-400">
                  e.g. <code className="text-cyan-300 font-mono">handcrafted-catalog.pdf</code> (Max 25MB)
                </p>
              </div>

              {catalogError && (
                <div className="p-3.5 rounded-2xl glass-badge-rose text-xs flex items-center gap-2 text-left">
                  <XCircle className="w-4 h-4 shrink-0" /> {catalogError}
                </div>
              )}

              <button
                type="submit"
                disabled={catalogUploading || !catalogFile}
                className="w-full py-3 rounded-2xl glass-button-primary text-white text-xs font-bold shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {catalogUploading ? 'Uploading Catalog...' : 'Upload Catalog Attachment'}
              </button>
            </form>
          </div>

          {/* Active Product Catalogs Grid */}
          <div className="p-6 rounded-3xl glass-panel">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-cyan-400" /> Active Product Catalogs ({filteredCatalogs.length})
            </h3>

            {filteredCatalogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No product catalogs uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalogs.map((cat) => (
                  <div key={cat._id} className="p-4 rounded-2xl glass-card-interactive flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-xs font-bold text-white truncate">{cat.originalName}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{(cat.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`/api/uploads/file/${cat.filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="View File"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteCatalog(cat._id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejected Rows Inspector Modal */}
      <Modal isOpen={showRejectedModal} onClose={() => setShowRejectedModal(false)} title="Rejected CSV Row Audit Log">
        <div className="space-y-4 text-xs">
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-white/10">
                <tr>
                  <th className="p-2">Row</th>
                  <th className="p-2">Name / Email</th>
                  <th className="p-2">Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rejectedRows.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-mono font-bold text-slate-300">#{item.row}</td>
                    <td className="p-2 font-mono text-indigo-300">{item.data?.email || item.data?.Email || 'N/A'}</td>
                    <td className="p-2 text-rose-400 font-semibold">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Upload;
