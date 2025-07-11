// Файл для тестирования ESLint правила
// Эти функции НЕ имеют JSDoc комментариев и должны вызывать ошибки

function testFunction() {
    return "Эта функция без JSDoc";
}

const arrowFunction = () => {
    return "Стрелочная функция без JSDoc";
};

const useCustomHook = () => {
    return "React хук без JSDoc";
};

// Эта функция анонимная и не должна вызывать ошибку
setTimeout(function() {
    console.log("Анонимная функция");
}, 1000);

// Новая функция без JSDoc для тестирования режима --new
function newTestFunction(param) {
    return `New function result: ${param}`;
}

module.exports = {
    testFunction,
    arrowFunction,
    useCustomHook,
    newTestFunction
};