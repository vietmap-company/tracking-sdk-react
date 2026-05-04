import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// StrictMode disabled: nó double-invoke effects trong dev gây mỗi API call
// bị gọi 2 lần. Bật lại khi cần test strict behaviors.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
