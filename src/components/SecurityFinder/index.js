import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import SecurityFinder from './SecurityFinder';


if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", FSBLReady);
} else {
	window.addEventListener("FSBLReady", FSBLReady);
}

function FSBLReady() {
	ReactDOM.render(
		<SecurityFinder />,
		document.getElementById('root')
	);
}