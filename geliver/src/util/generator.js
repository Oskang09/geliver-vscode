import moment from "moment";

export function randomNumber(num) {
    const array = [];
    for (let i = 0; i < num; i++) {
        array.push(Math.floor(Math.random() * 10).toString());
    }
    return array.join("");
};

export function generateUNIQ() {
    return moment().format("x") + randomNumber(4);
};