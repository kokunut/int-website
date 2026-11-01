import type { OrgUnit } from '@/lib/types';

// 학과 약어 → 정식 명칭 (웹 조사, 확인 필요. docs/brain/04-glossary.md). 명단에서 마우스오버(title)로 보여 준다.
export const majorNames: Record<string, string> = {
  반시공: '반도체시스템공학과',
  컴공: '컴퓨터공학과',
  디이노: '디자인이노베이션전공',
  만애텍: '만화애니메이션텍전공',
  정보보호: '정보보호학과',
  양지정: '양자지능정보학과',
  콘소: '콘텐츠소프트웨어학과',
  인데사: '인공지능데이터사이언스학과',
  첨단융합: '전공자율선택제 첨단융합계열',
  it계열: '전공자율선택제 IT계열',
  지능기전: '지능기전공학과 (확인 필요)',
};

// 집행부 명단 (학생회 명단 사진 기준). 학과·전공 약칭은 원문 그대로 둔다.
// lead: true = 부장. 표시할 때 부장이 맨 앞으로 정렬된다.
export const org: OrgUnit[] = [
  {
    id: 'exec',
    name: '회장단',
    desc: '학생회 운영 총괄',
    members: [
      { name: '박상현', major: '반시공', role: '회장' },
      { name: '최수현', major: '컴공', role: '부회장' },
      { name: '황윤영', major: '디이노', role: '선본장' },
      { name: '김진형', major: '반시공', role: '부선본장' },
    ],
  },
  {
    id: 'pr',
    name: '홍보부',
    desc: 'SNS·웹사이트 운영, 디자인',
    members: [
      { name: '강현지', major: '디이노', lead: true },
      { name: '김현정', major: '디이노' },
      { name: '서수빈', major: '만애텍' },
    ],
  },
  {
    id: 'welfare',
    name: '소통복지부',
    desc: '검정비 페이백, 제휴, 건의함 등 학생 소통·복지 사업',
    members: [
      { name: '조랑언', major: '정보보호', lead: true },
      { name: '박찬웅', major: '양지정' },
      { name: '최승준', major: '양지정' },
      { name: '전휴민', major: '컴공' },
      { name: '조경호', major: '첨단융합' },
    ],
  },
  {
    id: 'edu',
    name: '교육부',
    desc: '취업 길라잡이, 오픈랩, 학술제 등 학업 지원 사업',
    members: [
      { name: '천동현', major: '지능기전', lead: true },
      { name: '고규민', major: '지능기전' },
      { name: '권률환', major: 'it계열' },
      { name: '이연수', major: '콘소' },
      { name: '전지효', major: '콘소' },
      { name: '정채은', major: '첨단융합' },
    ],
  },
  {
    id: 'culture',
    name: '문화부',
    desc: '축제·행사 기획 및 운영',
    members: [
      { name: '박현준', major: '반시공', lead: true },
      { name: '김채현', major: '인데사' },
      { name: '이주환', major: '반시공' },
      { name: '황영찬', major: '반시공' },
    ],
  },
  {
    id: 'office',
    name: '사무부',
    desc: '회의록·회계·서류 관리',
    members: [
      { name: '안소민', major: '인데사', lead: true },
      { name: '조상훈' },
      { name: '박정균', major: '반시공' },
    ],
  },
];
