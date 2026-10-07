const pdfParse = require('pdf-parse');

const MAX_TEXT_LENGTH = 100000;

const badGateway = (message) => Object.assign(new Error(message), { statusCode: 502 });

const extractTextFromPdf = async (pdfBuffer) => {
  try {
    const data = await pdfParse(pdfBuffer);
    const text = data.text || '';
    
    if (!text.trim()) {
      return '';
    }
    
    if (text.length > MAX_TEXT_LENGTH) {
      return text.slice(0, MAX_TEXT_LENGTH);
    }
    
    return text;
  } catch {
    // Any pdf-parse error (corrupted PDF, unsupported format, etc.) —
    // return empty string so caller can fall back to sending PDF to Gemini
    return '';
  }
};

module.exports = { extractTextFromPdf, MAX_TEXT_LENGTH };