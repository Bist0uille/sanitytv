import { defineManifest } from '@crxjs/vite-plugin';
import { base } from './manifest.base';

// Firefox MV3 manifest. Firefox 121+ supports MV3 service workers and
// matches Chrome MV3 closely. The only mandatory delta is
// `browser_specific_settings.gecko.id`, which AMO uses as the stable
// identifier for the add-on.
export default defineManifest({
  ...base(),
  browser_specific_settings: {
    gecko: {
      id: 'sanitytv@bist0uille.dev',
      strict_min_version: '121.0',
      // Declares to AMO (and to the user during install) that we do
      // not collect any data. Aligns with our privacy policy and the
      // SECURITY-AUDIT findings.
      data_collection_permissions: {
        required: ['none'],
      },
    },
  },
});
