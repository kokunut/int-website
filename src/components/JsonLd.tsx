import { serializeJsonLd } from '@/lib/seo';

/** 서버에서 렌더링하는 JSON-LD. 직렬화 때 `<` 를 이스케이프한다. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
