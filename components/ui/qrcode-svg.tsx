import React, { useMemo } from 'react';
import QRCode from 'qrcode';

export interface QRCodeSVGProps extends React.SVGProps<SVGSVGElement> {
  value: string;
  size?: number | string;
  level?: 'L' | 'M' | 'Q' | 'H';
  fgColor?: string;
  bgColor?: string;
  marginSize?: number;
  includeMargin?: boolean;
}

export function QRCodeSVG({
  value,
  size = 128,
  level = 'M',
  fgColor = '#000000',
  bgColor = '#ffffff',
  marginSize = 2,
  includeMargin = true,
  style,
  ...rest
}: QRCodeSVGProps) {
  const effectiveMargin = includeMargin ? marginSize : 0;
  const meta = useMemo(() => {
    if (!value) return null;
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: level });
      const count = qr.modules.size;
      let d = '';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.modules.get(r, c)) {
            d += `M${c + effectiveMargin},${r + effectiveMargin}h1v1h-1z `;
          }
        }
      }
      return { d, size: count + effectiveMargin * 2 };
    } catch {
      return null;
    }
  }, [value, level, effectiveMargin]);

  if (!meta) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${meta.size} ${meta.size}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={style}
      {...rest}
    >
      <rect width="100%" height="100%" fill={bgColor} />
      <path d={meta.d} fill={fgColor} />
    </svg>
  );
}
