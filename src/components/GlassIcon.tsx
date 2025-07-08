interface GlassIconProps {
  glassType: string;
  className?: string;
}

const GlassIcon = ({ glassType, className = "w-6 h-6" }: GlassIconProps) => {
  const getGlassIcon = (type: string) => {
    switch (type) {
      case 'highball':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 2h8v20H8V2zm1 1v18h6V3H9z" />
          </svg>
        );
      case 'rocks':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 8h12v12H6V8zm1 1v10h10V9H7z" />
          </svg>
        );
      case 'martini':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4l8 12v6h-2v2h4v-2h-2v-6L20 4H4zm2.83 2h10.34L12 12.17 6.83 6z" />
          </svg>
        );
      case 'coupe':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 6c0 4.42 3.58 8 8 8s8-3.58 8-8H5zm7 10v4h-2v2h4v-2h-2v-4c-1.11 0-2-.89-2-2h2c0 1.11.89 2 2 2z" />
          </svg>
        );
      case 'collins':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2h10v20H7V2zm1 1v18h8V3H8z" />
          </svg>
        );
      case 'shot':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12h6v8H9v-8zm1 1v6h4v-6h-4z" />
          </svg>
        );
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 2h8v20H8V2zm1 1v18h6V3H9z" />
          </svg>
        );
    }
  };

  return getGlassIcon(glassType);
};

export default GlassIcon;
