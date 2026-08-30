import { HeartPulse, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-white">MediCore</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              Providing world-class healthcare with compassion and cutting-edge technology for over 25 years.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition-colors hover:bg-primary-600 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Quick Links</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {['About Us', 'Our Services', 'Departments', 'Find a Doctor', 'Book Appointment'].map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-primary-400">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Services</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {['Emergency Care', 'Cardiology', 'Neurology', 'Pediatrics', 'Telemedicine'].map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-primary-400">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                <span>123 Healthcare Blvd, Springfield, IL 62704</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary-400" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary-400" />
                <span>info@medicore.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; {year} MediCore Hospital Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
