import React, { useEffect } from 'react';

interface MobileMenuProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ show, onClose, children, title }) => {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl md:hidden safe-bottom animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-3 border-b">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="touch-target flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
};

// Mobile-only hamburger menu button
export const MobileMenuButton: React.FC<{ onClick: () => void; className?: string }> = ({
  onClick,
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`md:hidden touch-target flex flex-col items-center justify-center gap-1.5 ${className}`}
      aria-label="Menu"
    >
      <span className="w-6 h-0.5 bg-current"></span>
      <span className="w-6 h-0.5 bg-current"></span>
      <span className="w-6 h-0.5 bg-current"></span>
    </button>
  );
};