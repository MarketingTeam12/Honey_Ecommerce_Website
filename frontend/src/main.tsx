import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/styles/index.css'
import { installApiFetchRewrite } from '@/app/utils/api'
import { initErrorTracking } from '@/app/utils/errorTracking'

installApiFetchRewrite()
initErrorTracking()

// NOTE: We intentionally do NOT call initializePersistentStorage() here anymore.
// That utility patched window.localStorage/sessionStorage to proxy through a
// remote backend and called nativeMethods.clear.call(storage) after every
// sync — which wiped the browser's real localStorage on every page load.
// That's what was causing auto-logout and cart/wishlist data loss on refresh
// for both admin and customer accounts. Auth/Cart/Wishlist contexts already
// persist to plain localStorage themselves, so no extra layer is needed.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
