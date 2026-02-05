export interface SparkletMetadata {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    isBeta?: boolean;
    ownerId?: string;
    isPublished?: boolean;
    status?: 'draft' | 'pending' | 'published';
}

export interface Sparklet {
    metadata: SparkletMetadata;
    type: 'game' | 'utility' | 'meta';
    definition?: string; // AI-generated code or config string
}
