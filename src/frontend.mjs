export default class {
    constructor(argv = {}) {
        this.argv = argv;
    }

    addLog(statusText) {
        console.log(statusText);
    }

    setLocalTime(time) {
    }

    setRemoteTime(time) {
        console.log(time);
    }
}
