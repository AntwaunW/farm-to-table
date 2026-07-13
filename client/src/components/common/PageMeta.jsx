// Sets a per-page <title> and canonical <link>. React 19 hoists <title>/<meta>/<link>
// rendered anywhere in the tree into <head>, so no react-helmet dependency is needed.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageMeta = ({ title }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // React only dedupes <title> tags it rendered itself — it won't remove the
    // static default already sitting in index.html (marked data-default), so
    // without this cleanup the page ends up with two <title> elements (harmless
    // for a live tab, but bad for a prerendered snapshot handed to crawlers).
    document.querySelector('title[data-default]')?.remove();
  }, [title]);

  return (
    <>
      <title>{title}</title>
      <link rel="canonical" href={`https://cattleandcrop.com${pathname}`} />
    </>
  );
};

export default PageMeta;
