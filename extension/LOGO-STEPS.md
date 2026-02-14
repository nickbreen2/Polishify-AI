# After updating the extension logo – what to do

1. **Rebuild the extension** (from project root):
   ```bash
   npm run build:ext
   ```

2. **Reload the extension in Chrome**
   - Open `chrome://extensions`
   - Find **Polishify AI** and click the **reload** (circular arrow) button

3. **If the toolbar icon still shows the old logo**
   - Browsers cache the extension icon. On `chrome://extensions`, click **Remove** on Polishify AI, then **Load unpacked** and select:
   - `extension/output/chrome` (path relative to your project root)

4. **Check the logo**
   - **Toolbar:** The icon next to the address bar
   - **Popup:** Click the extension icon – logo appears next to “Polishify AI”
   - **Popover:** Select text and use Polish – logo appears in the popover header

---

**Changing the logo again later:**  
Put your new logo as `Logo (1).png` (and optionally `Logo (1).svg`) in `public/`, then run `npm run generate-ext-icons` and copy the PNG to `extension/public/logo.png`.
