import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import SecurityFinder from './SecurityFinder';

window.addEventListener("BloombergBridgeClientReady", BBGReady);

function BBGReady() {
	ReactDOM.render(
		<SecurityFinder />,
		document.getElementById('root')
	);
}