$(document).ready(function () {
    let currentIndex = 0;

    // Helper function to get base path from ApiClient or location
    function getBasePath() {
        if (typeof window.ApiClient !== 'undefined' && window.ApiClient.baseUrl) {
            return window.ApiClient.baseUrl;
        }
        const pathname = window.location.pathname;
        const kvbMatch = pathname.match(/^(.*?\/kvb\/)/);
        if (kvbMatch) {
            return kvbMatch[1];
        }
        return '/';
    }

    // Helper to construct static URLs
    function getStaticUrl(path) {
        const basePath = getBasePath();
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
        return `${cleanBasePath}${cleanPath}`;
    }

    function updateImage() {
        console.log(`Updating image to: ${images[currentIndex]}`);
        const imageUrl = getStaticUrl(`/static/images/chitra_samputa/${images[currentIndex]}`);
        $('#image').attr('src', imageUrl);
    }

    $('#prevBtn').click(function () {
        console.log('Previous button clicked');
        if (currentIndex > 0) {
            currentIndex--;
            updateImage();
        }
    });

    $('#nextBtn').click(function () {
        console.log('Next button clicked');
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateImage();
        }
    });

    let zoomLevel = 1;

    $('#zoomInBtn').click(function () {
        console.log('Zoom In button clicked');
        zoomLevel += 0.1;
        $('#image').css('transform', `scale(${zoomLevel})`);
    });

    $('#zoomOutBtn').click(function () {
        console.log('Zoom Out button clicked');
        if (zoomLevel > 0.1) {
            zoomLevel -= 0.1;
            $('#image').css('transform', `scale(${zoomLevel})`);
        }
    });
});
