import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { UtensilsCrossed, Calendar, CheckCircle2, FileText } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const MdmPage: React.FC = () => {
  const { tBilingual } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-main-text dark:text-dark-text">
            {tBilingual('शालेय पोषण आहार', 'Mid-Day Meal Scheme (PM POSHAN)')}
          </h2>
          <p className="text-xs text-muted-text dark:text-dark-muted">
            {tBilingual('दैनिक धान्य वाटप, लाभार्थी संख्या व मेनू नोंदवही', 'Daily food distribution, beneficiary count, and nutrition logs')}
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
          {tBilingual('आजची मेनू नोंद करा', "Log Today's Meal")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card">
          <div className="text-xs text-muted-text dark:text-dark-muted font-semibold">
            {tBilingual('आजचे भोजन', "Today's Menu")}
          </div>
          <div className="text-lg font-bold text-primary-green dark:text-emerald-400 mt-1">
            {tBilingual('मूगडाळ खिचडी + उकडलेली अंडी', 'Moong Dal Khichdi + Boiled Eggs')}
          </div>
          <div className="text-[11px] text-muted-text dark:text-dark-muted mt-1">
            {tBilingual('दर्जा: ५ स्टार उत्तम पोषण मूल्य', 'Quality: 5-Star Optimal Nutrition Value')}
          </div>
        </Card>

        <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card">
          <div className="text-xs text-muted-text dark:text-dark-muted font-semibold">
            {tBilingual('आजचे एकूण लाभार्थी', 'Total Beneficiaries Today')}
          </div>
          <div className="text-2xl font-extrabold text-saffron-orange mt-1">
            {tBilingual('१४२ विद्यार्थी', '142 Students')}
          </div>
          <div className="text-[11px] text-primary-green dark:text-emerald-400 font-semibold mt-1">
            {tBilingual('१००% उपस्थित विद्यार्थ्यांना वाटप', '100% of present students served')}
          </div>
        </Card>

        <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card">
          <div className="text-xs text-muted-text dark:text-dark-muted font-semibold">
            {tBilingual('तांदूळ शिल्लक साठा', 'Remaining Rice Stock')}
          </div>
          <div className="text-2xl font-extrabold text-main-text dark:text-dark-text mt-1">
            {tBilingual('३५० कि.ग्रॅ.', '350 kg')}
          </div>
          <div className="text-[11px] text-muted-text dark:text-dark-muted mt-1">
            {tBilingual('पुढील २५ दिवसांसाठी पुरेसा साठा', 'Sufficient inventory for 25 days')}
          </div>
        </Card>
      </div>

      {/* Real MDM photo & inspection note */}
      <Card className="border border-border-green dark:border-dark-border dark:bg-dark-card p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-64 rounded-xl overflow-hidden border border-border-green dark:border-dark-border shrink-0">
          <img src="/imgs/mdm.jpg" alt="Mid-day meal" className="w-full h-44 object-cover" />
        </div>
        <div className="space-y-2">
          <Badge variant="orange" size="sm">
            {tBilingual('शालेय पोषण आहार हमी', 'PM POSHAN Quality Guarantee')}
          </Badge>
          <h3 className="text-base font-bold text-main-text dark:text-dark-text">
            {tBilingual('स्वच्छ, सकस व गरम अन्नाची नियमित तपासणी', 'Hygienic, Nutritious, and Hot Fresh Meal Inspection')}
          </h3>
          <p className="text-xs text-muted-text dark:text-dark-muted leading-relaxed">
            {tBilingual(
              'शाळेतील पोषण आहार स्वयंपाकगृहात दैनंदिन स्वच्छता राखली जाते. मुख्याध्यापक व वर्गशिक्षकांमार्फत जेवण वाटपापूर्वी अन्नाची चव व गुणवत्ता तपासली जाते.',
              'Daily sanitation is strictly maintained in the school kitchen. Before distribution, meals are thoroughly inspected for taste and quality by the Headmaster and teachers.'
            )}
          </p>
          <div className="text-[11px] font-semibold text-primary-green dark:text-emerald-400 pt-1">
            {tBilingual('शाळा व्यवस्थापन समिती सदस्य नियमित भोजन तपासणी करतात.', 'School Management Committee (SMC) members conduct regular meal quality audits.')}
          </div>
        </div>
      </Card>
    </div>
  );
};
