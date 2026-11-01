import { describe, expect, it } from 'vitest';
import { org } from '@/content/council';
import { getCouncilSummary, getOrg, sortMembers } from '@/lib/data';

describe('council roster', () => {
  it('has unique unit ids', () => {
    const ids = org.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has at most one lead per unit', () => {
    for (const u of org) {
      expect(u.members.filter((m) => m.lead).length).toBeLessThanOrEqual(1);
    }
  });

  it('has 25 members in total', async () => {
    expect(org.reduce((n, u) => n + u.members.length, 0)).toBe(25);
    expect((await getCouncilSummary()).total).toBe(25);
  });

  it('puts the lead first and keeps the rest in order', async () => {
    const sorted = sortMembers([{ name: 'a' }, { name: 'b', lead: true }, { name: 'c' }]);
    expect(sorted.map((m) => m.name)).toEqual(['b', 'a', 'c']);
    for (const u of await getOrg()) {
      const leadIdx = u.members.findIndex((m) => m.lead);
      if (leadIdx !== -1) expect(leadIdx).toBe(0);
    }
  });
});
