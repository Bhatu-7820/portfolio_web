import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, limit }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-slate-900/60 backdrop-blur-md rounded-b-2xl">
      <div className="text-xs text-slate-400 font-medium">
        Showing Page <span className="font-bold text-white">{currentPage}</span> of{' '}
        <span className="font-bold text-white">{totalPages}</span> ({totalItems} total items)
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl glass-button-secondary disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
          .map((page, idx, arr) => {
            const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className="px-2 text-slate-500 text-xs">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 text-xs rounded-xl font-semibold transition ${
                    currentPage === page
                      ? 'glass-button-primary text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-xl glass-button-secondary disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
