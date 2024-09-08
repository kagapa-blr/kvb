document.addEventListener('DOMContentLoaded', function () {
    // API endpoints mapped to modal IDs
    const additionalApi = {
        'modal1': '/api/stats/search_word',         // For "ಹೆಚ್ಚಿನ ಶೋಧನೆ"
        'modal2': '/api/akaradi-suchi',            // For "ಅಕಾರಾದಿ ಸೂಚಿ"
        'modal3': '/api/gaadigala-suchi',          // For "ಗಾದೆಗಳ ಸೂಚಿ"
        'modal4': '/api/lekhana-suchi',            // For "ಲೇಖನ ಸೂಚಿ"
        'modal5': '/api/artha-kosha',              // For "ಅರ್ಥ ಕೋಶ"
        'modal6': '/api/vishaya-parividi',         // For "ವಿಷಯ ಪರಿವಿಡಿ"
        'modal7': '/api/gamaka',                   // For "ಗಮಕ"
        'modal8': '/api/anubandha',                // For "ಅನುಬಂಧ"
        'modal9': '/api/tippani'                   // For "ಟಿಪ್ಪಣಿ"
    };


    async function fetchSearchWord() {

            // Add event listener for the search form
    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission
        searchWord = document.getElementById('search-input').value.trim();
        if (searchWord) {
            searchByWord(searchWord);
        }
    });

    }

    // Fetch function for each modal
    async function fetchSuchi() {
        const modalId = 'modal2';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    async function fetchGaadigala() {
        const modalId = 'modal3';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    async function fetchLekhana() {
        const modalId = 'modal4';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    async function fetchKosha() {
        const modalId = 'modal5';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    async function fetchParividi() {
        const modalId = 'modal6';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    async function fetchGamaka() {
        const modalId = 'modal7';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    async function fetchAnubandha() {
        const modalId = 'modal8';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    async function fetchTippani() {
        const modalId = 'modal9';
        try {
            const response = await fetch(additionalApi[modalId]);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.text();
            document.querySelector(`#${modalId} .modal-body`).innerHTML = data;
        } catch (error) {
            document.querySelector(`#${modalId} .modal-body`).innerHTML = '<p>Sorry, there was an error loading the content.</p>';
            console.error('Fetch error:', error);
        }
    }

    // Event listener for button clicks
    document.querySelectorAll('.button-list button').forEach(function (button) {
        button.addEventListener('click', function () {
            const buttonText = button.textContent.trim();
            let fetchFunction;

            // Map button text to corresponding fetch function
            switch (buttonText) {
                case 'ಹೆಚ್ಚಿನ ಶೋಧನೆ':
                    fetchFunction = fetchSearchWord;
                    break;
                // case 'ಅಕಾರಾದಿ ಸೂಚಿ':
                //     fetchFunction = fetchSuchi;
                //     break;
                // case 'ಗಾದೆಗಳ ಸೂಚಿ':
                //     fetchFunction = fetchGaadigala;
                //     break;
                // case 'ಲೇಖನ ಸೂಚಿ':
                //     fetchFunction = fetchLekhana;
                //     break;
                case 'ಅರ್ಥ ಕೋಶ':
                    fetchFunction = fetchKosha;
                    break;
                case 'ವಿಷಯ ಪರಿವಿಡಿ':
                    fetchFunction = fetchParividi;
                    break;
                case 'ಗಮಕ':
                    fetchFunction = fetchGamaka;
                    break;
                case 'ಅನುಬಂಧ':
                    fetchFunction = fetchAnubandha;
                    break;
                case 'ಟಿಪ್ಪಣಿ':
                    fetchFunction = fetchTippani;
                    break;
                default:
                    fetchFunction = null;
            }

            if (fetchFunction) {
                fetchFunction();
                const modalElement = document.getElementById(`modal${Object.keys(additionalApi).find(id => additionalApi[id].includes(buttonText))}`);
                if(modalElement){
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
                
                
            }
        });
    });

    let searchWord = "";


    // Search for a word and display results
    async function searchByWord(word) {
        try {
            const response = await fetch(additionalApi['modal1'], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ search_word: word }), // Send search word in request body
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            displaySearchResults(data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    }

    // Display search results
    function displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = ''; // Clear previous results

        // Display total results count
        const totalResults = results.length;
        const resultsSummary = document.createElement('div');
        resultsSummary.className = 'mb-3';
        resultsSummary.innerHTML = `
            <p class="text-muted">Found ${totalResults} result${totalResults !== 1 ? 's' : ''}.</p>
        `;
        resultsContainer.appendChild(resultsSummary);

        if (totalResults === 0) {
            resultsContainer.innerHTML += `
                <li class="list-group-item text-center text-muted">
                    No results found.
                </li>
            `;
        } else {
            results.forEach(result => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item mb-3 p-3 border rounded shadow-sm'; // Add margin and padding for better spacing

                listItem.innerHTML = `
                    <h5 class="mb-2"><strong>ಪರ್ವದ ಹೆಸರು:</strong> ${result.parva_name}</h5>
                    <p class="mb-1"><strong>ಸಂಧಿ ಸಂಖ್ಯೆ:</strong> ${result.sandhi_number}</p>
                    <p class="mb-1"><strong>ಪದ್ಯ ಸಂಖ್ಯೆ:</strong> ${result.padya_number}</p>
                    <p class="mb-3"><strong>ಪದ್ಯ:</strong> <pre class="p-2 rounded">${highlightWord(result.padya, searchWord)}</pre></p>
                    <p class="mb-1"><strong>ಅರ್ಥ:</strong> ${result.artha}</p>
                    <p class="mb-1"><strong>ಟಿಪ್ಪಣಿ:</strong> ${result.tippani.replace('nan','-')}</p>
                    <p class="mb-1"><strong>ಪಾಠಾಂತರ:</strong> ${result.pathantar}</p>
                `;
                
                resultsContainer.appendChild(listItem);
            });
        }
    }

    // Function to escape HTML entities
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    // Function to highlight the search word with a yellow background
    function highlightWord(text, word) {
        const escapedWord = escapeHtml(word);
        const regex = new RegExp(`(${escapedWord})`, 'gi'); // Case-insensitive search
        return escapeHtml(text).replace(regex, '<span style="background-color: yellow;">$1</span>');
    }



    
});
