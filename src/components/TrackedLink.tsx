'use client';

import type { ComponentProps } from 'react';
import { trackEvent, type AnalyticsEvent } from '@/lib/analytics';
import AppLink from './AppLink';

type Props = Omit<ComponentProps<typeof AppLink>, 'onClick'> & { event: AnalyticsEvent };

/** 클릭 시 커스텀 이벤트를 남기는 AppLink (서버 컴포넌트에서 사용) */
export default function TrackedLink({ event, ...props }: Props) {
  return <AppLink {...props} onClick={() => trackEvent(event)} />;
}
