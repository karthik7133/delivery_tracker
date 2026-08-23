import PackageScene from '../../three/PackageScene';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* 3D Background */}
      <PackageScene />

      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-sky-950/20" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="relative z-10 pt-16">
        {children}
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f1f5f9',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}
