'use client';

import * as React from 'react';

const MAX_SELECTIONS = 1;
const STORAGE_KEY = 'fotomodel_pose_selection';

export interface PoseSelection {
  poseIds: string[];
  uploadIds: string[];
}

export interface UsePoseSelectionReturn {
  selectedPoseIds: string[];
  isSelected: (poseId: string) => boolean;
  getSelectionIndex: (poseId: string) => number | undefined;
  togglePoseSelection: (poseId: string) => void;
  canSelect: boolean;
  selectionCount: number;
  clearSelection: () => void;
  saveSelection: () => PoseSelection;
}

/**
 * Hook to manage pose selection state
 * - Maximum 1 pose can be selected
 * - Selecting a new pose replaces the current selection
 * - Persists to localStorage
 * - Provides selection utilities
 */
export function usePoseSelection(uploadIds: string[]): UsePoseSelectionReturn {
  const [selectedPoseIds, setSelectedPoseIds] = React.useState<string[]>([]);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PoseSelection = JSON.parse(stored);
        // Only restore if upload IDs match
        if (
          parsed.uploadIds &&
          JSON.stringify(parsed.uploadIds.sort()) === JSON.stringify(uploadIds.sort())
        ) {
          setSelectedPoseIds(parsed.poseIds || []);
        }
      }
    } catch (error) {
      console.error('Error loading pose selection from localStorage:', error);
    }
  }, [uploadIds]);

  // Save to localStorage whenever selection changes
  React.useEffect(() => {
    try {
      const selection: PoseSelection = {
        poseIds: selectedPoseIds,
        uploadIds,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch (error) {
      console.error('Error saving pose selection to localStorage:', error);
    }
  }, [selectedPoseIds, uploadIds]);

  const isSelected = React.useCallback(
    (poseId: string): boolean => {
      return selectedPoseIds.includes(poseId);
    },
    [selectedPoseIds]
  );

  const getSelectionIndex = React.useCallback(
    (poseId: string): number | undefined => {
      const index = selectedPoseIds.indexOf(poseId);
      return index >= 0 ? index + 1 : undefined; // 1-based index for display
    },
    [selectedPoseIds]
  );

  const togglePoseSelection = React.useCallback(
    (poseId: string) => {
      setSelectedPoseIds((prev) => {
        if (prev.includes(poseId)) {
          // Deselect (clicking same pose removes it)
          return [];
        } else {
          // Select new pose (replaces any existing selection)
          return [poseId];
        }
      });
    },
    []
  );

  const canSelect = selectedPoseIds.length < MAX_SELECTIONS;

  const clearSelection = React.useCallback(() => {
    setSelectedPoseIds([]);
  }, []);

  const saveSelection = React.useCallback((): PoseSelection => {
    return {
      poseIds: selectedPoseIds,
      uploadIds,
    };
  }, [selectedPoseIds, uploadIds]);

  return {
    selectedPoseIds,
    isSelected,
    getSelectionIndex,
    togglePoseSelection,
    canSelect,
    selectionCount: selectedPoseIds.length,
    clearSelection,
    saveSelection,
  };
}
