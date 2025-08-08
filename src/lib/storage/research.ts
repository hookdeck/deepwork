import { Research } from "@/types/research";
import kvStore from "./kv";

export const researchStorage = {
  async save(research: Research): Promise<void> {
    await kvStore.set(`research:${research.id}`, research);
  },

  async get(id: string): Promise<Research | null> {
    return await kvStore.get<Research>(`research:${id}`);
  },

  async list(): Promise<Research[]> {
    const researches = await kvStore.list<Research>();
    return researches
      .filter((r) => r.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async update(
    id: string,
    updates: Partial<Research>
  ): Promise<Research | null> {
    const existing = await this.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.save(updated);
    return updated;
  },
};
