
import { Course, Teacher, FileNode, ScheduleEvent, PresentialConfig } from './types';

export const INITIAL_TEACHER_FORM: Omit<Teacher, 'id'> = {
  name: '',
  email: '',
  whatsapp: '',
  segment: 'CONCURSO',
  location: 'RIO_BRANCO',
  subjects: [],
  primarySubject: '',
  isPublicServant: false,
  isShiftWorker: false,
  weekendAvailability: { saturday: false, sunday: false },
  preferences: {
    concurso: [null, null, null],
    enem: [null, null, null]
  }
};

export const MOCK_TEACHERS: Teacher[] = [
  { 
    id: 't1', 
    name: 'Dr. Augusto', 
    email: 'augusto@email.com',
    whatsapp: '68999999999',
    segment: 'CONCURSO',
    location: 'RIO_BRANCO',
    subjects: ['Direito Constitucional'],
    primarySubject: 'Direito Constitucional',
    isPublicServant: true,
    isShiftWorker: false,
    weekendAvailability: { saturday: true, sunday: false },
    preferences: {
      concurso: [
        { day: 'SEGUNDA', shift: 'NOITE' },
        { day: 'QUARTA', shift: 'NOITE' },
        { day: 'SEXTA', shift: 'NOITE' }
      ],
      enem: [null, null, null]
    }
  },
  { 
    id: 't2', 
    name: 'Prof. Ana Silva', 
    email: 'ana@email.com',
    whatsapp: '69888888888',
    segment: 'ENEM',
    location: 'PORTO_VELHO', // Irrelevant for ENEM but kept for type safety
    subjects: ['Português', 'Literatura'],
    primarySubject: 'Português',
    isPublicServant: false,
    weekendAvailability: { saturday: true, sunday: true },
    preferences: {
      concurso: [null, null, null],
      enem: [
        { day: 'TERCA', shift: 'MANHA' },
        { day: 'QUINTA', shift: 'MANHA' },
        { day: 'QUARTA', shift: 'TARDE' }
      ]
    }
  }
];

export const INITIAL_FILES: FileNode[] = [
  { id: 'root', name: 'Raiz', type: 'FOLDER', parentId: null },
  { id: 'f1', name: 'Materiais 2024', type: 'FOLDER', parentId: 'root' },
  { id: 'f2', name: 'Apostilas Base', type: 'FOLDER', parentId: 'root' },
  { id: 'doc1', name: 'Constitucional_Aula1.pdf', type: 'FILE', parentId: 'f1', url: '#' },
  { id: 'doc2', name: 'Portugues_Crase.pdf', type: 'FILE', parentId: 'f1', url: '#' },
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1',
    name: 'Polícia Civil - Agente',
    type: 'ONLINE',
    category: 'CONCURSO',
    deadline: '2024-12-31',
    disciplines: [
      {
        id: 'd1',
        name: 'Língua Portuguesa',
        topics: [
          {
            id: 'top1',
            name: 'Crase',
            teacherId: 't2',
            modules: [
              {
                id: 'm1',
                name: 'Teoria da Crase - Parte 1',
                videoStatus: 'PENDENTE' as any,
                pdfStatus: 'CONCLUIDO' as any,
                linkedPdfIds: ['doc2'],
                questionStatus: 'PENDENTE' as any,
                linkedQuestionPdfIds: []
              }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_SCHEDULE: ScheduleEvent[] = [];

export const INITIAL_PRESENTIAL_CONFIG: PresentialConfig = {
  location: 'RIO_BRANCO',
  subType: 'PRE_EDITAL',
  modality: 'REGULAR',
  hasClassroomRecording: false,
  totalMeetings: 60,
  meetingDurationHours: 3,
  classesPerMeeting: 2,
  breakCount: 1,
  breakDurationMinutes: 15,
  shift: 'NOITE',
  startTime: '19:00',
  daysOfWeek: ['SEGUNDA', 'QUARTA', 'SEXTA'],
  allowWeekend: false,
  startDate: new Date().toISOString().split('T')[0],
  skipRedHolidays: true,
  hourlyRate: 50,
  commissionRecording: 10,
  commissionSubstitution: 10,
  commissionWeekend: 20
};

export const HOLIDAYS: string[] = [
  '2024-01-01', '2024-02-12', '2024-02-13', '2024-03-29', '2024-04-21', 
  '2024-05-01', '2024-05-30', '2024-09-07', '2024-10-12', '2024-11-02', 
  '2024-11-15', '2024-12-25'
];
