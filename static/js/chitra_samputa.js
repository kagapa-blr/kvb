$(document).ready(function() {
    let currentIndex = 0;

    function updateImage() {
        console.log(`Updating image to: ${images[currentIndex]}`);
        $('#image').attr('src', `/static/images/chitra_samputa/${images[currentIndex]}`);
    }

    $('#prevBtn').click(function() {
        console.log('Previous button clicked');
        if (currentIndex > 0) {
            currentIndex--;
            updateImage();
        }
    });

    $('#nextBtn').click(function() {
        console.log('Next button clicked');
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateImage();
        }
    });

    let zoomLevel = 1;

    $('#zoomInBtn').click(function() {
        console.log('Zoom In button clicked');
        zoomLevel += 0.1;
        $('#image').css('transform', `scale(${zoomLevel})`);
    });

    $('#zoomOutBtn').click(function() {
        console.log('Zoom Out button clicked');
        if (zoomLevel > 0.1) {
            zoomLevel -= 0.1;
            $('#image').css('transform', `scale(${zoomLevel})`);
        }
    });
});
