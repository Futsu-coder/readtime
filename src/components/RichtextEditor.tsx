import { useMemo, useRef } from "react";
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

//ตั้งค่า Font Size
const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '30px' , '40px'];
const SizeStyle = Quill.import('attributors/style/size') as any;
SizeStyle.whitelist = sizes;
Quill.register({ 'formats/size': SizeStyle }, true);

// 🌟 2. ตั้งค่าไอคอน Undo / Redo
const icons = Quill.import('ui/icons') as Record<string, string>;
icons['undo'] = '<svg viewBox="0 0 18 18"> <polygon className="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon> <path className="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path> </svg>';
icons['redo'] = '<svg viewBox="0 0 18 18"> <polygon className="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon> <path className="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path> </svg>';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: string; 
}

export function RichTextEditor({ value, onChange, placeholder, height = '400px' }: RichTextEditorProps) {
    const quillRef = useRef<ReactQuill>(null);

    const modules = useMemo(() => ({
        history: { delay: 200, maxStack: 100, userOnly: true },
        toolbar: {
            container: [
                [{ 'size': [false, ...sizes] }],
                ['undo', 'redo'],
                ['bold', 'underline', 'italic', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean'],
                [{ 'align': [] }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link']
            ],
            handlers: {
                undo: () => { quillRef.current?.getEditor()?.history.undo(); },
                redo: () => { quillRef.current?.getEditor()?.history.redo(); }
            }
        }
    }), []);

    return (
        <>
            <style>
                {`
                ${sizes.map(size => `
                    .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${size}"]::before,
                    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${size}"]::before {
                        content: '${size}' !important;
                    }
                `).join('')}

                .ql-snow .ql-picker.ql-size .ql-picker-label::before,
                .ql-snow .ql-picker.ql-size .ql-picker-item::before {
                    content: 'ปกติ' !important; 
                }
                
                .ql-snow .ql-picker.ql-size {
                    width: 80px !important;
                }
                `}
            </style>

            <ReactQuill 
                ref={quillRef}       
                theme="snow"
                value={value} 
                onChange={onChange}
                modules={modules} 
                placeholder={placeholder}   
                style={{ 
                    height: height, 
                    backgroundColor: 'white', 
                    fontFamily: "'Sarabun', sans-serif", 
                    color: 'black' 
                }}
            />
        </>
    );
}