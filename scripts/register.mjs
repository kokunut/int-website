// node 로 .ts 를 직접 실행할 때 확장자 없는 상대 import('./x') 를 './x.ts' 로 풀어 주는 훅 (의존성 없음)
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (err && err.code === 'ERR_MODULE_NOT_FOUND' && /^\.\.?\//.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw err;
    }
  },
});
