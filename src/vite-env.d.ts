/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DRAFT_MGMT_HASH?: string;
  readonly VITE_DRAFT_MGMT_SALT?: string;
  readonly VITE_FORM_APPS_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
