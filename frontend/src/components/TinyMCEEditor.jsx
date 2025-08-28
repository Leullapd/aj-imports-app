import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import './TinyMCEEditor.css';

const TinyMCEEditor = ({
  onSave,
  initialContent = '',
  height = '600px',
  readOnly = false
}) => {
  const editorRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    try {
      // Get the document content
      const content = editorRef.current.getContent();
      
      if (onSave) {
        onSave(content);
      }
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorInit = (evt, editor) => {
    editorRef.current = editor;
    
    // Set initial content if provided
    if (initialContent) {
      editor.setContent(initialContent);
    }
  };

  return (
    <div className="tinymce-editor">
      <div className="editor-header">
        <button 
          className="save-button" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Document'}
        </button>
        <div className="editor-info">
          <span className="editor-title">Professional Document Editor</span>
          <span className="editor-subtitle">TinyMCE - Full Featured</span>
        </div>
      </div>
      
      <div className="editor-container" style={{ height }}>
        <Editor
          onInit={handleEditorInit}
          initialValue={initialContent}
          disabled={readOnly}
                     apiKey="qagffr3pkuv17a8on1afax661irst1hbr4e6tbv888sz91jc" // Free TinyMCE API key
          init={{
            height: '100%',
            menubar: true,
                         plugins: [
               'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
               'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
               'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
               'template', 'paste', 'textcolor', 'colorpicker', 'textpattern',
               'nonbreaking', 'pagebreak', 'save', 'directionality', 'visualchars',
               'noneditable', 'charmap', 'hr', 'print', 'preview', 'toc',
               'quickbars'
             ],
                         toolbar: 'undo redo | blocks | ' +
               'bold italic forecolor backcolor | alignleft aligncenter ' +
               'alignright alignjustify | bullist numlist outdent indent | ' +
               'removeformat | help | fullscreen | preview | save | print | ' +
               'searchreplace | charmap | emoticons | insertdatetime | media | ' +
               'table | link image | code | wordcount | toc',
            content_style: `
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 14px; 
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              h1, h2, h3, h4, h5, h6 {
                color: #2c3e50;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
              }
              p {
                margin-bottom: 1em;
              }
              ul, ol {
                margin-bottom: 1em;
                padding-left: 2em;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 1em;
              }
              table, th, td {
                border: 1px solid #ddd;
              }
              th, td {
                padding: 8px 12px;
                text-align: left;
              }
              th {
                background-color: #f8f9fa;
                font-weight: bold;
              }
              blockquote {
                border-left: 4px solid #667eea;
                margin: 1em 0;
                padding-left: 1em;
                color: #666;
                font-style: italic;
              }
              code {
                background-color: #f8f9fa;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
              }
              pre {
                background-color: #f8f9fa;
                padding: 1em;
                border-radius: 5px;
                overflow-x: auto;
                border: 1px solid #e9ecef;
              }
            `,
            branding: false,
            promotion: false,
            statusbar: true,
            resize: true,
            elementpath: true,
                         paste_data_images: true,
             automatic_uploads: false,
             file_picker_types: 'image',
             images_upload_handler: function (blobInfo, success, failure) {
               try {
                 // Convert blob to base64 for inline images
                 const reader = new FileReader();
                 reader.onload = function() {
                   if (reader.result) {
                     success(reader.result);
                   } else {
                     failure('Failed to read image data');
                   }
                 };
                 reader.onerror = function() {
                   failure('Image upload failed');
                 };
                 reader.readAsDataURL(blobInfo.blob());
               } catch (error) {
                 failure('Image upload error: ' + error.message);
               }
             },
                         file_picker_callback: function (callback, value, meta) {
               if (meta.filetype === 'image') {
                 // Create file input
                 const input = document.createElement('input');
                 input.setAttribute('type', 'file');
                 input.setAttribute('accept', 'image/*');
                 
                 input.onchange = function() {
                   const file = this.files[0];
                   if (file) {
                     const reader = new FileReader();
                     reader.onload = function() {
                       callback(reader.result, {
                         alt: file.name
                       });
                     };
                     reader.readAsDataURL(file);
                   }
                 };
                 
                 input.click();
               }
             },
             setup: function (editor) {
               // Add custom save button to toolbar
               editor.ui.registry.addButton('save', {
                 text: 'Save',
                 tooltip: 'Save Document',
                 onAction: function () {
                   handleSave();
                 }
               });
             },
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
            quickbars_insert_toolbar: 'quickimage quicktable',
            contextmenu: 'link image imagetools table spellchecker configurepermanentpen',
            a11y_advanced_paths: true,
            skin: 'oxide',
            content_css: 'default'
          }}
        />
      </div>
      
      <div className="editor-footer">
        <div className="footer-info">
          <h4>Professional TinyMCE Editor Features:</h4>
          <ul>
            <li>✅ Full professional editor</li>
            <li>✅ Advanced formatting tools</li>
            <li>✅ Tables, images, and media</li>
            <li>✅ Image editing and resizing</li>
            <li>✅ Print and preview</li>
            <li>✅ Word count and statistics</li>
            <li>✅ Search and replace</li>
            <li>✅ Full-screen editing</li>
            <li>✅ Quick action bars</li>
            <li>✅ Accessibility features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TinyMCEEditor;
