import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `ExternaWear | ${title}` : 'ExternaWear';
  }, [title]);
};

export default useDocumentTitle;
