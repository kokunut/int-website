import type { Department } from '@/lib/types';

const filled = (a?: readonly unknown[]) => !!a && a.length > 0;

/** 상세 페이지에서 어떤 섹션을 렌더링할지 결정한다. */
export function departmentSections(d: Department) {
  return {
    body: d.body.length > 0,
    curriculum: filled(d.curriculum),
    subjects: filled(d.subjects),
    careers: filled(d.careers),
  };
}
