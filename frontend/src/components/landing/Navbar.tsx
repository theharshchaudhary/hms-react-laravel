import { useState, useEffect } from 'react';
import { HeartPulse, Menu, X, Calendar } from 'lucide-react';
import { navigate } from '@/router/Router';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Departments', href: '#departments' },
    { label: 'Doctors', href: '#doctors' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-soft' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button onClick={() => handleNav('#home')} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold text-gray-900">MediCore</span>
        </button>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button onClick={() => navigate('/login')} className="btn-ghost">Sign In</button>
          <button onClick={() => navigate('/book')} className="btn-primary">
            <Calendar className="h-4 w-4" />
            Book Appointment
          </button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 animate-slide-up lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="rounded-lg px-4 py-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-primary-600"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3">
              <button onClick={() => navigate('/login')} className="btn-secondary flex-1">Sign In</button>
              <button onClick={() => navigate('/book')} className="btn-primary flex-1">Book Appointment</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
