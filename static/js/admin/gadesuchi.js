import { apiClient } from "../restclient.js";
import { ApiEndpoints } from "../endpoints.js";

$(document).ready(async function () {
    let table;

    // Search handler (called only on button click or Enter)
    function performSearch() {
        const searchValue = $("#searchInput").val().trim();
        table.search(searchValue).draw();
    }

    function resetForm() {
        $("#gadeId").val("");
        $("#gadeName").val("");
        $("#description").val("");
        $("#parvaSelect").val("");

        $("#sandhiSelect")
            .html('<option value="">ಮೊದಲು ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>')
            .prop("disabled", true);

        $("#padyaSelect")
            .html('<option value="">ಮೊದಲು ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>')
            .prop("disabled", true);

        $("#modalTitle").text("ಹೊಸ ಗಾದೆ ಸೇರಿಸಿ");
        $("#saveBtn").text("ಸೇರಿಸಿ");
    }

    async function loadParva(selectedParva = null) {
        try {
            const res = await apiClient.get(ApiEndpoints.PARVA.list);
            const data = res.data || [];
            const select = $("#parvaSelect");

            select.html('<option value="">ಆಯ್ಕೆಮಾಡಿ...</option>');
            data.forEach((p) => {
                select.append(`<option value="${p.parva_number}">${p.name}</option>`);
            });

            if (selectedParva) {
                select.val(String(selectedParva));
            }
        } catch (error) {
            alert("ಪರ್ವ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ\n" + (error.userMessage || error.message));
        }
    }

    async function loadSandhi(parvaNum, selectedSandhi = null) {
        const sandhiSelect = $("#sandhiSelect");
        const padyaSelect = $("#padyaSelect");

        sandhiSelect.html('<option value="">ಆಯ್ಕೆಮಾಡಿ...</option>').prop("disabled", true);
        padyaSelect.html('<option value="">ಮೊದಲು ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>').prop("disabled", true);

        if (!parvaNum) {
            return;
        }

        try {
            const res = await apiClient.get(ApiEndpoints.SANDHI.byParva(parvaNum));
            const data = res.data || [];
            sandhiSelect.html('<option value="">ಆಯ್ಕೆಮಾಡಿ...</option>');

            data.forEach((s) => {
                sandhiSelect.append(
                    `<option value="${s.sandhi_number}" data-padyas='${JSON.stringify(s.padya_numbers || [])}'>${s.name}</option>`
                );
            });

            sandhiSelect.prop("disabled", false);

            if (selectedSandhi) {
                sandhiSelect.val(String(selectedSandhi));
            }
        } catch (error) {
            alert("ಸಂಧಿ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ\n" + (error.userMessage || error.message));
        }
    }

    function loadPadyaFromSelectedSandhi(selectedPadya = null) {
        const padyaSelect = $("#padyaSelect");
        const padyas = $("#sandhiSelect").find(":selected").data("padyas") || [];

        padyaSelect.html('<option value="">ಆಯ್ಕೆಮಾಡಿ...</option>');

        if (!padyas.length) {
            padyaSelect.prop("disabled", true);
            return;
        }

        padyas.forEach((num) => {
            padyaSelect.append(`<option value="${num}">${num}</option>`);
        });

        padyaSelect.prop("disabled", false);

        if (selectedPadya) {
            padyaSelect.val(String(selectedPadya));
        }
    }

    // ✅ CRITICAL: This hides DataTables default search box
    function initTable() {
        table = $("#gadeTable").DataTable({
            processing: true,
            serverSide: true,
            searching: true,        // Keep search functionality
            dom: 'ltipr',          // NO 'f' = NO default search box
            ajax: {
                url: `${ApiEndpoints.GADESUCHI_API.list}/`,
                type: "GET",
                data: function (d) {
                    // Custom search value passed from performSearch()
                }
            },
            columns: [
                { data: "gade_suchi", orderable: true },
                { data: "parva_name", orderable: true, defaultContent: "" },
                {
                    data: null,
                    orderable: true,
                    render: function (data) {
                        return data.sandhi_name || data.sandhi_number || "";
                    }
                },
                { data: "padya_number", orderable: true },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    width: "120px",
                    render: function (data) {
                        return `
                  <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-info edit-btn" data-id="${data.id}" title="ಸಂಪಾದಿಸಿ">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-btn" data-id="${data.id}" title="ಅಳಿಸಿ">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                `;
                    }
                }
            ],
            language: {
                lengthMenu: "ಪ್ರತಿ ಪುಟಕ್ಕೆ _MENU_ ದಾಖಲೆಗಳು",
                info: "ಮೊತ್ತಂ _TOTAL_ ದಾಖಲೆಗಳಲ್ಲಿ _START_ ರಿಂದ _END_ ವರೆಗೆ",
                paginate: {
                    first: "ಮೊದಲು",
                    last: "ಅಂತಿಮ",
                    next: "ಮುಂದೆ",
                    previous: "ಹಿಂದೆ"
                },
                emptyTable: "ದಾಖಲೆಗಳು ಇಲ್ಲ",
                processing: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                zeroRecords: "ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ"
            },
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
            order: [[0, "asc"]],
            drawCallback: function () {
                $(".edit-btn").off("click").on("click", editGade);
                $(".delete-btn").off("click").on("click", deleteGade);
            }
        });
    }

    async function saveGade() {
        const id = $("#gadeId").val();

        const payload = {
            gade_suchi: $("#gadeName").val().trim(),
            description: $("#description").val().trim(),
            parva_number: parseInt($("#parvaSelect").val(), 10),
            sandhi_number: parseInt($("#sandhiSelect").val(), 10),
            padya_number: parseInt($("#padyaSelect").val(), 10)
        };

        if (
            !payload.gade_suchi ||
            Number.isNaN(payload.parva_number) ||
            Number.isNaN(payload.sandhi_number) ||
            Number.isNaN(payload.padya_number)
        ) {
            alert("ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳು (ಗಾದೆ ಹೆಸರು, ಪರ್ವ, ಸಂಧಿ, ಪದ್ಯ) ಭರ್ತಿಮಾಡಿ");
            return;
        }

        const method = id ? "PUT" : "POST";
        const url = id ? `${ApiEndpoints.GADESUCHI_API.get(id)}` : `${ApiEndpoints.GADESUCHI_API.create}`;

        try {
            await apiClient[method.toLowerCase()](url, payload);
            const modalEl = document.getElementById("gadeModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            modalInstance.hide();

            table.ajax.reload(null, false);
            resetForm();
        } catch (error) {
            alert("ಓಪರೇಶನ್ ವಿಫಲವಾಯಿತು\n" + (error.userMessage || error.message));
        }
    }

    async function editGade() {
        const id = $(this).data("id");

        try {
            const res = await apiClient.get(`${ApiEndpoints.GADESUCHI_API.get(id)}`);
            if (res.status !== "success") {
                alert(res.message || "ದಾಖಲೆ ಸಿಗಲಿಲ್ಲ");
                return;
            }

            const g = res.data;

            $("#gadeId").val(g.id);
            $("#gadeName").val(g.gade_suchi || "");
            $("#description").val(g.description || "");
            $("#modalTitle").text("ಗಾದೆ ಸಂಪಾದಿಸಿ");
            $("#saveBtn").text("ನವೀಕರಿಸಿ");

            await loadParva(g.parva_number);
            await loadSandhi(g.parva_number, g.sandhi_number);
            loadPadyaFromSelectedSandhi(g.padya_number);
            
            const modal = new bootstrap.Modal(document.getElementById("gadeModal"));
            modal.show();
        } catch (error) {
            alert("ದಾಖಲೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ\n" + (error.userMessage || error.message));
        }
    }

    async function deleteGade() {
        const id = $(this).data("id");

        if (!confirm("ಈ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಖಂಡಿತವಾಗಿ ಬಯಸುವಿರಾ?")) {
            return;
        }

        try {
            await apiClient.delete(`${ApiEndpoints.GADESUCHI_API.delete(id)}`);
            table.ajax.reload(null, false);
        } catch (error) {
            alert("ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ\n" + (error.userMessage || error.message));
        }
    }

    async function handleCsvUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            await apiClient.post(`${ApiEndpoints.GADESUCHI_API.bulkUpload}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("CSV ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಆಯಿತು");
            table.ajax.reload(null, false);
            $("#csvUpload").val("");
        } catch (error) {
            alert("CSV ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಯಿತು\n" + (error.userMessage || error.message));
            $("#csvUpload").val("");
        }
    }

    function downloadTemplate() {
        const csv =
            "\uFEFFgade_suchi,description,parva_number,sandhi_number,padya_number\n" +
            '"ಉದಾಹರಣೆ ಗಾದೆ","ಟಿಪ್ಪಣಿ","1","1","1"\n';

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "gadesuchi_template.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Event handlers
    $("#parvaSelect").on("change", function () {
        const parvaNum = parseInt($(this).val(), 10);
        loadSandhi(parvaNum);
    });

    $("#sandhiSelect").on("change", function () {
        loadPadyaFromSelectedSandhi();
    });

    $("#saveBtn").on("click", saveGade);
    $("#csvUpload").on("change", handleCsvUpload);
    $("#downloadTemplate").on("click", downloadTemplate);
    $("#refreshBtn").on("click", function () {
        table.ajax.reload(null, false);
    });

    // ✅ Search handlers (button + Enter)
    $("#searchBtn").on("click", performSearch);
    $("#searchInput").on("keypress", function (e) {
        if (e.which === 13) {
            e.preventDefault();
            performSearch();
        }
    });

    $("#gadeModal").on("hidden.bs.modal", function () {
        resetForm();
    });

    // Initialize
    await loadParva();
    initTable();
});