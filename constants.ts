import { Course, Teacher, FileNode, ScheduleEvent } from './types';

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
                linkedPdfId: 'doc2',
                questionStatus: 'PENDENTE' as any
              }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_SCHEDULE: ScheduleEvent[] = [];