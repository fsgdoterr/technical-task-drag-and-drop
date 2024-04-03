const form = document.querySelector('#form');
const sentence = document.querySelector('#sentence');
const selectingArea = document.querySelector('#selecting-area');

let selectedItems = [];
let selectedItemsInSentence = [];

let isCtrl = false;
let isDrag = false;
let isSelecting = false;
let isMovable = false;
let startMousePos;

const addLetter = (letter, index) => {
    const span = document.createElement('span');
    span.classList.add('letter');
    span.innerText = letter;

    sentence.append(span);

    setStartInfo(span, index);
}

form.addEventListener('submit', e => {
    e.preventDefault();

    selectedItems = selectedItems.filter(item => item.parentNode !== sentence);
    sentence.innerHTML = '';

    const value = form.querySelector('input').value;

    [...value.trim()].forEach(addLetter);
});

addEventListener('keydown', e => {
    if(e.key === 'Control') isCtrl = true;
});

addEventListener('keyup', e => {
    if(e.key === 'Control') isCtrl = false;
});

const uncolorItems = () => {
    selectedItems.forEach(item => item.classList.remove('active'));
}

const unselectItems = () => {
    uncolorItems();
    selectedItems.forEach(item => item.classList.remove('current'));
    selectedItems = [];
    selectedItemsInSentence = [];
}

const addToMultiple = item => {
    item.classList.add('active');
    selectedItems.push(item);
    if(item.parentNode === sentence) selectedItemsInSentence.push(item);
}

const startDragging = item => {
    if(!selectedItems.includes(item)) {
        unselectItems();
        selectedItems.push(item);
        if(item.parentNode === sentence) selectedItemsInSentence.push(item);
    }
    uncolorItems();
    selectedItems.forEach(item => setStartInfo(item, item.parentNode === sentence ? item.posInSentence : undefined));
    isDrag = true;
}

addEventListener('mousedown', e => {
    const {target, pageX: x, pageY: y} = e;
    startMousePos = {x, y};

    switch(true) {
        case isBody(target):
            unselectItems();
            isSelecting = true;
            break;
        case isCtrl && isLetter(target):
            addToMultiple(target);
            break;
        case (isLetter(target) && !isEmptyLetter(target)) || (isLetter(target) && selectedItems.length > 1):
            startDragging(target);
            break;
        default:
            unselectItems();
            break;
    }
});

const selecting = (endX, endY) => {
    if(!startMousePos) return;
    const {x, y} = startMousePos;

    const left = x < endX ? x : endX;
    const top = y < endY ? y : endY;

    const width = Math.abs(x - endX);
    const height = Math.abs(y- endY);

    selectingArea.style.left = `${left}px`;
    selectingArea.style.top = `${top}px`;
    selectingArea.style.width = `${width}px`;
    selectingArea.style.height = `${height}px`;
}

const swapDefault = (letter) => {
    const emptyLetter = createEmptyLetter(letter);

    sentence.insertBefore(emptyLetter, letter);
    document.body.append(letter);
    letter.style.left = `${letter.startX}px`;
    letter.style.top = `${letter.startY}px`;
    letter.emptyLetter = emptyLetter;
    emptyLetter.letter = letter;
}

const drag = (toX, toY) =>  {
    if(selectedItemsInSentence.length) {
        selectedItemsInSentence.forEach(swapDefault);
        selectedItemsInSentence = [];
    }

    selectedItems.forEach(item => {
        const x = toX - (startMousePos.x - item.startX);
        const y = toY - (startMousePos.y - item.startY);

        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
    });
}

addEventListener('mousemove', e => {
    const {pageX: x, pageY: y} = e;
    if(!startMousePos) return;

    if(isSelecting) {
        selecting(x, y);
        isMovable = true;
    }
    else if(isDrag) {
        drag(x, y);
        isMovable = true;

    }
});

const getItemsInSelectArea = () => {
    const {x1: rectX1, x2: rectX2, y1: rectY1, y2: rectY2} = getCoords(selectingArea);

    const letters = getAllLetters();
    const selectedLetters = [...letters].filter(l => {
        const {x1, x2, y1, y2} = getCoords(l);

        return isXInArea(x1, x2, rectX1, rectX2) && isYInArea(y1, y2, rectY1, rectY2);
    });

    return selectedLetters;
}

const select = () => {
    // const elements = getItemsInSelectArea();
    const elements = trim(getItemsInSelectArea());
    elements.forEach(addToMultiple);

    selectingArea.style.left = ``;
    selectingArea.style.top = ``;
    selectingArea.style.width = ``;
    selectingArea.style.height = ``;
    isSelecting = false;
    startMousePos = null;
}

const back = item => {
    if(sentence.contains(item.emptyLetter)) {
        sentence.insertBefore(item, item.emptyLetter);
        item.emptyLetter.remove();
        item.emptyLetter = undefined;
    }
}

const swapInSentence = (from, to) => {
    const fromPos = from.posInSentence;
    const toPos = to.posInSentence;
    swapDefault(to);

    sentence.insertBefore(from, to.emptyLetter);
    from.emptyLetter.parentNode.insertBefore(to, from.emptyLetter);

    sentence.removeChild(from.emptyLetter);
    sentence.removeChild(to.emptyLetter);
    from.emptyLetter = undefined;
    to.emptyLetter = undefined;

    from.posInSentence = toPos;
    to.posInSentence = fromPos;
} 

const swapFromGlobally = (from, to) => {
    const [x1, y1] = [from.startX, from.startY];
    const toPos = to.posInSentence;
    swapDefault(to);

    sentence.insertBefore(from, to.emptyLetter);
    sentence.removeChild(to.emptyLetter);
    to.emptyLetter = undefined;

    to.style.left = `${x1}px`;
    to.style.top = `${y1}px`;

    from.posInSentence = toPos;
    to.posInSentence = undefined;

    if(to.classList.contains('empty')) {
        to.letter.emptyLetter = undefined;
        to.remove();
    }
} 

const swapFromSentence = (from, to) => {
    const {x1, y1} = getCoords(to);
    const fromPos = from.posInSentence;
    
    sentence.insertBefore(to, from.emptyLetter);
    sentence.removeChild(from.emptyLetter);
    sentence.emptyLetter = undefined;
    
    from.style.left = `${x1}px`;
    from.style.top = `${y1}px`;
    
    to.posInSentence = fromPos;
    from.posInSentence = undefined;
} 

const swapInGlobally = (from, to) => {
    const [fromX, fromY] = [from.startX, from.startY];
    const {x1: toX, y1: toY} = getCoords(to);

    from.style.left = `${toX}px`;
    from.style.top = `${toY}px`;
    to.style.left = `${fromX}px`;
    to.style.top = `${fromY}px`;
} 

const swap = () => {
    const swapItem = selectedItems[0];

    const letters = getAllLetters().filter(item => item !== swapItem);


    const {
        x1: itemX1, 
        x2: itemX2, 
        y1: itemY1, 
        y2: itemY2
    } = getCoords(swapItem);


    const allIntersectionItems = []

    for(let letter of letters) {
        const {
            x1: letterX1, 
            x2: letterX2, 
            y1: letterY1, 
            y2: letterY2
        } = getCoords(letter);

        if(isXInArea(letterX1, letterX2, itemX1, itemX2) && isYInArea(letterY1, letterY2, itemY1, itemY2)) {
            allIntersectionItems.push(letter);
        }
    }

    let intersectionItem;
    for(let item of allIntersectionItems) {
        const distance = getDistanceFromItems(swapItem, item);
        if(!intersectionItem || intersectionItem[1] > distance) {
            intersectionItem = [item, distance];
        }
    }
    if(!intersectionItem) return;
    intersectionItem = intersectionItem[0];

    switch(true) {
        case swapItem.emptyLetter === intersectionItem:
            back(swapItem);
            break;
        case intersectionItem.parentNode === sentence && swapItem.posInSentence >= 0:
            swapInSentence(swapItem, intersectionItem);
            break;
        case swapItem.posInSentence >= 0 && intersectionItem.posInSentence === undefined:
            swapFromSentence(swapItem, intersectionItem);
            break;
        case swapItem.posInSentence === undefined && intersectionItem.parentNode === sentence:
            swapFromGlobally(swapItem, intersectionItem);
            break;
        default:
            swapInGlobally(swapItem, intersectionItem);
            break;
    }
}

const trimOriginalText = () => {
    const letters = getSentenceLetters();
    const clearLetters = trim(letters);
    const removedLetters = letters.filter(l => !clearLetters.includes(l));

    console.log(clearLetters, removedLetters);

    removedLetters.forEach(l => {
        if(l.classList.contains('empty')) {
            l.letter.emptyLetter = undefined;
        }

        l.remove();
    })
}

const endDrag = () => {
    if(selectedItems.length == 1) swap();
    selectedItems.forEach(item => {
        if(item.parentNode !== sentence) {
            item.posInSentence = undefined;
        }
        if(!item.innerText) {
            return back(item);
        }
        if(isEmptyLetter(item)) {
            item.letter.emptyLetter = undefined;
            return item.remove();
        }
    });
    trimOriginalText();
    selectedItems = [];
    isDrag = false;
}

addEventListener('mouseup', e => {
    const {pageX: x, pageY: y} = e;

    if(!isMovable) {
        isSelecting = false;
        isDrag = false;
    }
    if(isSelecting) select();
    else if(isDrag) endDrag(x, y);
    startMousePos = null;
});

/// helpers

const getCoords = item => {
    const {x: x1, y: y1, width, height} = item.getBoundingClientRect();
    const x2 = x1 + width;
    const y2 = y1 + height;

    return {x1, x2, y1, y2, centerX: x1 + width / 2, centerY: y1 + height / 2};
}

const createEmptyLetter = letter => {
    const emptyLetter = document.createElement('span');
    emptyLetter.classList.add('letter', 'empty');
    emptyLetter.innerText = letter.innerText;

    return emptyLetter;
}

const getSentenceLetters = () => [...sentence.querySelectorAll('.letter')];

const getAllLetters = () => [...document.querySelectorAll('.letter')];

const isBody = elem => document.body === elem;

const isLetter = elem => elem.classList.contains('letter');

const isEmptyLetter = elem => elem.classList.contains('empty');

const isXInArea = (x1, x2, rectX1, rectX2) => (x1 >= rectX1 &&  x1 <= rectX2) || (x2 >= rectX1 && x2 <= rectX2);

const isYInArea = (y1, y2, rectY1, rectY2) => (y1 >= rectY1 &&  y1 <= rectY2) || (y2 >= rectY1 && y2 <= rectY2);

const setStartInfo = (item, pos = undefined, x = undefined, y = undefined) => {
    const {x1, y1} = getCoords(item)
    item.startX = x ?? x1;
    item.startY = y ?? y1;
    item.posInSentence = pos;
}

const distance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

const getDistanceFromItems = (item1, item2) => {
    const {centerX: item1CenterX, centerY: item1CenterY} = getCoords(item1);
    const {centerX: item2CenterX, centerY: item2CenterY} = getCoords(item2);

    return distance(item1CenterX, item1CenterY, item2CenterX, item2CenterY);
}

const trimLeft = items => {
    for(let key in items) {
        if(!(!items[key].innerText.trim() || items[key].classList.contains('empty'))) {
            return items.slice(key, items.length);
        }
    }
    return [];
}

const trimRight = items => {
    for (let i = items.length - 1;i >= 0; i--) {
        if(!(!items[i].innerText.trim() || items[i].classList.contains('empty'))) {
            return items.slice(0, i + 1);
        }
    }
    return [];
}

const trim = items => trimLeft(trimRight(items));