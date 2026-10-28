import { Schema, model, Document } from 'mongoose';

export interface IQuickFact {
  label: string;
  value: string;
}

export interface ITextbookLink {
  standard: string;
  subject: string;
  balbharatiUrl: string;
}

export interface ISchoolWebsiteConfig extends Document {
  schoolInfo: {
    name: string;
    marathiName: string;
    udiseCode: string;
    logoUrl: string;
    establishedYear: string;
    management: string;
    address: string;
    phone: string;
    email: string;
    timings: string;
    introduction: string;
    vision: string;
    mission: string;
    facilities: string[];
    quickFacts: IQuickFact[];
  };
  principalMessage: {
    displayName: string;
    designation: string;
    qualification: string;
    photo: string;
    message: string;
  };
  academics: {
    availableClasses: string[];
    mediumOfInstruction: string;
    academicDetails: string;
    textbookLinks: ITextbookLink[];
  };
  admissionsConfig: {
    isFormOpen: boolean;
    academicYear: string;
    processDescription: string;
    requiredDocuments: string[];
    startDate?: Date;
    endDate?: Date;
  };
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuickFactSchema = new Schema<IQuickFact>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const TextbookLinkSchema = new Schema<ITextbookLink>(
  {
    standard: { type: String, required: true },
    subject: { type: String, required: true },
    balbharatiUrl: { type: String, required: true },
  },
  { _id: false }
);

const SchoolWebsiteConfigSchema = new Schema<ISchoolWebsiteConfig>(
  {
    schoolInfo: {
      name: {
        type: String,
        default: 'Zilla Parishad Primary School, Hingone BK',
      },
      marathiName: {
        type: String,
        default: 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.',
      },
      udiseCode: { type: String, default: '27030804501' },
      logoUrl: { type: String, default: '/imgs/school1.jpg' },
      establishedYear: { type: String, default: '1962' },
      management: {
        type: String,
        default: 'शालेय शिक्षण व क्रीडा विभाग, महाराष्ट्र शासन (जिल्हा परिषद जळगाव)',
      },
      address: {
        type: String,
        default: 'मु. पो. हिंगोणे बु., तालुका धरणगाव, जिल्हा जळगाव, महाराष्ट्र - ४२५१०५',
      },
      phone: { type: String, default: '+91 98234 56789' },
      email: { type: String, default: 'zpschoolhingonebk@gmail.com' },
      timings: {
        type: String,
        default: 'सोमवार ते शनिवार: सकाळी १०:०० ते संध्याकाळी ०५:००',
      },
      introduction: {
        type: String,
        default:
          'जि. प. प्राथमिक शाळा हिंगोणे बु. ही धरणगाव तालुक्यातील एक अग्रगण्य व संस्कारक्षम शाळा असून येथे डिजिटल वर्ग, निसर्गरम्य परिसर व गुणवत्तापूर्ण शिक्षणाची परंपरा आहे.',
      },
      vision: {
        type: String,
        default:
          'ग्रामीण भागातील प्रत्येक बालकाला आधुनिक डिजिटल कौशल्यांसह दर्जेदार प्राथमिक शिक्षण देऊन सुजाण, स्वावलंबी आणि नैतिक मूल्यांनी समृद्ध नागरिक घडवणे.',
      },
      mission: {
        type: String,
        default:
          'पायाभूत साक्षरता व संख्याज्ञान (FLN), पर्यावरण संवर्धन, क्रीडा कौशल्ये, आणि सर्वसमावेशक मोफत शिक्षणाची हमी देणे.',
      },
      facilities: {
        type: [String],
        default: () => [
          'डिजिटल वर्गखोल्या (Smart Classrooms)',
          'भव्य १.२ एकर क्रीडांगण व साहित्य',
          '१००% मोफत व सकस पोषण आहार (MDM)',
          'समृद्ध बाल वाचनालय व ग्रंथालय',
          'स्वच्छ पिण्याचे RO पाणी व स्वतंत्र स्वच्छतागृहे',
          'पर्यावरणपूरक शाळा परिसर व वृक्षारोपण',
        ],
      },
      quickFacts: {
        type: [QuickFactSchema],
        default: () => [
          { label: 'युडायस कोड (UDISE)', value: '27030804501' },
          { label: 'स्थापना वर्ष (Established)', value: '१९६२ (1962)' },
          { label: 'एकूण विद्यार्थी (Students)', value: '१४८ बालके' },
          { label: 'प्रशिक्षित शिक्षक (Teachers)', value: '०६ पदवीधर शिक्षक' },
          { label: 'वर्गखोल्या (Classrooms)', value: '०७ हवेशीर खोल्या' },
          { label: 'डिजिटल लॅब (Digital Class)', value: '०२ डिजिटल वर्ग' },
          { label: 'क्रीडांगण (Playground)', value: '१.२ एकर मैदान' },
          { label: 'पोषण आहार (MDM)', value: '१००% मोफत व सकस' },
        ],
      },
    },
    principalMessage: {
      displayName: { type: String, default: 'Ajaykumar Patil' },
      designation: { type: String, default: 'Headmaster (मुख्याध्यापक)' },
      qualification: { type: String, default: 'M.A., D.Ed. (२२ वर्षे शैक्षणिक अनुभव)' },
      photo: { type: String, default: '/imgs/principal.jpeg' },
      message: {
        type: String,
        default:
          'जि. प. प्राथमिक शाळा हिंगोणे बु. येथे आम्ही ग्रामीण भागातील प्रत्येक बालकाच्या सुप्त गुणांना वाव देणारे आनंददायी, संस्कारक्षम व डिजिटल शिक्षण देण्यास कटिबद्ध आहोत. १००% मोफत पोषण आहार, मोफत पाठ्यपुस्तके, भव्य क्रीडांगण व उच्चविद्याविभूषित शिक्षकांच्या मार्गदर्शनाखाली आमचे विद्यार्थी प्रगतीपथावर आहेत.',
      },
    },
    academics: {
      availableClasses: {
        type: [String],
        default: () => [
          'इयत्ता १ ली',
          'इयत्ता २ री',
          'इयत्ता ३ री',
          'इयत्ता ४ थी',
          'इयत्ता ५ वी',
          'इयत्ता ६ वी',
          'इयत्ता ७ वी',
        ],
      },
      mediumOfInstruction: {
        type: String,
        default: 'मराठी माध्यम (सेमी-इंग्रजी सह)',
      },
      academicDetails: {
        type: String,
        default:
          'शासकीय अभ्यासक्रमानुसार पायाभूत साक्षरता व संख्याज्ञान (FLN), कृतीआधारित आनंददायी शिक्षण व पर्यावरण संवर्धन प्रकल्प राबवले जातात.',
      },
      textbookLinks: {
        type: [TextbookLinkSchema],
        default: () => [
          {
            standard: 'इयत्ता १ ली',
            subject: 'बालभारती व गणित',
            balbharatiUrl: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx',
          },
          {
            standard: 'इयत्ता २ री ते ४ थी',
            subject: 'भाषा, गणित व परिसर अभ्यास',
            balbharatiUrl: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx',
          },
          {
            standard: 'इयत्ता ५ वी ते ७ वी',
            subject: 'सामान्य विज्ञान, इतिहास व भूगोल',
            balbharatiUrl: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx',
          },
        ],
      },
    },
    admissionsConfig: {
      isFormOpen: { type: Boolean, default: true },
      academicYear: { type: String, default: '2026-27' },
      processDescription: {
        type: String,
        default:
          'सत्र २०२६-२७ साठी इयत्ता १ ली ते ७ वी मधील सर्व विद्यार्थ्यांना आरटीई (RTE) नियमांनुसार मोफत प्रवेश दिला जात आहे. कोणत्याही शुल्काची आवश्यकता नाही.',
      },
      requiredDocuments: {
        type: [String],
        default: () => [
          'विद्यार्थ्याचा जन्म दाखला (मूळ व छायांकित प्रत)',
          'विद्यार्थी व पालकांचे आधार कार्ड',
          'शाळा सोडल्याचा दाखला (TC / Leaving Certificate - इतर शाळेतून प्रवेश असल्यास)',
          'राशन कार्ड / रहिवासी दाखला',
          'जात प्रमाणपत्र (लागू असल्यास)',
          'बँक पासबुक छायांकित प्रत',
          '२ रंगीत पासपोर्ट फोटो',
        ],
      },
      startDate: { type: Date, default: () => new Date('2026-04-01') },
      endDate: { type: Date, default: () => new Date('2026-07-31') },
    },
    updatedBy: { type: String, default: 'मुख्याध्यापक कार्यालय (Principal Office)' },
  },
  { timestamps: true }
);

export const SchoolWebsiteConfig = model<ISchoolWebsiteConfig>(
  'SchoolWebsiteConfig',
  SchoolWebsiteConfigSchema
);
