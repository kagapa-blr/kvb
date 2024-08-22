// Define API endpoints
const statsEndpoints = {
    parvaDetails: '/api/stats',
    searchByWord: '/api/stats/search_word', // Endpoint for POST request
};

let searchWord = "";

// Wait for the DOM to fully load before running the script
document.addEventListener('DOMContentLoaded', function () {
    fetchDetails();

    // Add event listener for the search form
    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission
        searchWord = document.getElementById('search-input').value.trim();
        if (searchWord) {
            searchByWord(searchWord);
        }
    });
});

// Fetch and display the details
async function fetchDetails() {
    try {
        const response = await fetch(statsEndpoints.parvaDetails);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        document.getElementById('total-parva').innerText = data.total_parva || 'N/A';
        document.getElementById('total-sandhi').innerText = data.total_sandhi || 'N/A';
        document.getElementById('total-padya-all').innerText = data.total_padya || 'N/A';
        document.getElementById('total-users').innerText = data.total_users || 'N/A';
        // document.getElementById('padya_in_each_parva').innerText = data.padya_in_each_parva || 'N/A';
        // document.getElementById('sandhi_in_each_parva').innerText = data.sandhi_in_each_parva || 'N/A';
        

        // Populate Padya in Each Sandhi table
        const padyaTableBody = document.getElementById('total-padya');
        padyaTableBody.innerHTML = ''; // Clear existing data
        
        data.padya_in_each_sandhi.forEach(([sandhi, padya]) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${sandhi}</td><td>${padya}</td>`;
            padyaTableBody.appendChild(row);
        });
    
        const sandhiParvaTableBody = document.getElementById('sandhi-in-each-parva')
        sandhiParvaTableBody.innerHTML = '';

    // Assuming data.sandhi_in_each_parva is an array of objects with properties: parva_id, parva_name, and total_sandhi
    data.sandhi_in_each_parva.forEach(({ parva_id, parva_name, total_sandhi }) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${parva_id}</td><td>${parva_name}</td><td>${total_sandhi}</td>`;
        sandhiParvaTableBody.appendChild(row);
    });



const parvaPadyaTableBody = document.getElementById('padya-in-each-parva');
parvaPadyaTableBody.innerHTML = '';

// Assuming data.padya_in_each_parva is an array of objects with properties: parva_id, parva_name, and total_padya
data.padya_in_each_parva.forEach(({ parva_id, parva_name, total_padya }) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${parva_id}</td><td>${parva_name}</td><td>${total_padya}</td>`;
    parvaPadyaTableBody.appendChild(row);
});

    
    } catch (error) {
        console.error('Error fetching details:', error);
    }
}

// Search for a word and display results
async function searchByWord(word) {
    try {
        const response = await fetch(statsEndpoints.searchByWord, {
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
                <p class="mb-1"><strong>ಸಂಧಿ ಸಂಖ್ಯೆ:</strong> ${result.sandhi_id}</p>
                <p class="mb-1"><strong>ಪದ್ಯ ಸಂಖ್ಯೆ:</strong> ${result.padya_number}</p>
                <p class="mb-3"><strong>ಪದ್ಯ:</strong> <pre class="bg-light p-2 rounded">${highlightWord(result.padya, searchWord)}</pre></p>
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
