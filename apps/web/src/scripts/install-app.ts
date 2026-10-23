/** Shows the menu's "Install app" button where the browser can install Chaalwise (lib/install.ts). */
import { mountInstallButton } from '../lib/install';

const button = document.getElementById('install-app');
const guide = document.getElementById('install-guide');
if (button instanceof HTMLButtonElement && guide instanceof HTMLDialogElement) mountInstallButton(button, guide);
