$(document).ready(function() {
    const images = {{ images|tojson }};
    let currentIndex = 0;

    function updateImage() {
        $('#image').attr('src', `/static/images/chitra_samputa/${images[currentIndex]}`);
    }

    $('#prevBtn').click(function() {
        if (currentIndex > 0) {
            currentIndex--;
            updateImage();
        }
    });

    $('#nextBtn').click(function() {
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateImage();
        }
    });

    let zoomLevel = 1;

    $('#zoomInBtn').click(function() {
        zoomLevel += 0.1;
        $('#image').css('transform', `scale(${zoomLevel})`);
    });

    $('#zoomOutBtn').click(function() {
        if (zoomLevel > 0.1) {
            zoomLevel -= 0.1;
            $('#image').css('transform', `scale(${zoomLevel})`);
        }
    });
});
