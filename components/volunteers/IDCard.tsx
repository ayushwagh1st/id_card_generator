import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'

interface IDCardProps {
  volunteer: {
    id: string
    snk_id?: string
    name: string
    mobile: string
    model: string
    branch?: string
    headName?: string
    role: string
    photoUrl?: string
    accommodation?: boolean
    emergencyContact: string
  }
  size?: 'standard' | 'large'
  side?: 'front' | 'back'
}

const CardWrapper = ({ children, width, height }: { children: React.ReactNode, width: string, height: string }) => (
  <div 
    className="relative bg-white flex flex-col items-center select-none overflow-hidden"
    style={{ 
      width: width, 
      height: height,
      outline: '0.5px solid #ccc',
      outlineOffset: '-0.5px'
    }}
  >
    <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-black z-50"></div>
    <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-black z-50"></div>
    <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-black z-50"></div>
    <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-black z-50"></div>
    {children}
  </div>
)

export function IDCard({ volunteer, size = 'standard', side = 'front' }: IDCardProps) {
  const displayId = volunteer.snk_id || volunteer.id.substring(0, 8).toUpperCase()
  
  const qrData = JSON.stringify({
    id: displayId,
    name: volunteer.name,
    model: volunteer.model,
    role: volunteer.role,
    mobile: volunteer.mobile
  })

  const dims = size === 'standard' 
    ? { width: '54mm', height: '86mm', photo: { w: '30mm', h: '35mm' }, qr: 64 } 
    : { width: '60mm', height: '95mm', photo: { w: '34mm', h: '40mm' }, qr: 76 }

  // Verification URL for back QR
  // Always use the live domain so cards printed from localhost still scan correctly!
  const baseUrl = 'https://keidportal.qzz.io'
  const verifyUrl = `${baseUrl}/verify/${volunteer.id}`

  if (side === 'front') {
    return (
      <CardWrapper width={dims.width} height={dims.height}>
        {/* Accommodation Indicator (Top Right Edge) */}
        <div 
          className={`absolute top-[20mm] right-0 w-[3mm] h-[6mm] rounded-l-full z-40 border border-r-0 border-white/50 shadow-sm ${
            volunteer.accommodation ? 'bg-green-500' : 'bg-red-500'
          }`} 
        />

        {/* Left Vertical Red Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[12mm] bg-[#EF4444] flex items-center justify-center z-20 shadow-[2px_0_4px_rgba(0,0,0,0.15)]">
          <span className="text-white font-black text-[11px] uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Kids Exhibition 2027
          </span>
        </div>

        {/* Main Content Area */}
        <div className="w-[calc(100%-12mm)] self-end flex flex-col pt-1 pb-1 pr-1 pl-1 relative z-10 h-full bg-white overflow-hidden">
          
          {/* Top Banner (colorful) */}
          <div className="flex flex-col items-center justify-center ml-1 mb-1 z-30 pt-1 relative">
            <div className="absolute -left-2 -top-1 text-lg z-40 transform -rotate-12 drop-shadow-sm">🚀</div>
            <div className="bg-[#4CAF50] text-white text-[5.5px] font-bold px-2 py-[1px] rounded-full mb-[1px] shadow-sm z-10 border border-white/20">Mumbai, 2027</div>
            <div className="bg-[#FF9800] text-white text-[6px] font-black px-2 py-[1px] rounded-full mb-[1px] shadow-sm uppercase z-10 border border-white/20">60th Maharashtra Samagam</div>
          </div>

          {/* Photo and Blue Circle */}
          <div className="flex justify-center items-center relative mt-1 pl-1 z-30">
            <div 
              className="bg-white border-[1.5px] border-gray-300 flex items-center justify-center overflow-hidden z-20 shadow-sm"
              style={{ width: dims.photo.w, height: dims.photo.h }}
            >
              {volunteer.photoUrl ? (
                <Image src={volunteer.photoUrl} alt={`${volunteer.name}'s portrait`} width={120} height={150} unoptimized className="w-full h-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Photo</span>
              )}
            </div>
            {/* Blue circle on the right */}
            <div className="absolute right-[2mm] top-[4mm] w-[8mm] h-[8mm] bg-[#1E88E5] rounded-full z-10 shadow-sm"></div>
          </div>

          {/* Text Fields (Old style) */}
          <div className="flex-1 flex flex-col justify-start mt-2 space-y-[3px] pl-2 pr-1 w-full text-[8.5px] text-gray-700 font-semibold relative z-30">
            <div className="flex items-end border-b-[0.5px] border-gray-400 pb-[1px]">
              <span className="w-[11mm] flex-shrink-0">Name:</span>
              <span className="font-bold text-black text-[11px] leading-none pl-1 truncate flex-1">{volunteer.name}</span>
            </div>
            <div className="flex items-end border-b-[0.5px] border-gray-400 pb-[1px]">
              <span className="w-[16mm] flex-shrink-0">Model Name:</span>
              <span className="font-bold text-black text-[10px] leading-none pl-1 truncate flex-1">{volunteer.model}</span>
            </div>
            <div className="flex items-end border-b-[0.5px] border-gray-400 pb-[1px]">
              <span className="w-[20mm] flex-shrink-0">Incharge Name:</span>
              <span className="font-bold text-black text-[10px] leading-none pl-1 truncate flex-1">{volunteer.headName || 'N/A'}</span>
            </div>
            <div className="flex items-end border-b-[0.5px] border-gray-400 pb-[1px]">
              <span className="w-[11mm] flex-shrink-0">Branch:</span>
              <span className="font-bold text-black text-[10px] leading-none pl-1 truncate flex-1">{volunteer.branch || 'N/A'}</span>
            </div>
            
            {/* System Fields (Subtle) */}
            <div className="flex justify-between pt-[2px]">
               <span className="text-[6.5px] text-gray-400 font-mono tracking-wider">{displayId}</span>
               <span className="text-[6.5px] text-gray-400 font-bold uppercase">{volunteer.role}</span>
            </div>
          </div>

          {/* Footer Area */}
          <div className="w-full flex justify-between items-end mt-auto pt-1 pl-2 relative z-30">
            <div className="flex flex-col items-start pb-[2px]">
               <span className="text-[6px] font-bold text-gray-700">Authorised Sign</span>
               <div className="w-[15mm] border-b-[0.5px] border-gray-800 mt-4"></div>
            </div>
            <div className="text-[20px] leading-none drop-shadow-md z-30 -mb-1 mr-1 opacity-90 grayscale-[10%]">👦🏻👧🏻</div>
          </div>
          
          {/* Decorative Bottom Swoosh */}
          <div className="absolute -bottom-2 -right-2 w-[22mm] h-[16mm] bg-[#1A237E] rounded-tl-full opacity-90 z-10 shadow-inner"></div>
        </div>
      </CardWrapper>
    )
  }

  // Back Side
  return (
    <CardWrapper width={dims.width} height={dims.height}>
      {/* Header */}
      <div 
        className="w-full bg-[#111] text-white flex flex-col justify-center items-center"
        style={{ height: '10%' }}
      >
        <h4 className="text-[9px] font-bold uppercase tracking-widest">Instructions & Contact</h4>
      </div>

      <div className="flex-1 w-full px-2.5 py-2 flex flex-col justify-between text-black">
        
        {/* Contacts */}
        <div>
          <h5 className="font-extrabold text-[7.5px] uppercase border-b border-gray-300 pb-[1px] mb-1">Contact Details</h5>
          <div className="space-y-[1px] text-[7px] font-bold">
            <div className="flex justify-between"><span>Mobile:</span> <span>{volunteer.mobile}</span></div>
            <div className="flex justify-between"><span>Emergency:</span> <span>{volunteer.emergencyContact}</span></div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-1.5">
          <h5 className="font-extrabold text-[7.5px] uppercase border-b border-gray-300 pb-[1px] mb-1">Guidelines</h5>
          <ul className="list-disc pl-2.5 space-y-[1.5px] text-[6.5px] font-semibold leading-tight pr-1">
            <li>Wear ID card at all times while on duty.</li>
            <li>This card is non-transferable.</li>
            <li>Return if found to the central help desk.</li>
            <li>Follow all rules & instructions.</li>
            <li>Valid only during the 2027 event period.</li>
          </ul>
        </div>

        {/* Verification */}
        <div className="mt-auto pt-2 flex flex-col items-center justify-center">
          <div className="p-1 bg-white border border-gray-200 rounded">
            <QRCodeSVG value={verifyUrl} size={dims.qr} level="M" />
          </div>
          <span className="text-[5px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Scan to Verify Volunteer Profile</span>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center border-t border-gray-300 pt-1">
          <p className="text-[6px] font-bold uppercase">Sant Nirankari Mandal</p>
          <p className="text-[5.5px] text-gray-600">www.nirankari.org</p>
        </div>
      </div>
    </CardWrapper>
  )
}
