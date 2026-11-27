import { mount } from 'svelte';
import App from './App.svelte';
import './fonts.css';
import './app.css';
import { app } from './state/app.svelte';

void app.loadContent();

// On the dev server, reload the content whenever a file in content/ changes.
if (import.meta.hot) {
  import.meta.hot.on('cqr:content', () => void app.loadContent());
}

export default mount(App, { target: document.getElementById('app')! });
