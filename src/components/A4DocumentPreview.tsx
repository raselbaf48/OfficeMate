import React from 'react';
import { PageSettings } from '../types/models';
import { decorateMixedScriptHtml, sanitizeDocumentHtml } from '../utils/placeholderEngine';

interface A4DocumentPreviewProps {
  renderedHtml: string;
  pageSettings: PageSettings;
  zoom?: number;
  className?: string;
}

export const A4DocumentPreview: React.FC<A4DocumentPreviewProps> = ({
  renderedHtml,
  pageSettings,
  zoom = 1,
  className = '',
}) => {
  const { margins, fontFamily, fontSize, lineHeight, headerText, footerText } =
    pageSettings;

  const cleanHtml = decorateMixedScriptHtml(sanitizeDocumentHtml(renderedHtml));
  const cleanHeader = headerText ? decorateMixedScriptHtml(headerText) : '';
  const cleanFooter = footerText ? decorateMixedScriptHtml(footerText) : '';
  const pages = cleanHtml.split(/<hr[^>]*class="[^"]*om-page-break[^"]*"[^>]*\/?>/gi);
  const resolvedFont = fontFamily && fontFamily !== 'SutonnyMJ' ? fontFamily : 'Arial';
  const resolvedSize = fontSize || 12;

  return (
    <div
      className={`flex flex-col items-center gap-6 ${className}`}
      style={{
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      {pages.map((pageHtml, index) => (
        <div
          key={index}
          className="a4-paper border border-slate-300 shadow-sm flex flex-col justify-between"
          style={{
            padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
            fontFamily: `"${resolvedFont}", "Tiro Bangla", "Noto Serif Bengali", "Noto Sans Bengali", sans-serif`,
            fontSize: `${resolvedSize}pt`,
            lineHeight: String(lineHeight),
          }}
        >
          <div>
            {cleanHeader ? (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: `${resolvedSize}pt`,
                  color: '#000000',
                  marginBottom: '4mm',
                  letterSpacing: '0.02em',
                }}
                dangerouslySetInnerHTML={{ __html: cleanHeader }}
              />
            ) : null}
            <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
          </div>

          {cleanFooter ? (
            <div
              style={{
                textAlign: 'center',
                fontSize: `${resolvedSize}pt`,
                color: '#000000',
                marginTop: '4mm',
                letterSpacing: '0.02em',
              }}
              dangerouslySetInnerHTML={{ __html: cleanFooter }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};
