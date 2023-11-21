import ReactDOM from 'react-dom/client'
import App from './App.tsx'

window.addEventListener("FSBLReady", () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
      <App />,
  )
});
