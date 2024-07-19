$(document).ready(function() {
    const dropdown1 = $('#dropdown1');
    const dropdown2 = $('#dropdown2');
    const dropdown3 = $('#dropdown3');
    const result = $('#result');

    function updateResult() {
        const value1 = dropdown1.val();
        const value2 = dropdown2.val();
        const value3 = dropdown3.val();
        result.val(`Selected values:\nDropdown 1: ${value1}\nDropdown 2: ${value2}\nDropdown 3: ${value3}`);
    }

    dropdown1.change(updateResult);
    dropdown2.change(updateResult);
    dropdown3.change(updateResult);
});
