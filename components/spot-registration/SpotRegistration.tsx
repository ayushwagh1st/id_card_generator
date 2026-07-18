'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner), {
  ssr: false,
});
import { toast } from 'sonner';

export function SpotRegistration() {
  const [mode, setMode] = useState<'register' | 'attendance'>('register');
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [scannedSerial, setScannedSerial] = useState<string | null>(null);
  const [childData, setChildData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Form State
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: true });
    if (!error && data) {
      setSessions(data);
    }
  };

  const handleScan = async (result: string) => {
    if (scannedId === result) return; // Prevent duplicate immediate scans
    setScannedId(result);
    setLoading(true);

    try {
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('serial_number')
        .eq('id', result)
        .single();
        
      if (qrData) {
         setScannedSerial(`MSS-2027-${String(qrData.serial_number).padStart(3, '0')}`);
      } else {
         setScannedSerial(null);
      }

      const { data, error } = await supabase
        .from('children')
        .select('*, session:sessions(name)')
        .eq('qr_id', result)
        .single();

      if (data) {
        setChildData(data);
        if (mode === 'attendance') {
          const currentStatus = data.status || 'Registered';
          const newStatus = currentStatus === 'Checked In' ? 'Checked Out' : 'Checked In';
          const now = new Date().toISOString();
          
          await supabase.from('children').update({
            status: newStatus,
            ...(newStatus === 'Checked In' ? { checked_in_at: now } : { checked_out_at: now })
          }).eq('id', data.id);
          
          setChildData({ ...data, status: newStatus });
          toast.success(`Successfully ${newStatus === 'Checked In' ? 'checked in' : 'checked out'} ${data.name}`);
          
          // Auto-reset after a few seconds in attendance mode for fast scanning
          setTimeout(() => {
            setScannedId(null);
            setScannedSerial(null);
            setChildData(null);
          }, 2000);
        } else {
          toast.info("Child already registered for this QR!");
        }
      } else {
        if (mode === 'attendance') {
          toast.error("This QR code is not registered yet.");
          setTimeout(() => setScannedId(null), 2000);
        } else {
          setChildData(null);
          setName('');
          setContact('');
          setSessionId('');
          toast.success("New QR Scanned. Please register the child.");
        }
      }
    } catch (err) {
      toast.error("Invalid QR Code or Error fetching data");
      setScannedId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedId || !name || !sessionId) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('children')
        .insert([{
          qr_id: scannedId,
          name: name,
          contact_number: contact,
          session_id: sessionId
        }])
        .select('*, session:sessions(name)')
        .single();

      if (error) throw error;
      
      toast.success("Child successfully registered!");
      setChildData(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to register child");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedId(null);
    setScannedSerial(null);
    setChildData(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Scanner Portal</CardTitle>
              <CardDescription>Scan a sticker to register or manage attendance.</CardDescription>
            </div>
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button 
                variant={mode === 'register' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => { setMode('register'); resetScanner(); }}
              >
                Register Mode
              </Button>
              <Button 
                variant={mode === 'attendance' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => { setMode('attendance'); resetScanner(); }}
              >
                Attendance Mode
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!scannedId ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-w-sm aspect-square overflow-hidden rounded-lg border-2 border-dashed">
                <Scanner
                  onScan={(result) => handleScan(result[0].rawValue)}
                  allowMultiple={false}
                  scanDelay={1000}
                />
              </div>
              <p className="text-sm text-muted-foreground">Point your camera at the QR code sticker</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  QR Scanned: <span className="text-primary font-mono text-sm">{scannedSerial || `${scannedId.slice(0,8)}...`}</span>
                </h3>
                <Button variant="outline" size="sm" onClick={resetScanner}>Scan Another</Button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Checking database...</div>
              ) : childData ? (
                <Card className="bg-muted/50 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl">{childData.name}</CardTitle>
                    <CardDescription>Already Registered</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-semibold">Contact:</span> {childData.contact_number || 'N/A'}</div>
                    <div><span className="font-semibold">Session:</span> {childData.session?.name || 'Unknown'}</div>
                    <div><span className="font-semibold">Registered:</span> {new Date(childData.created_at).toLocaleString()}</div>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Child's Name <span className="text-red-500">*</span></Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter full name" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact">Guardian Contact (Optional)</Label>
                    <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone number" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session">Assign Session <span className="text-red-500">*</span></Label>
                    <Select value={sessionId} onValueChange={(val) => setSessionId(val || '')} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a session">
                          {sessionId ? sessions.find(s => s.id === sessionId)?.name : "Select a session"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} - {s.date}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
