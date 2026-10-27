import React from 'react';
import { MethodId, Step } from './types';

import { MathChallenge } from '../components/challenges/MathChallenge';

export interface DismissMethodProps {
  step: Step;
  onProgress: () => void;
  onComplete: () => void;
}

export interface DismissMethod {
  id: MethodId;
  title: string;
  description: string;
  defaultTarget: number;
  minTarget: number;
  maxTarget: number;
  unit: string;
  available: boolean;
  Component?: React.ComponentType<DismissMethodProps>;
}

export const DISMISSAL_METHODS: Record<MethodId, DismissMethod> = {
  math: {
    id: 'math',
    title: 'Math Problems',
    description: 'Solve arithmetic equations to wake up your brain.',
    defaultTarget: 3,
    minTarget: 1,
    maxTarget: 10,
    unit: 'problems',
    available: true,
    Component: MathChallenge,
  },
  pushups: {
    id: 'pushups',
    title: 'Pushups',
    description: 'Perform pushups verified by camera pose tracking.',
    defaultTarget: 10,
    minTarget: 5,
    maxTarget: 50,
    unit: 'reps',
    available: false, // Week 2
  },
  situps: {
    id: 'situps',
    title: 'Situps',
    description: 'Core exercise verified by sensor and computer vision.',
    defaultTarget: 15,
    minTarget: 5,
    maxTarget: 50,
    unit: 'reps',
    available: false, // Week 3
  },
  face: {
    id: 'face',
    title: 'Wake State Check',
    description: 'Eye and expression check to ensure you are fully awake.',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 1,
    unit: 'check',
    available: false, // Week 4
  },
};
