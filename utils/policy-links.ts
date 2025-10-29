import { URL_PRIVACY_POLICY, URL_USER_AGREEMENT } from '@/lib/constants';
import { pushToWebViewNormal } from '@/lib/webview';

/**
 * Opens the user agreement page in a webview
 */
export const openUserAgreement = () => {
  pushToWebViewNormal(URL_USER_AGREEMENT, '服务协议');
};

/**
 * Opens the privacy policy page in a webview
 */
export const openPrivacyPolicy = () => {
  pushToWebViewNormal(URL_PRIVACY_POLICY, '隐私政策');
};
