/**
 * Types and Enums for Model Pose Selection (Step 3)
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Model Gender Options
 */
export enum ModelGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
}

/**
 * Model Gender Labels (Portuguese)
 */
export const ModelGenderLabel: Record<ModelGender, string> = {
  [ModelGender.MALE]: 'Masculino',
  [ModelGender.FEMALE]: 'Feminino',
  [ModelGender.NON_BINARY]: 'Não-binário',
};

/**
 * Age Range Options
 */
export enum AgeRange {
  TEENS = 'TEENS', // 13-19
  TWENTIES = 'TWENTIES', // 20-29
  THIRTIES = 'THIRTIES', // 30-39
  FORTIES = 'FORTIES', // 40-49
  FIFTIES = 'FIFTIES', // 50-59
  SIXTIES_PLUS = 'SIXTIES_PLUS', // 60+
}

/**
 * Age Range Labels (Portuguese)
 */
export const AgeRangeLabel: Record<AgeRange, string> = {
  [AgeRange.TEENS]: '13-19 anos',
  [AgeRange.TWENTIES]: '20-29 anos',
  [AgeRange.THIRTIES]: '30-39 anos',
  [AgeRange.FORTIES]: '40-49 anos',
  [AgeRange.FIFTIES]: '50-59 anos',
  [AgeRange.SIXTIES_PLUS]: '60+ anos',
};

/**
 * Age Range Min-Max Values
 */
export const AgeRangeValues: Record<AgeRange, { min: number; max: number }> = {
  [AgeRange.TEENS]: { min: 13, max: 19 },
  [AgeRange.TWENTIES]: { min: 20, max: 29 },
  [AgeRange.THIRTIES]: { min: 30, max: 39 },
  [AgeRange.FORTIES]: { min: 40, max: 49 },
  [AgeRange.FIFTIES]: { min: 50, max: 59 },
  [AgeRange.SIXTIES_PLUS]: { min: 60, max: 100 },
};

/**
 * Model Ethnicity Options
 */
export enum ModelEthnicity {
  CAUCASIAN = 'CAUCASIAN',
  AFRICAN = 'AFRICAN',
  ASIAN = 'ASIAN',
  HISPANIC = 'HISPANIC',
  MIDDLE_EASTERN = 'MIDDLE_EASTERN',
  MIXED = 'MIXED',
  OTHER = 'OTHER',
}

/**
 * Model Ethnicity Labels (Portuguese)
 */
export const ModelEthnicityLabel: Record<ModelEthnicity, string> = {
  [ModelEthnicity.CAUCASIAN]: 'Caucasiano',
  [ModelEthnicity.AFRICAN]: 'Africano',
  [ModelEthnicity.ASIAN]: 'Asiático',
  [ModelEthnicity.HISPANIC]: 'Hispânico',
  [ModelEthnicity.MIDDLE_EASTERN]: 'Oriente Médio',
  [ModelEthnicity.MIXED]: 'Misto',
  [ModelEthnicity.OTHER]: 'Outro',
};

/**
 * Pose Category (Body Position)
 */
export enum PoseCategory {
  STANDING_STRAIGHT = 'STANDING_STRAIGHT',
  STANDING_CASUAL = 'STANDING_CASUAL',
  STANDING_CONFIDENT = 'STANDING_CONFIDENT',
  SITTING = 'SITTING',
  WALKING = 'WALKING',
  LEANING = 'LEANING',
  DYNAMIC = 'DYNAMIC',
  RELAXED = 'RELAXED',
}

/**
 * Pose Category Labels (Portuguese)
 */
export const PoseCategoryLabel: Record<PoseCategory, string> = {
  [PoseCategory.STANDING_STRAIGHT]: 'Em pé - Reto',
  [PoseCategory.STANDING_CASUAL]: 'Em pé - Casual',
  [PoseCategory.STANDING_CONFIDENT]: 'Em pé - Confiante',
  [PoseCategory.SITTING]: 'Sentado',
  [PoseCategory.WALKING]: 'Caminhando',
  [PoseCategory.LEANING]: 'Apoiado',
  [PoseCategory.DYNAMIC]: 'Dinâmico',
  [PoseCategory.RELAXED]: 'Relaxado',
};

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Model Pose Metadata (stored in database)
 */
export interface PoseMetadata {
  id: string;
  imageUrl: string;
  gender: ModelGender;
  ageMin: number;
  ageMax: number;
  ageRange: AgeRange;
  ethnicity: ModelEthnicity;
  poseCategory: PoseCategory;
  garmentCategories: string[]; // Compatible garment categories
  name?: string; // Optional model name
  description?: string; // Optional description
  tags?: string[]; // Optional tags
  createdAt: string;
  isUserModel?: boolean;
  userModelId?: string;
  modelAttributes?: {
    heightCm?: number | null;
    weightKg?: number | null;
    hairColor?: string | null;
    facialExpression?: string | null;
  };
  metadata?: Record<string, any>;
}

/**
 * Pose Filter State (UI state)
 */
export interface PoseFilterState {
  genders: ModelGender[];
  ageMin: number;
  ageMax: number;
  ethnicities: ModelEthnicity[];
  poseCategories: PoseCategory[];
  garmentCategories: string[];
}

/**
 * Initial/Default Filter State
 */
export const defaultPoseFilterState: PoseFilterState = {
  genders: [],
  ageMin: 18,
  ageMax: 65,
  ethnicities: [],
  poseCategories: [],
  garmentCategories: [],
};

/**
 * Pose Selection State (saved to user_uploads.metadata)
 */
export interface PoseSelectionMetadata {
  selectedPoseIds: string[]; // Array of pose IDs (max 2)
  selectedAt: string;
}

/**
 * Extended Upload Metadata with Pose Selection
 */
export interface UploadWithPoseSelection {
  id: string;
  metadata: {
    garmentType: 'single' | 'outfit';
    pieceType: 'upper' | 'lower';
    publicUrl: string;
    garmentMetadata?: any;
    poseSelection?: PoseSelectionMetadata;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get age range from specific age
 */
export function getAgeRangeFromAge(age: number): AgeRange {
  if (age >= 13 && age <= 19) return AgeRange.TEENS;
  if (age >= 20 && age <= 29) return AgeRange.TWENTIES;
  if (age >= 30 && age <= 39) return AgeRange.THIRTIES;
  if (age >= 40 && age <= 49) return AgeRange.FORTIES;
  if (age >= 50 && age <= 59) return AgeRange.FIFTIES;
  return AgeRange.SIXTIES_PLUS;
}

/**
 * Check if pose matches age filter
 */
export function poseMatchesAgeFilter(
  pose: PoseMetadata,
  filterAgeMin: number,
  filterAgeMax: number
): boolean {
  // Check if there's any overlap between pose age range and filter age range
  return pose.ageMin <= filterAgeMax && pose.ageMax >= filterAgeMin;
}

/**
 * Check if pose matches gender filter
 */
export function poseMatchesGenderFilter(
  pose: PoseMetadata,
  selectedGenders: ModelGender[]
): boolean {
  if (selectedGenders.length === 0) return true; // No filter = show all
  return selectedGenders.includes(pose.gender);
}

/**
 * Check if pose matches ethnicity filter
 */
export function poseMatchesEthnicityFilter(
  pose: PoseMetadata,
  selectedEthnicities: ModelEthnicity[]
): boolean {
  if (selectedEthnicities.length === 0) return true; // No filter = show all
  return selectedEthnicities.includes(pose.ethnicity);
}

/**
 * Check if pose matches garment category filter
 */
export function poseMatchesGarmentFilter(
  pose: PoseMetadata,
  selectedGarmentCategories: string[]
): boolean {
  if (selectedGarmentCategories.length === 0) return true; // No filter = show all
  // Check if there's any intersection between pose garment categories and selected categories
  return pose.garmentCategories.some(cat => selectedGarmentCategories.includes(cat));
}

/**
 * Filter poses by all criteria
 */
export function filterPoses(
  poses: PoseMetadata[],
  filters: PoseFilterState
): PoseMetadata[] {
  return poses.filter(pose => {
    const matchesGender = poseMatchesGenderFilter(pose, filters.genders);
    const matchesAge = poseMatchesAgeFilter(pose, filters.ageMin, filters.ageMax);
    const matchesEthnicity = poseMatchesEthnicityFilter(pose, filters.ethnicities);
    const matchesGarment = poseMatchesGarmentFilter(pose, filters.garmentCategories);

    return matchesGender && matchesAge && matchesEthnicity && matchesGarment;
  });
}
