/**
 * 노션 DB 자동 생성: `npm run notion:setup -- [--parent <id|URL>] [--dry-run] [--seed] [--write-env]`
 * 부모 페이지 아래에 DB 7개를 만들고(이미 같은 제목이 있으면 재사용), DB id 를 출력한다.
 * 비밀값이 필요하므로 CI 에는 넣지 않는다. 실행 흐름은 src/lib/data/notion-setup-run.ts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createApi, runSetup } from '../src/lib/data/notion-setup-run';

for (const f of ['.env.local', '.env']) if (existsSync(f)) process.loadEnvFile(f);

const argv = process.argv.slice(2);
const flag = (name: string): boolean => argv.includes(`--${name}`);
const parentIdx = argv.indexOf('--parent');
const parent = parentIdx >= 0 ? argv[parentIdx + 1] : process.env.NOTION_PARENT_PAGE_ID;
const token = process.env.NOTION_TOKEN;
const log = (msg: string): void => console.log(msg);

runSetup(
  { dryRun: flag('dry-run'), seed: flag('seed'), writeEnv: flag('write-env'), parent },
  {
    token,
    api: token
      ? createApi({
          token,
          fetch,
          sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
          now: Date.now,
          log,
        })
      : undefined,
    log,
    readFile: (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null),
    writeFile: (p, c) => writeFileSync(p, c),
  },
).catch((e: unknown) => {
  console.error(`\n❌ ${(e as Error).message}`);
  process.exit(1);
});
