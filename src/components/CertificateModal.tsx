'use client';

import { useRef, useCallback } from 'react';

interface CertificateData {
  userName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
}

interface CertificateModalProps {
  open: boolean;
  onClose: () => void;
  data: CertificateData | null;
  loading: boolean;
}

export default function CertificateModal({ open, onClose, data, loading }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!data) return;
    try {
      // FIX: Use the actual courseId from certificate data instead of hardcoded 'ml-bootcamp'
      const res = await fetch(`/api/courses/certificate?courseId=${encodeURIComponent(data.certificateId)}&format=pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `XFoundry_Certificate_${data.courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('PDF download failed:', e);
    }
  }, [data]);

  if (!open) return null;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .certificate-print-area,
          .certificate-print-area * {
            visibility: visible !important;
          }
          .certificate-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
          }
          .cert-no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="cert-no-print"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal container */}
        <div
          style={{
            background: '#111',
            borderRadius: 16,
            maxWidth: 960,
            width: '100%',
            maxHeight: '95vh',
            overflow: 'auto',
            border: '1px solid rgba(220, 20, 60, 0.2)',
            boxShadow: '0 0 80px rgba(220, 20, 60, 0.15)',
          }}
        >
          {/* Modal header */}
          <div
            className="cert-no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#efefef', fontSize: 16, fontWeight: 700 }}>
              <i className="fa-solid fa-certificate" style={{ color: 'var(--accent)', marginRight: 8 }} />
              Certificate of Completion
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDownloadPDF}
                style={{
                  padding: '8px 16px',
                  background: 'var(--success-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#16a34a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--success-color)'; }}
              >
                <i className="fa-solid fa-file-pdf" /> Download PDF
              </button>
              <button
                onClick={handlePrint}
                style={{
                  padding: '8px 16px',
                  background: 'var(--primary-red)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#b91c1c'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-red)'; }}
              >
                <i className="fa-solid fa-print" /> Print / Save as PDF
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#999',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-color)'; e.currentTarget.style.borderColor = 'var(--error-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#999'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
          </div>

          {/* Certificate content */}
          <div style={{ padding: 24 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)', marginBottom: 16 }} />
                <p style={{ color: '#999', fontFamily: 'Space Grotesk, sans-serif' }}>Generating your certificate...</p>
              </div>
            ) : data ? (
              <div ref={certRef} className="certificate-print-area" style={{ display: 'flex', justifyContent: 'center' }}>
                {/* A4 Landscape Certificate */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 900,
                    aspectRatio: '297 / 210',
                    background: '#fffdf8',
                    border: '3px solid #dc143c',
                    position: 'relative',
                    padding: '50px 60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  }}
                >
                  {/* Inner decorative border */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      right: 12,
                      bottom: 12,
                      border: '1px solid #dc143c',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Corner accents */}
                  <div style={{ position: 'absolute', top: 8, left: 8, width: 30, height: 30, borderTop: '2px solid #dc143c', borderLeft: '2px solid #dc143c' }} />
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderTop: '2px solid #dc143c', borderRight: '2px solid #dc143c' }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 8, width: 30, height: 30, borderBottom: '2px solid #dc143c', borderLeft: '2px solid #dc143c' }} />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderBottom: '2px solid #dc143c', borderRight: '2px solid #dc143c' }} />

                  {/* Decorative top line */}
                  <div style={{ width: 80, height: 2, background: 'var(--primary-red)', marginBottom: 20 }} />

                  {/* Brand */}
                  <div
                    style={{
                      fontFamily: '"Orbitron", sans-serif',
                      fontSize: 28,
                      fontWeight: 900,
                      color: 'var(--primary-red)',
                      letterSpacing: 4,
                      marginBottom: 8,
                    }}
                  >
                    X.FOUNDRY
                  </div>

                  {/* Title */}
                  <h1
                    style={{
                      fontSize: 36,
                      color: '#1a1a1a',
                      fontWeight: 400,
                      letterSpacing: 6,
                      textTransform: 'uppercase',
                      marginBottom: 6,
                      marginTop: 4,
                    }}
                  >
                    Certificate of Completion
                  </h1>

                  {/* Decorative divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <div style={{ width: 60, height: 1, background: 'var(--primary-red)' }} />
                    <div style={{ width: 8, height: 8, border: '1px solid #dc143c', transform: 'rotate(45deg)' }} />
                    <div style={{ width: 60, height: 1, background: 'var(--primary-red)' }} />
                  </div>

                  {/* "This certifies that" */}
                  <p style={{ fontSize: 14, color: '#666', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
                    This certifies that
                  </p>

                  {/* Student name */}
                  <h2
                    style={{
                      fontSize: 38,
                      color: '#1a1a1a',
                      fontWeight: 700,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      borderBottom: '2px solid #dc143c',
                      paddingBottom: 8,
                      marginBottom: 12,
                      paddingLeft: 40,
                      paddingRight: 40,
                    }}
                  >
                    {data.userName}
                  </h2>

                  {/* "has successfully completed" */}
                  <p style={{ fontSize: 14, color: '#666', letterSpacing: 2, marginBottom: 8 }}>
                    has successfully completed the course
                  </p>

                  {/* Course name */}
                  <h3
                    style={{
                      fontSize: 26,
                      color: 'var(--primary-red)',
                      fontWeight: 700,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      marginBottom: 30,
                    }}
                  >
                    {data.courseName}
                  </h3>

                  {/* Bottom info row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      maxWidth: 600,
                      gap: 20,
                    }}
                  >
                    {/* Completion date */}
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                        Date of Completion
                      </p>
                      <p style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>
                        {data.completionDate}
                      </p>
                    </div>

                    {/* Certificate ID */}
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                        Certificate ID
                      </p>
                      <p style={{ fontSize: 14, color: '#333', fontWeight: 600, fontFamily: 'monospace' }}>
                        {data.certificateId}
                      </p>
                    </div>
                  </div>

                  {/* Signature line */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: 36,
                      width: '100%',
                      maxWidth: 600,
                    }}
                  >
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ width: 200, borderBottom: '1px solid #ccc', margin: '0 auto 6px' }} />
                      <p style={{ fontSize: 11, color: '#999', letterSpacing: 1 }}>X.Foundry Director</p>
                    </div>
                  </div>

                  {/* Bottom decorative line */}
                  <div style={{ width: 80, height: 2, background: 'var(--primary-red)', marginTop: 20 }} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: 32, color: 'var(--warning-color)', marginBottom: 16 }} />
                <p style={{ color: '#999', fontFamily: 'Space Grotesk, sans-serif' }}>No certificate data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
