import { Research } from '@/types/research';
import { fileKv } from './file-kv';

export const researchStorage = {
  async save(research: Research): Promise<void> {
    fileKv.set(`research:${research.id}`, research);
  },

  async get(id: string): Promise<Research | null> {
    return fileKv.get<Research>(`research:${id}`);
  },

  async list(): Promise<Research[]> {
    const researches = fileKv.list<Research>().filter(r => r.id);
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