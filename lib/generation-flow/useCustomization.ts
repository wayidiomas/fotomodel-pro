'use client';

import * as React from 'react';
import type { AIToolsSelection } from '@/components/generation-flow/ai-tools-panel';

const STORAGE_KEY = 'fotomodel_customization';

export interface CustomizationData {
  // Physical attributes
  height: number; // cm
  weight: number; // kg

  // Facial expression
  facialExpression: string | null;

  // Hair color (free customization)
  hairColor: string | null;

  // Output format
  selectedFormat: string | null;

  // AI Tools
  aiTools: AIToolsSelection;

  // Associated upload IDs (for validation)
  uploadIds: string[];
}

export interface UseCustomizationReturn {
  // State
  customization: CustomizationData;

  // Height
  height: number;
  setHeight: (value: number) => void;

  // Weight
  weight: number;
  setWeight: (value: number) => void;

  // Facial expression
  facialExpression: string | null;
  setFacialExpression: (value: string | null) => void;

  // Hair color
  hairColor: string | null;
  setHairColor: (value: string | null) => void;

  // Output format
  selectedFormat: string | null;
  setSelectedFormat: (value: string | null) => void;

  // AI Tools
  aiTools: AIToolsSelection;
  setAITools: (value: AIToolsSelection) => void;

  // Carousel navigation
  currentSection: number;
  setCurrentSection: (value: number) => void;
  goToSection: (index: number) => void;
  nextSection: () => void;
  prevSection: () => void;

  // Helpers
  resetCustomization: () => void;
  saveCustomization: () => CustomizationData;
  hasAnyCustomization: boolean;
}

const DEFAULT_AI_TOOLS: AIToolsSelection = {
  removeBackground: false,
  changeBackground: {
    enabled: false,
    selection: null,
  },
  addLogo: {
    enabled: false,
    logo: null,
  },
};

const DEFAULT_HEIGHT = 170; // cm
const DEFAULT_WEIGHT = 60; // kg

/**
 * Hook to manage model customization state
 * - Manages physical attributes (height, weight)
 * - Manages facial expression
 * - Manages AI editing tools
 * - Persists to localStorage
 */
export function useCustomization(uploadIds: string[], totalSections = 5): UseCustomizationReturn {
  const maxSectionIndex = Math.max(0, totalSections - 1);
  const [height, setHeightState] = React.useState(DEFAULT_HEIGHT);
  const [weight, setWeightState] = React.useState(DEFAULT_WEIGHT);
  const [facialExpression, setFacialExpressionState] = React.useState<string | null>(null);
  const [hairColor, setHairColorState] = React.useState<string | null>(null);
  const [selectedFormat, setSelectedFormatState] = React.useState<string | null>(null);
  const [aiTools, setAIToolsState] = React.useState<AIToolsSelection>(DEFAULT_AI_TOOLS);
  const [currentSection, setCurrentSectionState] = React.useState(0);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CustomizationData = JSON.parse(stored);

        // Only restore if upload IDs match
        if (
          parsed.uploadIds &&
          JSON.stringify(parsed.uploadIds.sort()) === JSON.stringify(uploadIds.sort())
        ) {
          setHeightState(parsed.height || DEFAULT_HEIGHT);
          setWeightState(parsed.weight || DEFAULT_WEIGHT);
          setFacialExpressionState(parsed.facialExpression || null);
          setHairColorState(parsed.hairColor || null);
          setSelectedFormatState(parsed.selectedFormat || null);
          setAIToolsState(parsed.aiTools || DEFAULT_AI_TOOLS);
        }
      }
    } catch (error) {
      console.error('Error loading customization from localStorage:', error);
    }
  }, [uploadIds]);

  // Save to localStorage whenever customization changes
  React.useEffect(() => {
    try {
      const data: CustomizationData = {
        height,
        weight,
        facialExpression,
        hairColor,
        selectedFormat,
        aiTools,
        uploadIds,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving customization to localStorage:', error);
    }
  }, [height, weight, facialExpression, hairColor, selectedFormat, aiTools, uploadIds]);

  const setHeight = React.useCallback((value: number) => {
    setHeightState(Math.max(60, Math.min(220, value)));
  }, []);

  const setWeight = React.useCallback((value: number) => {
    setWeightState(Math.max(10, Math.min(150, value)));
  }, []);

  const setFacialExpression = React.useCallback((value: string | null) => {
    setFacialExpressionState(value);
  }, []);

  const setHairColor = React.useCallback((value: string | null) => {
    setHairColorState(value);
  }, []);

  const setSelectedFormat = React.useCallback((value: string | null) => {
    setSelectedFormatState(value);
  }, []);

  const setAITools = React.useCallback((value: AIToolsSelection) => {
    setAIToolsState(value);
  }, []);

  // Carousel navigation callbacks
  const setCurrentSection = React.useCallback((value: number) => {
    setCurrentSectionState(Math.max(0, Math.min(maxSectionIndex, value)));
  }, [maxSectionIndex]);

  const goToSection = React.useCallback((index: number) => {
    setCurrentSectionState(Math.max(0, Math.min(maxSectionIndex, index)));
  }, [maxSectionIndex]);

  const nextSection = React.useCallback(() => {
    setCurrentSectionState((prev) => Math.min(prev + 1, maxSectionIndex));
  }, [maxSectionIndex]);

  const prevSection = React.useCallback(() => {
    setCurrentSectionState((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetCustomization = React.useCallback(() => {
    setHeightState(DEFAULT_HEIGHT);
    setWeightState(DEFAULT_WEIGHT);
    setFacialExpressionState(null);
    setHairColorState(null);
    setSelectedFormatState(null);
    setAIToolsState(DEFAULT_AI_TOOLS);
    setCurrentSectionState(0);
  }, []);

  const saveCustomization = React.useCallback((): CustomizationData => {
    return {
      height,
      weight,
      facialExpression,
      hairColor,
      selectedFormat,
      aiTools,
      uploadIds,
    };
  }, [height, weight, facialExpression, hairColor, selectedFormat, aiTools, uploadIds]);

  // Check if user has made any customizations
  const hasAnyCustomization = React.useMemo(() => {
    const hasPhysicalChanges = height !== DEFAULT_HEIGHT || weight !== DEFAULT_WEIGHT;
    const hasExpression = facialExpression !== null;
    const hasHairColor = hairColor !== null;
    const hasFormat = selectedFormat !== null;
    const hasAITools =
      aiTools.removeBackground ||
      aiTools.changeBackground.enabled ||
      aiTools.addLogo.enabled;

    return hasPhysicalChanges || hasExpression || hasHairColor || hasFormat || hasAITools;
  }, [height, weight, facialExpression, hairColor, selectedFormat, aiTools]);

  return {
    customization: {
      height,
      weight,
      facialExpression,
      hairColor,
      selectedFormat,
      aiTools,
      uploadIds,
    },
    height,
    setHeight,
    weight,
    setWeight,
    facialExpression,
    setFacialExpression,
    hairColor,
    setHairColor,
    selectedFormat,
    setSelectedFormat,
    aiTools,
    setAITools,
    currentSection,
    setCurrentSection,
    goToSection,
    nextSection,
    prevSection,
    resetCustomization,
    saveCustomization,
    hasAnyCustomization,
  };
}
