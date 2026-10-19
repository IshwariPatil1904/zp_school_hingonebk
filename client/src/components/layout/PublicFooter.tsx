import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Mail, Phone, MapPin, Calendar, Heart } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const PublicFooter: React.FC = () => {
  const { t, tBilingual } = useLanguage();

  return (
    <footer className="bg-hero-green text-white/90 border-t-4 border-saffron-orange">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: School Identity */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-saffron-orange flex flex-col items-center justify-center text-white font-black text-xs shrink-0 shadow">
                <span>ZP</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  {tBilingual('जि. प. प्राथमिक शाळा, हिंगोणे बु.', 'ZP School Hingone BK')}
                </h3>
                <p className="text-xs text-white/80">
                  {tBilingual('ता. धरणगाव, जि. जळगाव', 'Tal. Dharangaon, Dist. Jalgaon')}
                </p>
              </div>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              {tBilingual(
                'हिंगोणे बु. येथील प्रत्येक बालकासाठी दर्जेदार, मूल्यधिष्ठित शिक्षण, डिजिटल साक्षरता व सर्वांगीण व्यक्तिमत्त्व विकासासाठी कटिबद्ध.',
                'Committed to imparting value-based, joyful rural primary education, digital literacy, and holistic personality growth for every child in Hingone BK.'
              )}
            </p>
            <div className="inline-block bg-white/10 text-saffron-orange px-2.5 py-1 rounded text-xs font-mono font-medium">
              UDISE: 27030804501
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-saffron-orange" /> {tBilingual('मार्गदर्शन दुवे', 'Navigation')}
            </h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li>
                <Link to="/" className="hover:text-saffron-orange transition-colors">{t('nav.home')}</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-saffron-orange transition-colors">{t('nav.about')}</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-saffron-orange transition-colors">{t('nav.gallery')}</Link>
              </li>
              <li>
                <Link to="/academics" className="hover:text-saffron-orange transition-colors">{t('nav.academics')}</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-saffron-orange transition-colors">{t('nav.contact')}</Link>
              </li>
              <li>
                <Link to="/login" className="text-saffron-orange hover:underline font-medium">{t('nav.portal')}</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Govt Educational Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Government Portals
            </h4>
            <ul className="space-y-2 text-xs text-white/80">
              <li>
                <a href="https://education.maharashtra.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-saffron-orange transition-colors">
                  • School Education Dept, Maharashtra
                </a>
              </li>
              <li>
                <a href="https://pmposhan.education.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-saffron-orange transition-colors">
                  • PM POSHAN (Mid-Day Meal Scheme)
                </a>
              </li>
              <li>
                <a href="https://udiseplus.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-saffron-orange transition-colors">
                  • UDISE+ Portal
                </a>
              </li>
              <li>
                <a href="https://scertmaha.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-saffron-orange transition-colors">
                  • SCERT Maharashtra (विद्या परिषद)
                </a>
              </li>
              <li>
                <a href="https://diksha.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-saffron-orange transition-colors">
                  • DIKSHA e-Learning Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Timings */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              School Office
            </h4>
            <div className="space-y-2.5 text-xs text-white/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-saffron-orange shrink-0 mt-0.5" />
                <span>At Post Hingone BK, Taluka Dharangaon, District Jalgaon, Maharashtra - 425105</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-saffron-orange shrink-0" />
                <span>+91 98234 56789</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-saffron-orange shrink-0" />
                <span>zpschoolhingonebk@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-saffron-orange shrink-0" />
                <span>Monday - Saturday: 10:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-white/60 gap-3">
          <p>
            © {new Date().getFullYear()} Zilla Parishad Primary School, Hingone BK (जि. प. प्राथमिक शाळा हिंगोणे बु.). All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Empowering Rural Students with Excellence <Heart className="w-3.5 h-3.5 text-saffron-orange fill-saffron-orange" />
          </p>
        </div>
      </div>
    </footer>
  );
};
