/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalysisRecord } from '../types';
import {
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';

interface HistoryPageProps {
  onSelectRecord: (record: AnalysisRecord) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectRecord }) => {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [assessmentFilter, setAssessmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(page, pageSize, assessmentFilter);
      setRecords(data.items);
      setTotalCount(data.total_count);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, assessmentFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteAnalysis(id);
      setDeleteConfirmId(null);
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete analysis record:', err);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.original_filename.toLowerCase().includes(q) ||
      (r.extracted_fields?.utr && r.extracted_fields.utr.includes(q)) ||
      (r.extracted_fields?.upi_id && r.extracted_fields.upi_id.toLowerCase().includes(q)) ||
      r.analysis_id.toLowerCase().includes(q)
    );
  });

  const exportAllHistory = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fake_upi_audit_history_page_${page}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Payment Audit History</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review past screenshot evaluations, extracted payment identifiers, and forensic audit logs.
          </p>
        </div>

        <button
          onClick={exportAllHistory}
          disabled={records.length === 0}
          className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export History JSON</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename, UTR number, or UPI ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 font-mono"
          />
        </div>

        {/* Assessment Category Filter Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          {(['ALL', 'SUSPICIOUS', 'NO_OBVIOUS_ISSUES', 'INCONCLUSIVE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setAssessmentFilter(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                assessmentFilter === cat
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Screenshot File</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">12-Digit UTR</th>
                <th className="py-3 px-4">Payee / VPA</th>
                <th className="py-3 px-4">Audit Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading audit history...
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((item) => {
                  const isSuspicious = item.assessment === 'SUSPICIOUS';
                  const isClean = item.assessment === 'NO_OBVIOUS_ISSUES';
                  return (
                    <tr
                      key={item.analysis_id}
                      onClick={() => onSelectRecord(item)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium ${
                            isSuspicious
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : isClean
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isSuspicious ? (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          ) : isClean ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <HelpCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{item.assessment.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-200 group-hover:text-emerald-400 transition-colors max-w-xs truncate">
                        {item.original_filename}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                        {item.extracted_fields?.amount ? `₹ ${item.extracted_fields.amount}` : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                        {item.extracted_fields?.utr || <span className="text-slate-500 italic">None</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {item.extracted_fields?.recipient_name || item.extracted_fields?.upi_id || '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {deleteConfirmId === item.analysis_id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={(e) => handleDelete(item.analysis_id, e)}
                              className="px-2 py-0.5 text-[11px] font-semibold text-white bg-red-600 rounded hover:bg-red-500 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(item.analysis_id);
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-mono text-white font-medium">{filteredRecords.length}</span> of{' '}
            <span className="font-mono text-white font-medium">{totalCount}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`p-1.5 rounded border border-slate-800 ${
                page <= 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`p-1.5 rounded border border-slate-800 ${
                page >= totalPages ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
