import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { tBilingual } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Parent',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-10 bg-white dark:bg-dark-bg text-main-text dark:text-dark-text transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Banner */}
        <div className="border-b border-border-green dark:border-dark-border pb-6">
          <Badge variant="green" size="md">
            {tBilingual('संपर्क व तक्रार निवारण', 'Contact & Grievance Redressal')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-main-text dark:text-dark-text mt-2">
            {tBilingual('शाळेशी संपर्क साधा', 'Get in Touch with Our School')}
          </h1>
          <p className="text-sm text-muted-text dark:text-dark-muted mt-1">
            {tBilingual(
              'जि. प. प्राथमिक शाळा, हिंगोणे बु., ता. धरणगाव, जि. जळगाव, महाराष्ट्र - ४२५१०५',
              'Z.P. Primary School, Hingone BK, Tal. Dharangaon, Dist. Jalgaon, Maharashtra - 425105'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Contact details & Suggestion Box */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-border-green dark:border-dark-border p-6 space-y-4 bg-white dark:bg-dark-card">
              <h2 className="text-lg font-bold text-main-text dark:text-dark-text">
                {tBilingual('शालेय कार्यालय संपर्क माहिती', 'Administrative Office Information')}
              </h2>
              <div className="space-y-3 text-xs text-main-text dark:text-dark-text">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary-green dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{tBilingual('पत्ता:', 'Address:')}</span>
                    <span className="text-muted-text dark:text-dark-muted">
                      {tBilingual(
                        'मु. पो. हिंगोणे बु., तालुका धरणगाव, जिल्हा जळगाव, महाराष्ट्र - ४२५१०५',
                        'At Post Hingone BK, Taluka Dharangaon, District Jalgaon, Maharashtra - 425105'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary-green dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{tBilingual('दूरध्वनी:', 'Helpline Phone:')}</span>
                    <span className="text-muted-text dark:text-dark-muted">+91 98234 56789 / 0257-234567</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary-green dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{tBilingual('ईमेल:', 'Official Email:')}</span>
                    <span className="text-muted-text dark:text-dark-muted">zpschoolhingonebk@gmail.com</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-primary-green dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{tBilingual('कार्यालयीन वेळ:', 'Office Timings:')}</span>
                    <span className="text-muted-text dark:text-dark-muted">
                      {tBilingual(
                        'सोमवार ते शनिवार: सकाळी १०:०० ते संध्याकाळी ५:०० पर्यंत',
                        'Monday to Saturday: 10:00 AM to 5:00 PM'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Grievance box card with real photo */}
            <Card className="border-2 border-saffron-orange/40 bg-light-green/40 dark:bg-dark-secondary/60 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-saffron-orange" />
                <h3 className="font-bold text-sm text-main-text dark:text-dark-text">
                  {tBilingual('विद्यार्थी तक्रार व सूचना पेटी', 'Student Grievance & Suggestion Box')}
                </h3>
              </div>
              <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
                {tBilingual(
                  'विद्यार्थ्यांना सुरक्षित, निर्भय व पारदर्शक वातावरण मिळण्यासाठी शाळेत प्रत्यक्ष तक्रार व सूचना पेटी लावण्यात आली आहे.',
                  'To ensure a fearless, safe, and transparent school campus, a dedicated grievance and suggestion box is maintained on the school premises.'
                )}
              </p>
              <div className="rounded-xl overflow-hidden border border-border-green dark:border-dark-border">
                <img src="/imgs/complent_box.jpg" alt="Complaint Box" className="w-full h-44 object-cover" />
              </div>
            </Card>
          </div>

          {/* Right Column: Interactive Feedback / Inquiry Form */}
          <div className="lg:col-span-7">
            <Card className="border border-border-green dark:border-dark-border p-6 sm:p-8 bg-white dark:bg-dark-card">
              <h2 className="text-xl font-bold text-main-text dark:text-dark-text mb-2">
                {tBilingual('पालक व ग्रामस्थ संपर्क अर्ज', 'Parent & Community Inquiry Form')}
              </h2>
              <p className="text-xs text-muted-text dark:text-dark-muted mb-6">
                {tBilingual(
                  'प्रवेश प्रक्रिया, शालेय पोषण आहार किंवा कोणत्याही समस्येसाठी खालील फॉर्म भरा.',
                  'Submit your inquiries regarding admissions, nutrition program, or student welfare below.'
                )}
              </p>

              {submitted ? (
                <div className="p-6 bg-light-green dark:bg-dark-secondary border border-primary-green/30 dark:border-emerald-500/30 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-primary-green dark:text-emerald-400 mx-auto" />
                  <h3 className="font-bold text-base text-main-text dark:text-dark-text">
                    {tBilingual('आपला संदेश यशस्वीरीत्या प्राप्त झाला!', 'Your Message Has Been Received!')}
                  </h3>
                  <p className="text-xs text-muted-text dark:text-dark-muted">
                    {tBilingual(
                      'मुख्याध्यापक कार्यालय आपल्या संदेशाची दखल घेऊन २४ तासांत संपर्क करेल.',
                      'The Headmaster office will review your inquiry and follow up within 24 hours.'
                    )}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSubmitted(false)} className="mt-3">
                    {tBilingual('दुसरा संदेश पाठवा', 'Send Another Message')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('आपले पूर्ण नाव', 'Your Full Name')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={tBilingual('उदा. रमेश पाटील', 'e.g. Ramesh Patil')}
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                        {tBilingual('मोबाईल क्रमांक', 'Mobile Phone Number')} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="9823456789"
                        className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('आपली भूमिका', 'Your Role / Relationship')}
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    >
                      <option value="Parent">{tBilingual('पालक', 'Parent / Guardian')}</option>
                      <option value="Alumni">{tBilingual('माजी विद्यार्थी', 'Alumni')}</option>
                      <option value="Villager">{tBilingual('ग्रामस्थ', 'Local Resident')}</option>
                      <option value="Other">{tBilingual('इतर', 'Other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('विषय', 'Subject')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={tBilingual('उदा. इयत्ता पहिली प्रवेश चौकशी', 'e.g. Class 1 Admission Query')}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-main-text dark:text-dark-text mb-1">
                      {tBilingual('सविस्तर संदेश / सूचना', 'Message / Detailed Feedback')} *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={tBilingual('आपला संदेश येथे लिहा...', 'Write your message details here...')}
                      className="w-full text-xs px-3 py-2 border border-border-green dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-main-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary-green"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="md" rightIcon={<Send className="w-3.5 h-3.5" />}>
                    {tBilingual('संदेश पाठवा', 'Submit Inquiry')}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
