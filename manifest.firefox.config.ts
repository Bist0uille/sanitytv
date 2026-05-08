import { defineManifest } from '@crxjs/vite-plugin';
import { base } from './manifest.base';

// Firefox MV3 manifest. Firefox 140+ is required because we declare
// `data_collection_permissions` (introduced in 140 — privacy-positive
// signal in the install dialog). Firefox 121-139 falls back to the
// `scripts` background entry, hence we ship both.
const baseManifest = base();
export default defineManifest({
  ...baseManifest,
  background: {
    ...baseManifest.background,
    // Firefox-required fallback for the service_worker key (per
    // https://mzl.la/4r6SF1L). On Chrome the `scripts` key is
    // ignored in MV3; on Firefox it is the actual loader path.
    scripts: ['src/background/index.ts'],
  },
  browser_specific_settings: {
    gecko: {
      id: 'sanitytv@bist0uille.dev',
      strict_min_version: '140.0',
      // Declares to AMO (and to the user during install) that we do
      // not collect any data. Aligns with our privacy policy and the
      // SECURITY-AUDIT findings.
      data_collection_permissions: {
        required: ['none'],
      },
    },
    // (gecko_android is patched in by scripts/post-build-firefox.mjs;
    // CRXJS's typings don't know it yet.)
  },
});
