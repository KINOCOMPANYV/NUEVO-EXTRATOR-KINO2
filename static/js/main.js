// ===================================
// Modern PDF Extractor - Main Script
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('pdf-input');
    const fileLabel = document.querySelector('.file-input-label');
    const fileName = document.querySelector('.file-name');
    const form = document.querySelector('form');
    const submitBtn = document.querySelector('.btn-primary');

    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                fileLabel.classList.add('has-file');
                fileName.textContent = file.name;
                fileName.classList.add('show');
            } else {
                fileLabel.classList.remove('has-file');
                fileName.textContent = '';
                fileName.classList.remove('show');
            }
        });
    }

    // Form submit handler - add loading state
    if (form && submitBtn) {
        form.addEventListener('submit', function (e) {
            if (fileInput && fileInput.files.length > 0) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Procesando...';
            }
        });
    }

    // Animate table rows on load
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
        row.style.animation = `fadeIn 0.5s ease-in-out ${index * 0.05}s both`;
    });

    // Add smooth scroll for results
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection) {
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }
});

// Drag and drop functionality
const container = document.querySelector('.container');
const fileInputWrapper = document.querySelector('.file-input-wrapper');
const fileInput = document.getElementById('pdf-input');

if (container && fileInputWrapper && fileInput) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        fileInputWrapper.querySelector('.file-input-label').style.borderColor = 'var(--primary-color)';
        fileInputWrapper.querySelector('.file-input-label').style.background = '#f8f9ff';
    }

    function unhighlight(e) {
        fileInputWrapper.querySelector('.file-input-label').style.borderColor = '';
        fileInputWrapper.querySelector('.file-input-label').style.background = '';
    }

    container.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0 && files[0].type === 'application/pdf') {
            fileInput.files = files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    }
}

// ===================================
// Copy Functionality
// ===================================

function toggleSelectAll(type) {
    const selectAllCheckbox = document.getElementById(`select-all-${type}`);
    const checkboxes = document.querySelectorAll(`.${type}-checkbox`);

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

function copyAllCodes(type) {
    const checkboxes = document.querySelectorAll(`.${type}-checkbox`);
    const codes = [];

    checkboxes.forEach(checkbox => {
        const codigo = checkbox.dataset.codigo;
        const cantidad = checkbox.dataset.cantidad;

        // Formato: codigo [TAB] [TAB] cantidad (simulando columna vacía en medio)
        if (codigo && codigo !== '?') {
            codes.push(`${codigo}\t\t${cantidad}`);
        }
    });

    if (codes.length > 0) {
        copyToClipboard(codes.join('\n'));
        showCopyNotification(`${codes.length} códigos copiados`);
    }
}

function copySelectedCodes() {
    const allCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const codes = [];

    allCheckboxes.forEach(checkbox => {
        const codigo = checkbox.dataset.codigo;
        const cantidad = checkbox.dataset.cantidad;

        // Formato: codigo [TAB] [TAB] cantidad
        if (codigo && codigo !== '?') {
            codes.push(`${codigo}\t\t${cantidad}`);
        }
    });

    if (codes.length > 0) {
        copyToClipboard(codes.join('\n'));
        showCopyNotification(`${codes.length} código${codes.length > 1 ? 's' : ''} copiado${codes.length > 1 ? 's' : ''}`);
    } else {
        showCopyNotification('Selecciona al menos un código', 'warning');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Códigos copiados exitosamente');
        }).catch(err => {
            console.error('Error al copiar:', err);
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        console.log('Códigos copiados (fallback)');
    } catch (err) {
        console.error('Error al copiar con fallback:', err);
    }

    document.body.removeChild(textarea);
}

function showCopyNotification(message = 'Códigos copiados al portapapeles!', type = 'success') {
    const notification = document.getElementById('copy-notification');
    const textElement = notification.querySelector('.notification-text');

    textElement.textContent = message;

    // Cambiar color según tipo
    if (type === 'warning') {
        notification.style.background = 'linear-gradient(135deg, #ff9800, #ff5722)';
    } else {
        notification.style.background = 'linear-gradient(135deg, var(--success-color), #2ECC40)';
    }

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
