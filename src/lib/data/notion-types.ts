/** 노션 API 응답 중 이 프로젝트가 읽는 부분만 좁게 정의한 타입 */

export interface NotionRichText {
  plain_text: string;
}

export interface NotionFile {
  file?: { url: string };
  external?: { url: string };
}

export interface NotionProperty {
  type: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  number?: number | null;
  select?: { name: string } | null;
  checkbox?: boolean;
  date?: { start: string; end: string | null } | null;
  url?: string | null;
  files?: NotionFile[];
}

export interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty | undefined>;
}

export interface NotionBlock {
  type: string;
  [key: string]: unknown;
}
