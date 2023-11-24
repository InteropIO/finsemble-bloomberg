import ReactDOM from 'react-dom/client'
import App from './App'
import "./App.css";

const FSBLReady = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
      <App />,
  )
};

if (window.FSBL && FSBL.addEventListener) {
  FSBL.addEventListener("onReady", FSBLReady);
} else {
  window.addEventListener("FSBLReady", FSBLReady);
}