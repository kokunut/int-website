import { todayKST } from '@/lib/date';
import type { SiteLinks } from '@/lib/types';

export default function Footer({ links }: { links: SiteLinks }) {
  const year = todayKST().slice(0, 4);
  return (
    <footer className="footer">
      <div className="container foot-inner">
        <div>
          <div className="logo-mark">int</div>
          <p style={{ marginTop: 8 }}>세종대학교 인공지능융합대학 학생회 인트</p>
        </div>
        <div className="foot-info" id="foot-info">
          <p>
            <b>주소</b>
            {links.address}
          </p>
          <p>
            <b>Instagram</b>
            <a href={links.instagram} target="_blank" rel="noopener noreferrer">
              {links.instagramId}
            </a>
          </p>
          <p>
            <b>문의</b>
            <a href={links.kakao} target="_blank" rel="noopener noreferrer">
              카카오톡 채널
            </a>
          </p>
        </div>
      </div>
      <div className="container foot-copy">© {year} INT. All rights reserved.</div>
    </footer>
  );
}
