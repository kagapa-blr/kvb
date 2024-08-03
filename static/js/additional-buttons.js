$(document).ready(function () {
    // API endpoints mapped to modal IDs
    const apiEndpoints = {
        'modal1': '/api/hechhina-shodane',         // For "ಹೆಚ್ಚಿನ ಶೋಧನೆ"
        'modal2': '/api/akaradi-suchi',            // For "ಅಕಾರಾದಿ ಸೂಚಿ"
        'modal3': '/api/gaadigala-suchi',          // For "ಗಾದೆಗಳ ಸೂಚಿ"
        'modal4': '/api/lekhana-suchi',            // For "ಲೇಖನ ಸೂಚಿ"
        'modal5': '/api/artha-kosha',              // For "ಅರ್ಥ ಕೋಶ"
        'modal6': '/api/vishaya-parividi',         // For "ವಿಷಯ ಪರಿವಿಡಿ"
        'modal7': '/api/gamaka',                   // For "ಗಮಕ"
        'modal8': '/api/anubandha',               // For "ಅನುಬಂಧ"
        'modal9': '/api/tippani'                  // For "ಟಿಪ್ಪಣಿ"
    };

    async function fetchContent(modalId) {
        try {
            const response = await fetch(apiEndpoints[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            $(`#${modalId} .modal-body`).html(data);
        } catch (error) {
            $(`#${modalId} .modal-body`).html('<p>Sorry, there was an error loading the content.</p>');
            //console.error('Fetch error:', error);
        }
    }

    // Event listener for button clicks
    $('.button-list button').click(function () {
        const buttonText = $(this).text().trim();
        let modalId;

        // Map button text to modal ID
        switch (buttonText) {
            case 'ಹೆಚ್ಚಿನ ಶೋಧನೆ':
                modalId = 'modal1';
                break;
            case 'ಅಕಾರಾದಿ ಸೂಚಿ':
                modalId = 'modal2';
                break;
            case 'ಗಾದೆಗಳ ಸೂಚಿ':
                modalId = 'modal3';
                break;
            case 'ಲೇಖನ ಸೂಚಿ':
                modalId = 'modal4';
                break;
            case 'ಅರ್ಥ ಕೋಶ':
                modalId = 'modal5';
                break;
            case 'ವಿಷಯ ಪರಿವಿಡಿ':
                modalId = 'modal6';
                break;
            case 'ಗಮಕ':
                modalId = 'modal7';
                break;
            case 'ಅನುಬಂಧ':
                modalId = 'modal8';
                break;
            case 'ಟಿಪ್ಪಣಿ':
                modalId = 'modal9';
                break;
            default:
                modalId = null;
        }

        if (modalId) {
            fetchContent(modalId);
            new bootstrap.Modal(document.getElementById(modalId)).show();
        }
    });
});
