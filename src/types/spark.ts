export interface SparkMetadata {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'productivity' | 'travel' | 'food' | 'education' | 'golf' | 'game' | 'media' | 'utility' | 'community' | 'health';
  createdAt: string; // ISO date string
  rating: number; // 1-5 stars
}

export interface SparkConfig {
  [key: string]: any;
}

export interface SparkState {
  [key: string]: any;
}

export interface SparkProps {
  config?: SparkConfig;
  onStateChange?: (state: SparkState) => void;
  onComplete?: (result: any) => void;
  showSettings?: boolean;
  onCloseSettings?: () => void;
}

export interface BaseSpark {
  metadata: SparkMetadata;
  component: React.ComponentType<SparkProps>;
}