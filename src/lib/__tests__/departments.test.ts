import { describe, expect, it } from 'vitest';
import { majorNames, org } from '@/content/council';
import { departments, TBC } from '@/content/departments';

describe('departments', () => {
  it('has 14 departments with unique ids', () => {
    expect(departments).toHaveLength(14);
    const ids = departments.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a sejong.ac.kr source on every department', () => {
    for (const d of departments) {
      expect(d.source).toMatch(/^https:\/\/www\.sejong\.ac\.kr\//);
    }
  });

  it('marks researched fields as 확인 필요', () => {
    for (const d of departments) {
      for (const v of [d.intro, d.office, d.phone, d.career, ...d.body]) {
        expect(v.endsWith(TBC), `${d.id}: ${v}`).toBe(true);
      }
    }
  });
});

describe('major abbreviations', () => {
  it('has a full name for every abbreviation used in the roster', () => {
    for (const u of org) {
      for (const m of u.members) {
        if (m.major) expect(majorNames[m.major], m.major).toBeTruthy();
      }
    }
  });
});
