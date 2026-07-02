document.addEventListener('DOMContentLoaded', () => {
    const btnAbrir = document.getElementById('btn-abrir');
    const pantallaInicio = document.getElementById('pantalla-inicio');
    const invitacion = document.getElementById('invitacion');
    const musica = document.getElementById('musica');

    btnAbrir.addEventListener('click', () => {
        // Reproducir música
        musica.play();

        // Transición de pantallas
        pantallaInicio.classList.add('oculto');
        setTimeout(() => {
            invitacion.classList.remove('oculto');
        }, 500); // Pequeño retraso para que el efecto sea suave
    });
});