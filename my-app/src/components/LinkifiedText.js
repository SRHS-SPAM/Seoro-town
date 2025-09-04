import React from 'react';

function LinkifiedText({ text }) {
  const linkify = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${url}</a>`);
  };

  return <div dangerouslySetInnerHTML={{ __html: linkify(text) }} />;
}

export default LinkifiedText;
