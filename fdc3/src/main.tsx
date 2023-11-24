import ReactDOM from 'react-dom/client'
import App from './App'
import "./App.css";

const BridgeReady = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
      <App />,
  )
};

if (window.FSBL && window.FSBL.Clients && Object.prototype.hasOwnProperty.call(FSBL.Clients,"BloombergBridgeClient")) {
  BridgeReady();
} else {
  window.addEventListener("BloombergBridgeClientReady", BridgeReady);
}