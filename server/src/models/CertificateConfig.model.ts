import mongoose, { Document, Schema } from 'mongoose';

export type CertificateAccentColor = 'green' | 'blue' | 'red' | 'black' | 'purple';

export interface ITemplateSettings {
  certificateType: 'Bonafide Certificate' | 'Leaving Certificate' | 'Scholarship Certificate';
  title: string;
  header: string;
  subheader: string;
  body: string;
  footerNote: string;
  place: string;
  teacherSignLabel: string;
  principalSignLabel: string;
  showBorder: boolean;
  showSeal: boolean;
  accentColor: CertificateAccentColor;
}

export interface ICertificateConfig extends Document {
  activeTemplate: 'Bonafide Certificate' | 'Leaving Certificate' | 'Scholarship Certificate';
  templates: {
    bonafide: ITemplateSettings;
    leaving: ITemplateSettings;
    scholarship: ITemplateSettings;
  };
  version: number;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_CERTIFICATE_CONFIG = {
  activeTemplate: 'Bonafide Certificate' as const,
  templates: {
    bonafide: {
      certificateType: 'Bonafide Certificate' as const,
      title: 'बोनाफाईड प्रमाणपत्र (BONAFIDE CERTIFICATE)',
      header: 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.',
      subheader: 'ता. धरणगाव, जि. जळगाव - केंद्र: बांभोरी | UDISE क्र. : 27030504401',
      body: 'प्रमाणित करण्यात येते की, कुमार/कुमारी {studentName}, जनरल रजिस्टर (G.R.) क्र. {grNumber}, हा/ही या शाळेत शैक्षणिक वर्ष {academicYear} मध्ये {standard} तुकडी {division} मध्ये नियमित शिकत आहे. शाळेतील अधिकृत अभिलेखानुसार त्यांची जन्मतारीख {dob} असून, जात {caste} (प्रवर्ग: {category}) आहे. त्यांचे वडील {fatherName} व आई {motherName} आहेत. सदर प्रमाणपत्र विद्यार्थ्याच्या विनंतीवरून {purpose} या अधिकृत कारणास्तव देण्यात येत आहे. विद्यार्थ्याची वर्तणूक समाधानकारक आहे.',
      footerNote: 'सदर प्रमाणपत्र अधिकृत दस्तऐवज पडताळणी, बँक खाते, व शासकीय शैक्षणिक लाभासाठी ग्राह्य आहे.',
      place: 'हिंगोणे बु., ता. धरणगाव',
      teacherSignLabel: 'वर्गशिक्षक (स्वाक्षरी)',
      principalSignLabel: 'मुख्याध्यापक (स्वाक्षरी व मोहर)',
      showBorder: true,
      showSeal: true,
      accentColor: 'green' as CertificateAccentColor,
    },
    leaving: {
      certificateType: 'Leaving Certificate' as const,
      title: 'शाळा सोडल्याचा दाखला (LEAVING CERTIFICATE)',
      header: 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.',
      subheader: 'ता. धरणगाव, जि. जळगाव | शाळा मान्यता क्र.: ZP/EDU/1962 | UDISE: 27030504401',
      body: 'दाखला देण्यात येतो की, {studentName}, जनरल रजिस्टर (G.R.) क्र. {grNumber}, हा/ही या शाळेत {standard} तुकडी {division} मध्ये शिकत होता/होती. शाळेच्या निर्गम नोंदवहीनुसार जन्मतारीख {dob} असून, धर्म/जात {caste} (प्रवर्ग: {category}) आहे. राष्ट्रीयत्व {nationality} आहे. विद्यार्थ्याची वर्तणूक {conduct} असून प्रगती {progress} आहे. शाळा सोडल्याचे कारण: {reasonForLeaving}. शाळा सोडल्याचा दिनांक: {leavingDate}. सर्व शासकीय येणे बाकी नाही.',
      footerNote: 'शाळेच्या जनरल रजिस्टरमधील नोंदीवरून हा दाखला अचूक व खरा असल्याची खात्री करण्यात आली आहे.',
      place: 'हिंगोणे बु., ता. धरणगाव',
      teacherSignLabel: 'तयार करणार / वर्गशिक्षक',
      principalSignLabel: 'मुख्याध्यापक (स्वाक्षरी व शिक्का)',
      showBorder: true,
      showSeal: true,
      accentColor: 'green' as CertificateAccentColor,
    },
    scholarship: {
      certificateType: 'Scholarship Certificate' as const,
      title: 'शिष्यवृत्ती प्रमाणपत्र (SCHOLARSHIP CERTIFICATE)',
      header: 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.',
      subheader: 'ता. धरणगाव, जि. जळगाव | शिष्यवृत्ती विभाग | UDISE: 27030504401',
      body: 'प्रमाणित करण्यात येते की, कुमार/कुमारी {studentName}, जनरल रजिस्टर (G.R.) क्र. {grNumber}, शैक्षणिक वर्ष {academicYear} मध्ये {standard} चा/ची गुणवंत विद्यार्थी असून, शासनाच्या {scholarshipSchemeName} या शिष्यवृत्ती योजनेसाठी पात्र व मंजूर ठरलेला/ली आहे. मंजूर सहाय्य रक्कम ₹{sanctionAmount}/- असून विद्यार्थी शाळेत नियमित उपस्थिती राखत आहे.',
      footerNote: 'सदर प्रमाणपत्र महाडीबीटी, जिल्हा समाजकल्याण व शासकीय शिष्यवृत्ती अभिलेखासाठी निर्गमित करण्यात आले आहे.',
      place: 'हिंगोणे बु., ता. धरणगाव',
      teacherSignLabel: 'शिष्यवृत्ती प्रमुख / वर्गशिक्षक',
      principalSignLabel: 'मुख्याध्यापक (स्वाक्षरी व मोहर)',
      showBorder: true,
      showSeal: true,
      accentColor: 'green' as CertificateAccentColor,
    },
  },
  version: 1,
  lastUpdatedBy: 'System Default',
};

const TemplateSettingsSchema = new Schema<ITemplateSettings>(
  {
    certificateType: {
      type: String,
      required: true,
      enum: ['Bonafide Certificate', 'Leaving Certificate', 'Scholarship Certificate'],
    },
    title: { type: String, required: true },
    header: { type: String, required: true },
    subheader: { type: String, required: true },
    body: { type: String, required: true },
    footerNote: { type: String, required: true },
    place: { type: String, required: true, default: 'हिंगोणे बु., ता. धरणगाव' },
    teacherSignLabel: { type: String, required: true, default: 'वर्गशिक्षक' },
    principalSignLabel: { type: String, required: true, default: 'मुख्याध्यापक' },
    showBorder: { type: Boolean, required: true, default: true },
    showSeal: { type: Boolean, required: true, default: true },
    accentColor: {
      type: String,
      required: true,
      enum: ['green', 'blue', 'red', 'black', 'purple'],
      default: 'green',
    },
  },
  { _id: false }
);

const CertificateConfigSchema = new Schema<ICertificateConfig>(
  {
    activeTemplate: {
      type: String,
      required: true,
      enum: ['Bonafide Certificate', 'Leaving Certificate', 'Scholarship Certificate'],
      default: 'Bonafide Certificate',
    },
    templates: {
      bonafide: { type: TemplateSettingsSchema, required: true },
      leaving: { type: TemplateSettingsSchema, required: true },
      scholarship: { type: TemplateSettingsSchema, required: true },
    },
    version: { type: Number, required: true, default: 1 },
    lastUpdatedBy: { type: String, required: true, default: 'System Default' },
  },
  { timestamps: true }
);

export const CertificateConfig = mongoose.model<ICertificateConfig>(
  'CertificateConfig',
  CertificateConfigSchema
);
