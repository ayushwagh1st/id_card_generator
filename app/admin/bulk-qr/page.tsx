'use client';

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { QRCodeSVG } from '@/components/ui/qrcode-svg';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';

export default function BulkQRPage() {
  const [quantity, setQuantity] = useState<number>(10);
  const [generatedData, setGeneratedData] = useState<{ id: string, serial_number: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const generateUUIDs = async () => {
    setLoading(true);
    try {
      const inserts = Array.from({ length: quantity }, () => ({}));
      const { data, error } = await supabase
        .from('qr_codes')
        .insert(inserts)
        .select('id, serial_number');

      if (error) throw error;
      if (data) setGeneratedData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const response = await fetch('/kids_sticker.jpg');
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Background = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const stickersPerRow = 3;
      const stickersPerCol = 4;
      const stickerSize = 60;
      const marginX = (210 - (stickersPerRow * stickerSize)) / (stickersPerRow + 1);
      const marginY = 15;
      const spacingY = (297 - (2 * marginY) - (stickersPerCol * stickerSize)) / (stickersPerCol - 1);

      let currentSticker = 0;

      for (let i = 0; i < generatedData.length; i++) {
        const item = generatedData[i];

        if (i > 0 && i % (stickersPerRow * stickersPerCol) === 0) {
          doc.addPage();
          currentSticker = 0;
        }

        const row = Math.floor(currentSticker / stickersPerRow);
        const col = currentSticker % stickersPerRow;

        const x = marginX + (col * (stickerSize + marginX));
        const y = marginY + (row * (stickerSize + spacingY));

        doc.addImage(base64Background, 'JPEG', x, y, stickerSize, stickerSize);

        const qrDataUrl = await QRCode.toDataURL(item.id, {
          margin: 1,
          width: 300,
          color: { dark: '#000000', light: '#ffffff' }
        });

        const qrSize = stickerSize * 0.38;
        const qrX = x + (stickerSize - qrSize) / 2;
        const qrY = y + (stickerSize - qrSize) / 2 - 3.5; // Adjusted 1mm down as requested

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 2, 2, 'F');
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        const serial = `MSS-2027-${String(item.serial_number).padStart(3, '0')}`;
        const textY = qrY + qrSize + 4; // Text directly below QR
        const textX = x + (stickerSize / 2);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const textWidth = doc.getTextWidth(serial);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(textX - (textWidth / 2) - 2, textY - 3, textWidth + 4, 4.5, 1, 1, 'FD');

        doc.setTextColor(0, 0, 0);
        doc.text(serial, textX, textY, { align: 'center' });

        currentSticker++;
      }

      doc.save('Kids_Exhibition_QR_Stickers.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3 border-b border-border pb-7">
        <h1>Bulk QR stickers</h1>
        <p className="text-muted-foreground">Prepare QR stickers for on-the-spot child registration.</p>
      </header>
      <Card className="max-w-lg mb-8">
        <CardHeader>
          <CardTitle>Generate a batch</CardTitle>
          <CardDescription>Choose how many stickers to prepare, then download the printable PDF.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Stickers to Generate</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={generateUUIDs} className="w-full" disabled={loading}>
            {loading ? 'Generating...' : `Generate ${quantity} QRs`}
          </Button>
          {generatedData.length > 0 && (
            <Button onClick={downloadPDF} variant="outline" className="w-full">
              Download PDF
            </Button>
          )}
        </CardFooter>
      </Card>

      {generatedData.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-bold mb-4">Preview</h2>
          <div className="opacity-50 pointer-events-none mb-4 text-sm text-muted-foreground">
            * This is a low-opacity preview. The actual printed page will be full quality.
          </div>



          {/* Screen Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70">
            {generatedData.slice(0, 4).map((item) => {
              const serial = `MSS-2027-${String(item.serial_number).padStart(3, '0')}`;
              return (
                <div key={item.id} className="relative w-full aspect-square border border-dashed border-gray-200 rounded-full overflow-hidden">
                  <img
                    src="/kids_sticker.jpg"
                    alt="Sticker Template"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pb-2">
                    <div className="bg-white p-1 rounded-md" style={{ width: '38%', aspectRatio: '1/1' }}>
                      <QRCodeSVG value={item.id} style={{ width: '100%', height: '100%' }} level="M" />
                    </div>
                    <div className="mt-1 text-center bg-white px-2 rounded-full font-bold text-black text-[10px] tracking-wider border border-gray-100 shadow-sm">
                      {serial}
                    </div>
                  </div>
                </div>
              );
            })}
            {generatedData.length > 4 && (
              <div className="flex items-center justify-center text-muted-foreground font-medium">
                + {generatedData.length - 4} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
