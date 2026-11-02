import Logo from '@/components/Logo';
import { todayKST } from '@/lib/date';
import type { SiteLinks } from '@/lib/types';

export default function Footer({ links }: { links: SiteLinks }) {
  const year = todayKST().slice(0, 4);
  return (
    <footer className="footer">
      <div className="container foot-inner">
        <div>
          <Logo />
          <p className="mt-8">세종대학교 인공지능융합대학 학생회 인트</p>
        </div>
        <div className="foot-info" id="foot-info">
          <p>
            <b>주소</b>
            <span>{links.address}</span>
          </p>
          <p>
            <b>Instagram</b>
            <span>
              <a href={links.instagram} target="_blank" rel="noopener noreferrer">
                {links.instagramId}
              </a>
            </span>
          </p>
          {links.email && (
            <p>
              <b>이메일</b>
              <span>
                <a href={`mailto:${links.email}`}>{links.email}</a>
              </span>
            </p>
          )}
          <p>
            <b>문의</b>
            <span>
              <a href={links.kakao} target="_blank" rel="noopener noreferrer">
                카카오톡 채널 (확인 필요)
              </a>
            </span>
          </p>
        </div>
      </div>
      <div className="container foot-copy">© {year} INT. All rights reserved.</div>
    </footer>
  );
}
