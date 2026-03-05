import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    server: {
      port: 3001,
    },
  }),
  manifest: {
    name: "Polishify AI",
    description: "Select text, polish it with AI, replace it in-place.",
    version: "0.1.0",
    permissions: ["activeTab", "contextMenus", "storage"],
    host_permissions: ["https://polishify.app/*"],
    commands: {
      "polish-selection": {
        suggested_key: {
          default: "Ctrl+Shift+O",
          mac: "Command+Shift+O",
        },
        description: "Polish selected text with AI",
      },
      "open-popup": {
        suggested_key: {
          default: "Ctrl+I",
          mac: "Command+I",
        },
        description: "Open Polishify AI popup",
      },
    },
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "128": "icon/128.png",
    },
  },
});
