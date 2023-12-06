import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import 'semantic-ui-css/semantic.min.css'
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  //<React.StrictMode> // todo: replace when https://github.com/Semantic-Org/Semantic-UI-React/pull/4233 fixed
    <App />
  //</React.StrictMode>
);
