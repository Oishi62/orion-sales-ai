/**
 * Display warning in browser console about security risks
 * This helps educate users about the risks of exposing sensitive data
 */

export const displayDevToolsWarning = () => {
  if (typeof window !== 'undefined' && window.console) {
    const warningStyle = 'color: #ff6b6b; font-size: 16px; font-weight: bold;';
    const infoStyle = 'color: #ffa726; font-size: 14px;';
    
    console.log('%c⚠️ SECURITY WARNING', warningStyle);
    console.log('%cThis is a browser feature intended for developers.', infoStyle);
    console.log('%cIf someone told you to copy/paste something here, it could be a scam.', infoStyle);
    console.log('%cNever enter passwords, tokens, or sensitive information in this console.', infoStyle);
    console.log('%cFor more information about browser security, visit: https://developer.mozilla.org/en-US/docs/Web/Security', infoStyle);
  }
};

// Display warning when the module is loaded
if (process.env.NODE_ENV === 'production') {
  displayDevToolsWarning();
}
