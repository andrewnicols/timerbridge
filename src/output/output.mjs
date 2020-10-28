export default class {
    constructor(argv, frontend) {
        this.argv = argv;
        this.frontend = frontend;
    }

    sendTime(timeData) {
    }

    ready() {
        return Promise.resolve();
    }
}
