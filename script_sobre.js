document.addEventListener("DOMContentLoaded", () => {
    const envelope = document.getElementById("envelopeContainer");

    envelope.addEventListener("click", () => {
        // Alterna la clase 'open' para disparar la animación de abrir/cerrar
        envelope.classList.toggle("open");
    });
});