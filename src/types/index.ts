export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'file'
  | 'rating'
  | 'heading'
  | 'paragraph'
  | 'website'

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
    fileTypes?: string[]
    maxFileSize?: number
  }
  description?: string
  order: number
}

export interface FormDesign {
  font: string
  questionsColor: string
  answersColor: string
  buttonsColor: string
  buttonTextColor: string
  backgroundColor: string
  backgroundImage: string
  logo: string
  welcomeFontSize: number
  questionsFontSize: number
  alignment: 'left' | 'center'
}

export const DEFAULT_FORM_DESIGN: FormDesign = {
  font: 'Roboto',
  questionsColor: '#3D3D3D',
  answersColor: '#4F4F4F',
  buttonsColor: '#0445AF',
  buttonTextColor: '#FFFFFF',
  backgroundColor: '#FFFFFF',
  backgroundImage: '',
  logo: '',
  welcomeFontSize: 30,
  questionsFontSize: 24,
  alignment: 'left',
}

export interface FormSettings {
  submitButtonText: string
  successMessage: string
  allowMultipleSubmissions: boolean
  requireAuth: boolean
  showProgressBar: boolean
  enableAutoSave: boolean
  autoSaveInterval: number // ms
  theme: 'default' | 'minimal' | 'modern'
  googleDocSync: boolean
  googleSheetEnabled: boolean
  googleSheetUrl: string
  design: FormDesign
}

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  submitButtonText: 'Submit',
  successMessage: 'Thank you for your submission!',
  allowMultipleSubmissions: false,
  requireAuth: false,
  showProgressBar: true,
  enableAutoSave: true,
  autoSaveInterval: 3000,
  theme: 'default',
  googleDocSync: false,
  googleSheetEnabled: false,
  googleSheetUrl: '',
  design: DEFAULT_FORM_DESIGN,
}

export interface FormData {
  id: string
  title: string
  description?: string
  slug: string
  status: 'draft' | 'published' | 'closed'
  fields: FormField[]
  settings: FormSettings
  version: number
  responseCount: number
  createdAt: string
  updatedAt: string
}
