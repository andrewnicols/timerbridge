import UI from './ui.mjs';

export default class extends UI {
    addLog(statusText) {
        console.log(statusText);
    }

    setLocalTime(time) {
    }

    setRemoteTime(time) {
        console.log(time);
    }
}
