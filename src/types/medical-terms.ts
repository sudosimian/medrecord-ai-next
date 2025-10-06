export interface MedicalTerm {
  term: string
  definition: string
  category: 'anatomy' | 'procedure' | 'condition' | 'medication' | 'test' | 'abbreviation'
  commonName?: string
}

export const medicalGlossary: Record<string, MedicalTerm> = {
  'contusion': {
    term: 'Contusion',
    definition: 'A bruise; an injury that does not break the skin but causes bleeding under the skin',
    category: 'condition',
    commonName: 'Bruise'
  },
  'edema': {
    term: 'Edema',
    definition: 'Swelling caused by excess fluid trapped in body tissues',
    category: 'condition',
    commonName: 'Swelling'
  },
  'hematoma': {
    term: 'Hematoma',
    definition: 'A collection of blood outside blood vessels, usually caused by injury',
    category: 'condition',
    commonName: 'Blood clot'
  },
  'laceration': {
    term: 'Laceration',
    definition: 'A deep cut or tear in the skin or flesh',
    category: 'condition',
    commonName: 'Deep cut'
  },
  'fracture': {
    term: 'Fracture',
    definition: 'A break in a bone',
    category: 'condition',
    commonName: 'Broken bone'
  },
  'mri': {
    term: 'MRI',
    definition: 'Magnetic Resonance Imaging - a medical imaging technique using magnetic fields and radio waves',
    category: 'test',
    commonName: 'Magnetic scan'
  },
  'ct': {
    term: 'CT Scan',
    definition: 'Computed Tomography - an imaging procedure using X-rays to create detailed pictures',
    category: 'test',
    commonName: 'CAT scan'
  },
  'orif': {
    term: 'ORIF',
    definition: 'Open Reduction Internal Fixation - surgery to fix broken bones with plates, screws, or rods',
    category: 'procedure',
    commonName: 'Bone surgery'
  },
  'tbi': {
    term: 'TBI',
    definition: 'Traumatic Brain Injury - damage to the brain from external force',
    category: 'condition',
    commonName: 'Brain injury'
  },
  'nsaid': {
    term: 'NSAID',
    definition: 'Non-Steroidal Anti-Inflammatory Drug - medication to reduce pain and inflammation',
    category: 'medication',
    commonName: 'Pain reliever'
  },
}

