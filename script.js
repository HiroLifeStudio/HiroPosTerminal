// script.js

const statusElement = document.getElementById('paymentStatus');
const subtotalElement = document.getElementById('subtotalDisplay');
const taxElement = document.getElementById('taxDisplay');
const totalElement = document.getElementById('amountDisplay');
const card = document.getElementById('card');
const terminal = document.querySelector('.payment-terminal');
const successScreen = document.getElementById('successScreen');
const closeButton = document.getElementById('closeButton');
const screenMask = document.querySelector('.screen-mask');
const successSound = new Audio('https://cdn.discordapp.com/attachments/1307978061341265953/1353617960207388704/Success.mp3');

let active = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0;
let yOffset = 0;
let cardInNfcZone = false;
let paymentProcessed = false;
let resetInProgress = false;
let hasBeenDragged = false;
let hasVisitedNfcZone = false;

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updatePaymentInfo(subtotal, tax, total) {
    subtotalElement.textContent = '$' + formatNumber(subtotal);
    taxElement.textContent = '$' + formatNumber(tax);
    totalElement.textContent = '$' + formatNumber(total);
}

function updatePaymentStatus(status) {
    statusElement.textContent = status;
    if (status.includes('exitoso')) {
        statusElement.style.background = 'var(--active)';
    } else if (status.includes('Procesando')) {
        statusElement.style.background = 'var(--primary-light)';
    } else if (status.includes('error')) {
        statusElement.style.background = '#ef4444';
    } else {
        statusElement.style.background = 'var(--primary-light)';
    }
}

updatePaymentInfo(100, 16, 116);
updatePaymentStatus('Acerca tu tarjeta para pagar');

card.addEventListener('mousedown', dragStart, { passive: false });
document.addEventListener('mousemove', drag, { passive: false });
document.addEventListener('mouseup', dragEnd);
card.addEventListener('touchstart', dragStart, { passive: false });
document.addEventListener('touchmove', drag, { passive: false });
document.addEventListener('touchend', dragEnd);

screenMask.addEventListener('mousedown', function(e) {
    if (resetInProgress) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});

function dragStart(e) {
    if (paymentProcessed || resetInProgress) return;
    e.preventDefault();
    if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }
    if (e.target === card || card.contains(e.target)) {
        active = true;
        card.classList.add('active');
        hasBeenDragged = false;
        hasVisitedNfcZone = false;
        cardInNfcZone = false;
    }
}

function drag(e) {
    if (active) {
        e.preventDefault();
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
        } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
        }
        if (Math.abs(currentX - xOffset) > 5 || Math.abs(currentY - yOffset) > 5) {
            hasBeenDragged = true;
        }
        xOffset = currentX;
        yOffset = currentY;
        requestAnimationFrame(() => {
            setTranslate(currentX, currentY, card);
            checkNfcZone();
        });
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function dragEnd(e) {
    if (!active) return;
    initialX = currentX;
    initialY = currentY;
    active = false;
    card.classList.remove('active');
    if (cardInNfcZone && hasBeenDragged && hasVisitedNfcZone && !paymentProcessed && !resetInProgress) {
        processPayment();
    }
}

function checkNfcZone() {
    const cardRect = card.getBoundingClientRect();
    const nfcZoneRect = document.getElementById('nfcZone').getBoundingClientRect();
    const dropIndicator = document.getElementById('nfcDropIndicator');

    if (
        cardRect.top < nfcZoneRect.bottom &&
        cardRect.bottom > nfcZoneRect.top &&
        cardRect.left < nfcZoneRect.right &&
        cardRect.right > nfcZoneRect.left
    ) {
        dropIndicator.classList.add('active');
        cardInNfcZone = true;
        hasVisitedNfcZone = true;
    } else {
        dropIndicator.classList.remove('active');
        cardInNfcZone = false;
    }
}

function processPayment() {
    if (paymentProcessed || resetInProgress) return;
    paymentProcessed = true;
    updatePaymentStatus('Procesando pago...');
    card.classList.add('payment-success-animation');
    setTimeout(() => {
        card.classList.add('hide');
        setTimeout(() => {
            successSound.play().catch(error => console.log('Error al reproducir sonido:', error));
            showSuccessScreen();
            card.classList.remove('payment-success-animation');
        }, 500);
    }, 1500);
}

function showSuccessScreen() {
    successScreen.classList.add('show');
}

closeButton.addEventListener('click', () => {
    resetInProgress = true;
    successScreen.classList.remove('show');
    terminal.style.pointerEvents = 'none';
    setTimeout(() => {
        resetPaymentInfo();
        setTimeout(() => {
            terminal.style.pointerEvents = 'auto';
            resetInProgress = false;
        }, 500);
    }, 500);
});

function resetPaymentInfo() {
    updatePaymentStatus('Acerca tu tarjeta para pagar');
    xOffset = 0;
    yOffset = 0;
    setTranslate(0, 0, card);
    card.classList.remove('hide');
    paymentProcessed = false;
    hasBeenDragged = false;
    hasVisitedNfcZone = false;
    cardInNfcZone = false;
}
