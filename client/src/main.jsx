import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import App from './App';

/* Mantine v7 requires its core CSS */
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import './index.css';

/* The hero marquee and the ticker run on infinite CSS animations. A
   background tab should not burn battery on motion nobody is watching,
   so a body class pauses them (see .bb-hidden in index.css). */
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('bb-hidden', document.hidden);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>,
);
