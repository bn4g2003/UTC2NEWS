
/**
 * Helper functions for handling post attachments embedded in content
 */

export interface Attachment {
    name: string;
    url: string;
}

export const serializeAttachments = (files: Attachment[]) => {
    if (!files || !files.length) return '';
    try {
        const json = JSON.stringify(files);
        const b64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(json))) : Buffer.from(unescape(encodeURIComponent(json))).toString('base64');
        return `<div id="post-attachments-data" style="display:none" data-b64="${b64}"></div>`;
    } catch (e) { return ''; }
};

export const parseAttachments = (content: string): Attachment[] => {
    if (!content) return [];
    const regex = /<div id="post-attachments-data" style="display:none" data-b64="(.*?)"><\/div>/;
    const match = content.match(regex);
    if (match && match[1]) {
        try {
            const b64 = match[1];
            const json = typeof window !== 'undefined' ? decodeURIComponent(escape(window.atob(b64))) : decodeURIComponent(escape(Buffer.from(b64, 'base64').toString()));
            return JSON.parse(json);
        } catch (e) { return []; }
    }
    return [];
};

export const stripAttachments = (content: string) => {
    if (!content) return '';
    return content.replace(/<div id="post-attachments-data" style="display:none" data-b64=".*?"><\/div>/g, '');
};
