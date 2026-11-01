import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">404</p>
        <h1>페이지를 찾을 수 없어요</h1>
        <p className="page-desc">주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
      </div>
      <Link className="btn ghost" href="/">
        홈으로
      </Link>
    </section>
  );
}
