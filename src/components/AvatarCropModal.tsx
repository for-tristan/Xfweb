'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropModalProps {
  open: boolean;
  imageFile: File | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  const percentCrop = centerCrop(
    makeAspectCrop(
      { unit: '%', width: 80 },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
  return convertToPixelCrop(percentCrop, mediaWidth, mediaHeight);
}

export function AvatarCropModal({ open, imageFile, onClose, onCropComplete }: AvatarCropModalProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number>(1);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageFile) {
      setImgSrc('');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(imageFile);
    return () => reader.abort();
  }, [imageFile]);

  useEffect(() => {
    if (!open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setUploading(false);
    }
  }, [open]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, aspect);
    setCrop(crop);
    setCompletedCrop(crop);
  }

  function handleAspectChange(newAspect: number) {
    setAspect(newAspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, newAspect);
      setCrop(newCrop);
      setCompletedCrop(newCrop);
    }
  }

  async function handleConfirm() {
    if (!completedCrop || !imgRef.current || !imageFile) return;
    setUploading(true);

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      const pixelCrop = completedCrop.unit === '%'
        ? convertToPixelCrop(completedCrop, image.width, image.height)
        : completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropWidth = pixelCrop.width * scaleX;
      const cropHeight = pixelCrop.height * scaleY;

      const maxSize = 400;
      const outputScale = Math.min(maxSize / cropWidth, maxSize / cropHeight, 1);
      canvas.width = Math.round(cropWidth * outputScale);
      canvas.height = Math.round(cropHeight * outputScale);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const cropX = pixelCrop.x * scaleX;
      const cropY = pixelCrop.y * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          0.92,
        );
      });

      onCropComplete(blob);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setUploading(false);
    }
  }

  if (!open || !imgSrc) return null;

  const aspectOptions = [
    { label: '1:1', value: 1, name: 'Square' },
    { label: '4:5', value: 4 / 5, name: 'Portrait' },
    { label: '3:4', value: 3 / 4, name: 'Tall' },
    { label: 'Free', value: 0, name: 'Free' },
  ];

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Adjust profile picture"
      data-lenis-prevent
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
        backdropFilter: 'blur(24px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-heading, Inter Tight)',
            fontWeight: 800,
            fontSize: 16,
            color: 'var(--text-light)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <i className="fa-solid fa-crop-alt" style={{ color: 'var(--accent)', fontSize: 14 }} />
            Adjust Profile Picture
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'color-mix(in srgb, var(--text-light) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
              color: 'var(--text-dim)',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>

        <div style={{
          padding: '16px 20px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.3)',
          minHeight: 280,
        }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect || undefined}
            circularCrop={true}
            style={{ maxWidth: '100%' }}
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                display: 'block',
              }}
            />
          </ReactCrop>
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginRight: 4,
          }}>
            Ratio:
          </span>
          {aspectOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleAspectChange(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: aspect === opt.value ? 'var(--accent)' : 'color-mix(in srgb, var(--border-color) 60%, transparent)',
                background: aspect === opt.value ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                color: aspect === opt.value ? 'var(--accent)' : 'var(--text-dim)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-heading, Inter Tight)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={opt.name}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
              background: 'transparent',
              color: 'var(--text-dim)',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-heading, Inter Tight)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!completedCrop || uploading}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--text-light)',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-heading, Inter Tight)',
              cursor: uploading || !completedCrop ? 'not-allowed' : 'pointer',
              opacity: !completedCrop || uploading ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            {uploading ? (
              <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />Processing...</>
            ) : (
              <><i className="fa-solid fa-check" style={{ marginRight: 8 }} />Apply</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
