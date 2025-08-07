import { Research } from '@/types/research';

// In-memory storage for development
// In production, this would be replaced with a database
const researchStore = new Map<string, Research>();

export const researchStorage = {
  async save(research: Research): Promise<void> {
    researchStore.set(`research:${research.id}`, research);
  },

  async get(id: string): Promise<Research | null> {
    return researchStore.get(`research:${id}`) || null;
  },

  async list(): Promise<Research[]> {
    const researches: Research[] = [];
    for (const [key, value] of researchStore.entries()) {
      if (key.startsWith('research:')) {
        researches.push(value);
      }
    }
    return researches.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async update(id: string, updates: Partial<Research>): Promise<Research | null> {
    const existing = await this.get(id);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.save(updated);
    return updated;
  }
};