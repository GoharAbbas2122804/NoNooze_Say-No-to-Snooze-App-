import React from 'react';
import { MethodId, Step } from './types';

import { MathChallenge } from '../components/challenges/MathChallenge';
import { FaceChallenge } from '../components/challenges/FaceChallenge';
import { EnvironmentChallenge } from '../components/challenges/EnvironmentChallenge';
import { PushupsChallenge } from '../components/challenges/PushupsChallenge';

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
  face: {
    id: 'face',
    title: 'Face Wake Check',
    description: 'Computer vision verifies eye alertness and cognitive wakefulness.',
    defaultTarget: 5,
    minTarget: 5,
    maxTarget: 10,
    unit: 'seconds',
    available: true,
    Component: FaceChallenge,
  },
  environment: {
    id: 'environment',
    title: 'Environment & Light Scan',
    description: 'AI room scan ensures you get out of bed into morning light.',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 5,
    unit: 'scans',
    available: true,
    Component: EnvironmentChallenge,
  },
  pushups: {
    id: 'pushups',
    title: 'Pushups',
    description: 'Perform pushups verified by camera pose tracking.',
    defaultTarget: 10,
    minTarget: 5,
    maxTarget: 50,
    unit: 'reps',
    available: true,
    Component: PushupsChallenge,
  },
  situps: {
    id: 'situps',
    title: 'Situps',
    description: 'Core exercise verified by sensor and computer vision.',
    defaultTarget: 15,
    minTarget: 5,
    maxTarget: 50,
    unit: 'reps',
    available: false,
  },
};
