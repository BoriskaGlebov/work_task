class DocumentEditor {
  constructor() {
    this.documents = JSON.parse(localStorage.getItem('documents')) || [];
    this.currentDoc = null;
    this.initializeElements();
    this.attachEventListeners();
    this.renderDocumentsList();
  }

  initializeElements() {
    this.editor = document.getElementById('editor');
    this.docsList = document.getElementById('docsList');
    this.newDocBtn = document.getElementById('newDoc');
    this.saveBtn = document.getElementById('save');
    this.boldBtn = document.getElementById('bold');
    this.italicBtn = document.getElementById('italic');
    this.underlineBtn = document.getElementById('underline');
    this.fontSizeSelect = document.getElementById('fontSize');
    
    // New form elements
    this.urgencyCategory = document.getElementById('urgencyCategory');
    this.documentNumber = document.getElementById('documentNumber');
    this.senderAddress = document.getElementById('senderAddress');
    this.senderName = document.getElementById('senderName');
    this.receiverAddress = document.getElementById('receiverAddress');
    this.receiverName = document.getElementById('receiverName');
    this.signatureNumber = document.getElementById('signatureNumber');
    this.signatureDate = document.getElementById('signatureDate');
    this.signerName = document.getElementById('signerName');
  }

  attachEventListeners() {
    this.newDocBtn.addEventListener('click', () => this.createNewDocument());
    this.saveBtn.addEventListener('click', () => this.saveCurrentDocument());
    this.boldBtn.addEventListener('click', () => this.formatText('bold'));
    this.italicBtn.addEventListener('click', () => this.formatText('italic'));
    this.underlineBtn.addEventListener('click', () => this.formatText('underline'));
    this.fontSizeSelect.addEventListener('change', (e) => this.changeFontSize(e.target.value));
    
    // Auto-save every 30 seconds
    setInterval(() => this.saveCurrentDocument(), 30000);
  }

  createNewDocument() {
    const doc = {
      id: Date.now(),
      title: `Документ ${this.documents.length + 1}`,
      urgencyCategory: 'normal',
      documentNumber: '',
      senderAddress: '',
      senderName: '',
      receiverAddress: '',
      receiverName: '',
      content: '',
      signatureNumber: '',
      signatureDate: '',
      signerName: '',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    this.documents.push(doc);
    this.currentDoc = doc;
    this.clearForm();
    this.editor.innerHTML = '';
    this.editor.focus();
    this.saveToLocalStorage();
    this.renderDocumentsList();
  }

  clearForm() {
    this.urgencyCategory.value = 'normal';
    this.documentNumber.value = '';
    this.senderAddress.value = '';
    this.senderName.value = '';
    this.receiverAddress.value = '';
    this.receiverName.value = '';
    this.signatureNumber.value = '';
    this.signatureDate.value = '';
    this.signerName.value = '';
  }

  saveCurrentDocument() {
    if (!this.currentDoc) return;

    this.currentDoc.urgencyCategory = this.urgencyCategory.value;
    this.currentDoc.documentNumber = this.documentNumber.value;
    this.currentDoc.senderAddress = this.senderAddress.value;
    this.currentDoc.senderName = this.senderName.value;
    this.currentDoc.receiverAddress = this.receiverAddress.value;
    this.currentDoc.receiverName = this.receiverName.value;
    this.currentDoc.content = this.editor.innerHTML;
    this.currentDoc.signatureNumber = this.signatureNumber.value;
    this.currentDoc.signatureDate = this.signatureDate.value;
    this.currentDoc.signerName = this.signerName.value;
    this.currentDoc.modified = new Date().toISOString();

    this.saveToLocalStorage();
    this.renderDocumentsList();
  }

  loadDocument(id) {
    const doc = this.documents.find(d => d.id === id);
    if (doc) {
      this.currentDoc = doc;
      this.urgencyCategory.value = doc.urgencyCategory || 'normal';
      this.documentNumber.value = doc.documentNumber || '';
      this.senderAddress.value = doc.senderAddress || '';
      this.senderName.value = doc.senderName || '';
      this.receiverAddress.value = doc.receiverAddress || '';
      this.receiverName.value = doc.receiverName || '';
      this.editor.innerHTML = doc.content || '';
      this.signatureNumber.value = doc.signatureNumber || '';
      this.signatureDate.value = doc.signatureDate || '';
      this.signerName.value = doc.signerName || '';
    }
  }

  deleteDocument(id) {
    this.documents = this.documents.filter(d => d.id !== id);
    if (this.currentDoc && this.currentDoc.id === id) {
      this.currentDoc = null;
      this.clearForm();
      this.editor.innerHTML = '<p>Введите текст документа здесь...</p>';
    }
    this.saveToLocalStorage();
    this.renderDocumentsList();
  }

  formatText(command) {
    document.execCommand(command, false, null);
    this.editor.focus();
  }

  changeFontSize(size) {
    document.execCommand('fontSize', false, size);
    this.editor.focus();
  }

  saveToLocalStorage() {
    localStorage.setItem('documents', JSON.stringify(this.documents));
  }

  renderDocumentsList() {
    this.docsList.innerHTML = '';
    this.documents.forEach(doc => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="document-item">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span class="urgency-${doc.urgencyCategory}">●</span>
          ${doc.documentNumber ? `№${doc.documentNumber} - ` : ''}${doc.title}
        </div>
        <button class="delete-btn" data-id="${doc.id}">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      `;
      
      li.querySelector('.document-item').addEventListener('click', () => this.loadDocument(doc.id));
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteDocument(doc.id);
      });

      this.docsList.appendChild(li);
    });
  }
}

class DocumentConverter {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.currentFileName = '';
  }

  initializeElements() {
    this.fileInput = document.getElementById('fileInput');
    this.fileName = document.getElementById('fileName');
    this.editor = document.getElementById('editor');
    this.saveBtn = document.getElementById('saveAsTxt');
  }

  attachEventListeners() {
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.saveBtn.addEventListener('click', () => this.saveAsTxt());
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Пожалуйста, загрузите файл формата .docx');
      return;
    }

    this.currentFileName = file.name.replace('.docx', '');
    this.fileName.value = file.name;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      this.editor.innerHTML = result.value;
      this.saveBtn.disabled = false;
    } catch (error) {
      console.error('Error converting file:', error);
      alert('Ошибка при чтении файла. Пожалуйста, проверьте файл и попробуйте снова.');
    }
  }

  saveAsTxt() {
    // Get text content and clean it up
    const content = this.editor.innerText;
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentFileName || 'document'}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize the editor and converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new DocumentEditor();
  new DocumentConverter();
});