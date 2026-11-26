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
  const resolvedSize = fontFamily === 'SutonnyMJ' ? 12 : fontSize || 12;
  const isSerifFont = /times|georgia|serif|tinos|garamond/i.test(resolvedFont);
  const resolvedFontStack = isSerifFont
    ? `"${resolvedFont}", "Tinos", "Tiro Bangla", "Noto Serif Bengali", Georgia, serif`
    : `"${resolvedFont}", "Tiro Bangla", "Noto Serif Bengali", "Noto Sans Bengali", sans-serif`;

  const isLegal = pageSettings.size === 'Legal';
  const headerOffsetMm = Math.min(5, Math.max(2, (margins.top || 25.4) * 0.25));
  const footerOffsetMm = Math.min(5, Math.max(2, (margins.bottom || 25.4) * 0.25));

  return (
    <div
      className={`w-fit mx-auto flex flex-col items-center gap-6 ${className}`}
      style={{
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      {pages.map((pageHtml, index) => (
        <div
          key={index}
          className={`a4-paper ${isLegal ? 'om-page-legal' : ''} shrink-0 relative border border-slate-300 shadow-sm`}
          style={{
            width: isLegal ? '215.9mm' : '210mm',
            minHeight: isLegal ? '355.6mm' : '297mm',
            padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
            fontFamily: resolvedFontStack,
            fontSize: `${resolvedSize}pt`,
            lineHeight: String(lineHeight),
          }}
        >
          {cleanHeader ? (
            <div
              style={{
                position: 'absolute',
                top: `${headerOffsetMm}mm`,
                left: `${margins.left}mm`,
                right: `${margins.right}mm`,
                textAlign: 'center',
                fontSize: `${resolvedSize}pt`,
                lineHeight: '1.15',
                color: '#737373',
                letterSpacing: '0.02em',
                pointerEvents: 'none',
              }}
              dangerouslySetInnerHTML={{ __html: cleanHeader }}
            />
          ) : null}

          <div dangerouslySetInnerHTML={{ __html: pageHtml }} />

          {cleanFooter ? (
            <div
              style={{
                position: 'absolute',
                bottom: `${footerOffsetMm}mm`,
                left: `${margins.left}mm`,
                right: `${margins.right}mm`,
                textAlign: 'center',
                fontSize: `${resolvedSize}pt`,
                lineHeight: '1.15',
                color: '#737373',
                letterSpacing: '0.02em',
                pointerEvents: 'none',
              }}
              dangerouslySetInnerHTML={{ __html: cleanFooter }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};
